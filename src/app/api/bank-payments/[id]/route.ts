import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import BankPayment from "@/models/BankPayment";
import JournalEntry from "@/models/JournalEntry";
import { recalculatePartyBalance, postBankPaymentJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const oldDoc = await BankPayment.findById(params.id).lean() as any;
    const row = await BankPayment.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Not found", 404);

    if (row.status === "Posted" || row.status === "posted") {
      await postBankPaymentJournalEntries(row);
    } else {
      await JournalEntry.deleteMany({ voucherNo: row.voucherNo });
    }

    const oldVendorId = oldDoc?.vendor || oldDoc?.partyId;
    const newVendorId = row.vendor || row.partyId;
    if (oldVendorId) await recalculatePartyBalance(String(oldVendorId));
    if (newVendorId && String(newVendorId) !== String(oldVendorId)) {
      await recalculatePartyBalance(String(newVendorId));
    }
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const oldDoc = await BankPayment.findById(params.id).lean() as any;
    if (oldDoc) {
      await JournalEntry.deleteMany({ voucherNo: oldDoc.voucherNo });
      await BankPayment.findByIdAndDelete(params.id);
      const vendorId = oldDoc.vendor || oldDoc.partyId;
      if (vendorId) await recalculatePartyBalance(String(vendorId));
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
