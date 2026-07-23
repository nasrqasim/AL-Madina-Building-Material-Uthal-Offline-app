import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

// TODO: Update these service functions to use IndexedDB
// import { recalculatePartyBalance, postBankPaymentJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const oldDoc = await offlineDB.bankPayments.get(params.id) as any;
    const updatedPayment = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.bankPayments.update(params.id, updatedPayment);
    const row = await offlineDB.bankPayments.get(params.id);
    if (!row) return fail("Not found", 404);

    if ((row as any).status === "Posted" || (row as any).status === "posted") {
      // TODO: await postBankPaymentJournalEntries(row);
    } else {
      const allJournalEntries = await offlineDB.journalEntries.toArray();
      const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === (row as any).voucherNo);
      for (const entry of entriesToDelete) {
        await offlineDB.journalEntries.delete(entry.id);
      }
    }

    const oldVendorId = oldDoc?.vendor || oldDoc?.partyId;
    const newVendorId = (row as any).vendor || (row as any).partyId;
    if (oldVendorId) {
      // TODO: await recalculatePartyBalance(String(oldVendorId));
    }
    if (newVendorId && String(newVendorId) !== String(oldVendorId)) {
      // TODO: await recalculatePartyBalance(String(newVendorId));
    }
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const oldDoc = await offlineDB.bankPayments.get(params.id) as any;
    if (oldDoc) {
      const allJournalEntries = await offlineDB.journalEntries.toArray();
      const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === oldDoc.voucherNo);
      for (const entry of entriesToDelete) {
        await offlineDB.journalEntries.delete(entry.id);
      }
      await offlineDB.bankPayments.delete(params.id);
      const vendorId = oldDoc.vendor || oldDoc.partyId;
      if (vendorId) {
        // TODO: await recalculatePartyBalance(String(vendorId));
      }
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
