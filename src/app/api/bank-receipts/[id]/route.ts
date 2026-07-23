import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

// TODO: Update these service functions to use IndexedDB
// import { recalculatePartyBalance, postBankReceiptJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const oldDoc = await offlineDB.bankReceipts.get(params.id) as any;
    const updatedReceipt = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.bankReceipts.update(params.id, updatedReceipt);
    const row = await offlineDB.bankReceipts.get(params.id);
    if (!row) return fail("Not found", 404);

    if ((row as any).status === "Posted" || (row as any).status === "posted") {
      // TODO: await postBankReceiptJournalEntries(row);
    } else {
      const allJournalEntries = await offlineDB.journalEntries.toArray();
      const entriesToDelete = allJournalEntries.filter((je: any) => 
        je.voucherNo === ((row as any).receiptNumber || (row as any).voucherNo)
      );
      for (const entry of entriesToDelete) {
        await offlineDB.journalEntries.delete(entry.id);
      }
    }

    const oldPartyId = oldDoc?.party || oldDoc?.partyId;
    const newPartyId = (row as any).party || (row as any).partyId;
    if (oldPartyId) {
      // TODO: await recalculatePartyBalance(String(oldPartyId));
    }
    if (newPartyId && String(newPartyId) !== String(oldPartyId)) {
      // TODO: await recalculatePartyBalance(String(newPartyId));
    }
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const oldDoc = await offlineDB.bankReceipts.get(params.id) as any;
    if (oldDoc) {
      const allJournalEntries = await offlineDB.journalEntries.toArray();
      const entriesToDelete = allJournalEntries.filter((je: any) => 
        je.voucherNo === (oldDoc.receiptNumber || oldDoc.voucherNo)
      );
      for (const entry of entriesToDelete) {
        await offlineDB.journalEntries.delete(entry.id);
      }
      await offlineDB.bankReceipts.delete(params.id);
      const partyId = oldDoc.party || oldDoc.partyId;
      if (partyId) {
        // TODO: await recalculatePartyBalance(String(partyId));
      }
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
