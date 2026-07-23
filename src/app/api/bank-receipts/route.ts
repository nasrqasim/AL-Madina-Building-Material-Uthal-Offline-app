import { fail, ok } from "@/lib/api";
import { offlineDB, generateUniqueId } from "@/lib/dexie";
import { postBankReceiptJournalEntries, recalculatePartyBalance } from "@/lib/offline/postingService";

export async function GET() {
  try {
    const receipts = await offlineDB.bankReceipts.toArray();
    const parties = await offlineDB.parties.toArray();
    const banks = await offlineDB.banks.toArray();

    const partyMap = new Map(parties.map(p => [p.id, p]));
    const bankMap = new Map(banks.map(b => [b.id, b]));

    const rows = receipts.map(r => {
      const party = r.partyId ? partyMap.get(r.partyId) : undefined;
      const bank = r.bankId ? bankMap.get(r.bankId) : undefined;
      return {
        ...r,
        party: party?.name || r.party || "",
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
      let attempt = (await offlineDB.bankReceipts.count()) + 1;
      let isUnique = false;
      while (!isUnique) {
        const candidate = `BRV-${attempt.toString().padStart(5, "0")}`;
        const existing = await offlineDB.bankReceipts.where("receiptNumber").equals(candidate).first();
        if (!existing) {
          body.voucherNo = candidate;
          isUnique = true;
        } else {
          attempt++;
        }
      }
    }

    const receiptRecord = {
      id,
      _id: id,
      receiptNumber: body.voucherNo,
      date: body.date || new Date().toISOString(),
      party: body.customerId || "",
      partyId: body.customerId || null,
      bankId: body.bankAccountId || null,
      amount: Number(body.totalAmount) || 0,
      netAmount: Number(body.totalAmount) || 0,
      narration: body.narration || "",
      status: "Posted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.bankReceipts.add(receiptRecord);

    await postBankReceiptJournalEntries(receiptRecord);
    if (body.customerId) {
      await recalculatePartyBalance(body.customerId);
    }

    return ok(receiptRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
