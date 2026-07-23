import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

// TODO: Update these service functions to use IndexedDB
// import { recalculatePartyBalance, postCashPaymentJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const amount = Number(body.amount ?? body.totalAmount) || 0;
    const whtAmount = Number(body.whtAmount) || 0;
    const partyId = body.partyId || body.vendorId || null;

    const payload = {
      ...body,
      partyId,
      vendor: partyId ? String(partyId) : "",
      amount,
      whtAmount,
      netPaid: amount - whtAmount,
      updatedAt: new Date().toISOString()
    };

    await offlineDB.cashPayments.update(params.id, payload);
    const row = await offlineDB.cashPayments.get(params.id);
    if (!row) return fail("Not found", 404);

    if ((row as any).status === "Posted") {
      // TODO: await postCashPaymentJournalEntries(row);
    } else {
      const allJournalEntries = await offlineDB.journalEntries.toArray();
      const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === (row as any).voucherNo);
      for (const entry of entriesToDelete) {
        await offlineDB.journalEntries.delete(entry.id);
      }
    }

    if (partyId) {
      // TODO: await recalculatePartyBalance(String(partyId));
    }

    // Populate party and cash account
    const allParties = await offlineDB.parties.toArray();
    const allAccounts = await offlineDB.accounts.toArray();
    const party = allParties.find((p: any) => p.id === partyId);
    const cashAccount = allAccounts.find((a: any) => a.id === (row as any).cashAccountId);

    const populated = {
      ...(row as any),
      partyId: party ? { name: party.name, companyName: party.companyName, type: party.type } : null,
      cashAccountId: cashAccount ? { title: cashAccount.title, code: cashAccount.code } : null
    };

    return ok(populated);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const row = await offlineDB.cashPayments.get(params.id);
    if (row) {
      const partyId = (row as any).partyId?.toString() || (row as any).vendor;
      const allJournalEntries = await offlineDB.journalEntries.toArray();
      const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === (row as any).voucherNo);
      for (const entry of entriesToDelete) {
        await offlineDB.journalEntries.delete(entry.id);
      }
      await offlineDB.cashPayments.delete(params.id);
      if (partyId) {
        // TODO: await recalculatePartyBalance(partyId);
      }
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
