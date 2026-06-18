import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import BankReceipt from "@/models/BankReceipt";
import JournalEntry from "@/models/JournalEntry";
import { recalculatePartyBalance, postBankReceiptJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const oldDoc = await BankReceipt.findById(params.id).lean() as any;
    const row = await BankReceipt.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Not found", 404);

    if (row.status === "Posted" || row.status === "posted") {
      await postBankReceiptJournalEntries(row);
    } else {
      await JournalEntry.deleteMany({ voucherNo: row.receiptNumber || row.voucherNo });
    }

    const oldPartyId = oldDoc?.party || oldDoc?.partyId;
    const newPartyId = row.party || row.partyId;
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
    const oldDoc = await BankReceipt.findById(params.id).lean() as any;
    if (oldDoc) {
      await JournalEntry.deleteMany({ voucherNo: oldDoc.receiptNumber || oldDoc.voucherNo });
      await BankReceipt.findByIdAndDelete(params.id);
      const partyId = oldDoc.party || oldDoc.partyId;
      if (partyId) await recalculatePartyBalance(String(partyId));
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
