import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashReceipt from "@/models/CashReceipt";
import JournalEntry from "@/models/JournalEntry";
import { recalculatePartyBalance, postCashReceiptJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const oldDoc = await CashReceipt.findById(params.id).lean() as any;
    const row = await CashReceipt.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Not found", 404);

    if (row.status === "Posted") {
      await postCashReceiptJournalEntries(row);
    } else {
      await JournalEntry.deleteMany({ voucherNo: row.receiptNumber });
    }

    const oldPartyId = oldDoc?.partyId || oldDoc?.party;
    const newPartyId = row.partyId || row.party;
    if (oldPartyId) await recalculatePartyBalance(String(oldPartyId));
    if (newPartyId && String(newPartyId) !== String(oldPartyId)) {
      await recalculatePartyBalance(String(newPartyId));
    }
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const oldDoc = await CashReceipt.findById(params.id).lean() as any;
    if (oldDoc) {
      await JournalEntry.deleteMany({ voucherNo: oldDoc.receiptNumber });
      await CashReceipt.findByIdAndDelete(params.id);
      const partyId = oldDoc.partyId || oldDoc.party;
      if (partyId) await recalculatePartyBalance(String(partyId));
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
