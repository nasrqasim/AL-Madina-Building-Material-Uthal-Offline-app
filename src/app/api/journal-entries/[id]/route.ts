import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

// TODO: Update these service functions to use IndexedDB
// import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    // Find the original journal entry to get its voucherNo and date
    const original = await offlineDB.journalEntries.get(id);
    if (!original) return fail("Journal entry not found");

    const oldVoucherNo = (original as any).voucherNo;

    // Delete existing entries with the same voucherNo
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === oldVoucherNo);
    for (const entry of entriesToDelete) {
      await offlineDB.journalEntries.delete(entry.id);
    }

    // Re-create new journal entries (debit and credit)
    const newEntries = Array.isArray(body.entries) ? body.entries : [body];
    const entriesWithIds = newEntries.map((entry: any) => ({
      ...entry,
      id: generateUniqueId(),
      createdAt: new Date().toISOString()
    }));
    await offlineDB.journalEntries.bulkAdd(entriesWithIds as any);
    const created = entriesWithIds;

    // Sync CashPayment or CashReceipt if party is involved
    const partyId = body.partyId;
    const partyType = body.partyType; // "customer" or "vendor"

    // Clean up old cash records
    const allCashPayments = await offlineDB.cashPayments.toArray();
    const oldPayment = allCashPayments.find((cp: any) => cp.voucherNo === oldVoucherNo);
    if (oldPayment) {
      await offlineDB.cashPayments.delete(oldPayment.id);
      if (oldPayment.partyId) {
        // TODO: await recalculatePartyBalance(String(oldPayment.partyId));
      }
    }

    const allCashReceipts = await offlineDB.cashReceipts.toArray();
    const oldReceipt = allCashReceipts.find((cr: any) => cr.receiptNumber === oldVoucherNo);
    if (oldReceipt) {
      await offlineDB.cashReceipts.delete(oldReceipt.id);
      if (oldReceipt.partyId) {
        // TODO: await recalculatePartyBalance(String(oldReceipt.partyId));
      }
    }

    // Create new cash record if party is selected
    if (partyId && partyType) {
      const amount = Number(body.amount) || 0;
      const date = body.date || new Date().toISOString().split("T")[0];
      const remarks = body.remarks || "";
      const voucherNo = body.voucherNo || oldVoucherNo;

      if (partyType === "vendor") {
        const paymentId = generateUniqueId();
        await offlineDB.cashPayments.add({
          id: paymentId,
          voucherNo,
          paymentType: "party",
          date,
          partyId,
          vendor: String(partyId),
          amount,
          narration: remarks,
          status: "Posted",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
        // TODO: await recalculatePartyBalance(String(partyId));
      } else if (partyType === "customer") {
        const receiptId = generateUniqueId();
        await offlineDB.cashReceipts.add({
          id: receiptId,
          receiptNumber: voucherNo,
          receiptType: "party",
          date,
          partyId,
          amount,
          narration: remarks,
          status: "Posted",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
        // TODO: await recalculatePartyBalance(String(partyId));
      }
    }

    return ok(created);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const entry = await offlineDB.journalEntries.get(id);
    if (!entry) return fail("Journal entry not found");

    const voucherNo = (entry as any).voucherNo;

    // Delete all journal entries with the same voucherNo
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === voucherNo);
    for (const entryToDelete of entriesToDelete) {
      await offlineDB.journalEntries.delete(entryToDelete.id);
    }

    // Clean up cash records if any
    const allCashPayments = await offlineDB.cashPayments.toArray();
    const payment = allCashPayments.find((cp: any) => cp.voucherNo === voucherNo);
    if (payment) {
      await offlineDB.cashPayments.delete(payment.id);
      if (payment.partyId) {
        // TODO: await recalculatePartyBalance(String(payment.partyId));
      }
    }

    const allCashReceipts = await offlineDB.cashReceipts.toArray();
    const receipt = allCashReceipts.find((cr: any) => cr.receiptNumber === voucherNo);
    if (receipt) {
      await offlineDB.cashReceipts.delete(receipt.id);
      if (receipt.partyId) {
        // TODO: await recalculatePartyBalance(String(receipt.partyId));
      }
    }

    return ok({ message: "Deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
