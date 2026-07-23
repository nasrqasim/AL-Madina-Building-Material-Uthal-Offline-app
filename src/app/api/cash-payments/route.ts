import { fail, ok } from "@/lib/api";
import { offlineDB, generateUniqueId } from "@/lib/dexie";
import { recalculatePartyBalance, postCashPaymentJournalEntries } from "@/lib/offline/postingService";

export async function GET() {
  try {
    const payments = await offlineDB.cashPayments.toArray();
    const parties = await offlineDB.parties.toArray();
    const accounts = await offlineDB.accounts.toArray();

    const partyMap = new Map(parties.map(p => [p.id, p]));
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    const rows = payments.map(p => {
      const party = p.partyId ? partyMap.get(p.partyId) : undefined;
      const account = p.cashAccountId ? accountMap.get(p.cashAccountId) : undefined;
      return {
        ...p,
        partyId: party,
        cashAccountId: account
      };
    });

    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = generateUniqueId();

    if (!body.voucherNo || body.voucherNo === "Auto-generated") {
      let attempt = (await offlineDB.cashPayments.count()) + 1;
      let isUnique = false;
      while (!isUnique) {
        const candidate = `CPV-${attempt.toString().padStart(5, "0")}`;
        const existing = await offlineDB.cashPayments.where("voucherNo").equals(candidate).first();
        if (!existing) {
          body.voucherNo = candidate;
          isUnique = true;
        } else {
          attempt++;
        }
      }
    }

    const paymentType = body.paymentType === "petty" ? "petty" : "party";
    let amount = Number(body.amount ?? body.totalAmount) || 0;
    const whtRate = Number(body.whtRate) || 0;
    let whtAmount = Number(body.whtAmount) || 0;

    if (paymentType === "petty" && Array.isArray(body.contraLines) && body.contraLines.length) {
      amount = body.contraLines.reduce((s: number, l: { amount?: number }) => s + (Number(l.amount) || 0), 0);
      whtAmount = (amount * whtRate) / 100;
    }

    const netPaid = amount - whtAmount;
    const partyId = body.partyId || body.vendorId || null;

    const paymentRecord = {
      id,
      _id: id,
      voucherNo: body.voucherNo,
      paymentType,
      date: body.date || new Date().toISOString(),
      partyId: partyId || null,
      vendor: partyId ? String(partyId) : "",
      cashAccountId: body.cashAccountId || null,
      cashAccountTitle: body.cashAccountTitle || "",
      reference: body.reference || "",
      narration: body.narration || body.internalNotes || "",
      jobId: body.jobId || null,
      amount,
      whtRate,
      whtAmount,
      netPaid,
      notes: body.notes || body.internalNotes || "",
      status: body.status || "Posted",
      mode: paymentType === "petty" ? "Petty" : "Party",
      partyPaymentType: body.partyPaymentType || "",
      isRefund: !!body.isRefund,
      contraLines: body.contraLines || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.cashPayments.add(paymentRecord);

    if (paymentRecord.status === "Posted") {
      await postCashPaymentJournalEntries(paymentRecord);
      if (partyId) {
        await recalculatePartyBalance(partyId);
      }
    }

    return ok(paymentRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
