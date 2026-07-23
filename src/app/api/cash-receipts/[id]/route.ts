import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

// TODO: Update these service functions to use IndexedDB
// import { recalculatePartyBalance, postCashReceiptJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const oldDoc = await offlineDB.cashReceipts.get(params.id) as any;
    const updatedReceipt = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.cashReceipts.update(params.id, updatedReceipt);
    const row = await offlineDB.cashReceipts.get(params.id);
    if (!row) return fail("Not found", 404);

    if ((row as any).status === "Posted") {
      // TODO: await postCashReceiptJournalEntries(row);
    } else {
      const allJournalEntries = await offlineDB.journalEntries.toArray();
      const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === (row as any).receiptNumber);
      for (const entry of entriesToDelete) {
        await offlineDB.journalEntries.delete(entry.id);
      }
    }

    const oldPartyId = oldDoc?.partyId || oldDoc?.party;
    const newPartyId = (row as any).partyId || (row as any).party;
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
    const oldDoc = await offlineDB.cashReceipts.get(params.id) as any;
    if (oldDoc) {
      const allJournalEntries = await offlineDB.journalEntries.toArray();
      const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === oldDoc.receiptNumber);
      for (const entry of entriesToDelete) {
        await offlineDB.journalEntries.delete(entry.id);
      }
      await offlineDB.cashReceipts.delete(params.id);
      const partyId = oldDoc.partyId || oldDoc.party;
      if (partyId) {
        // TODO: await recalculatePartyBalance(String(partyId));
      }
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
