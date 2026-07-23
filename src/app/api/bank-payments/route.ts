import { fail, ok } from "@/lib/api";
import { offlineDB, generateUniqueId } from "@/lib/dexie";
import { postBankPaymentJournalEntries, recalculatePartyBalance } from "@/lib/offline/postingService";

export async function GET() {
  try {
    const payments = await offlineDB.bankPayments.toArray();
    const parties = await offlineDB.parties.toArray();
    const banks = await offlineDB.banks.toArray();

    const partyMap = new Map(parties.map(p => [p.id, p]));
    const bankMap = new Map(banks.map(b => [b.id, b]));

    const rows = payments.map(p => {
      const party = p.partyId ? partyMap.get(p.partyId) : undefined;
      const bank = p.bankId ? bankMap.get(p.bankId) : undefined;
      return {
        ...p,
        vendor: party?.name || p.vendor || "",
        bankAccount: bank?.name || ""
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
      let attempt = (await offlineDB.bankPayments.count()) + 1;
      let isUnique = false;
      while (!isUnique) {
        const candidate = `BPV-${attempt.toString().padStart(5, "0")}`;
        const existing = await offlineDB.bankPayments.where("voucherNo").equals(candidate).first();
        if (!existing) {
          body.voucherNo = candidate;
          isUnique = true;
        } else {
          attempt++;
        }
      }
    }

    const whtAmount = Number(body.whtAmount) || 0;
    const netAmount = Number(body.totalAmount) - whtAmount;

    const paymentRecord = {
      id,
      _id: id,
      voucherNo: body.voucherNo,
      date: body.date || new Date().toISOString(),
      partyId: body.vendorId || null,
      vendor: body.vendorId ? String(body.vendorId) : "",
      bankId: body.bankAccountId || null,
      bankAccount: "",
      amount: Number(body.totalAmount) || 0,
      wht: whtAmount,
      netAmount,
      narration: body.narration || "",
      partyPaymentType: body.partyPaymentType || "",
      isRefund: !!body.isRefund,
      status: "Posted",
      mode: "Bank",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.bankPayments.add(paymentRecord);

    await postBankPaymentJournalEntries(paymentRecord);
    if (body.vendorId) {
      await recalculatePartyBalance(body.vendorId);
    }

    return ok(paymentRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
