import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// TODO: Update these service functions to use IndexedDB
// import { generateInvoiceJournalEntries, recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";
// import { normalizeInvoicePayload } from "@/lib/invoicePayload";
// import { getPopulatedInvoice } from "@/lib/invoiceQueries";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    const row = await offlineDB.invoices.get(params.id);
    if (!row) return fail("Invoice not found", 404);

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if ((row as any).type !== "sale" && (row as any).type !== "sale_return" && (row as any).type !== "pos") {
        return fail("Permission denied", 403);
      }
    }

    // TODO: Implement population logic similar to getPopulatedInvoice
    // For now, return the raw invoice
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      const existing = await offlineDB.invoices.get(params.id);
      if (!existing || ((existing as any).type !== "sale" && (existing as any).type !== "sale_return" && (existing as any).type !== "pos")) {
        return fail("Permission denied", 403);
      }
    }

    const body = await req.json();
    // TODO: const payload = normalizeInvoicePayload(body);
    const payload = body;

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if (payload.type && payload.type !== "sale" && payload.type !== "sale_return" && payload.type !== "pos") {
        return fail("Permission denied (Restricted invoice type)", 403);
      }
    }

    if (payload.partyId) {
      const party = await offlineDB.parties.get(payload.partyId) as any;
      const isWalkIn = party && (party.name || party.companyName || "").toLowerCase().includes("walk-in");
      const isCashPayment = payload.paymentMethod === "Cash" || payload.paymentMethod === "Card";
      
      if (isWalkIn || (isCashPayment && !payload.isOnCredit)) {
        payload.amountReceived = payload.totalAmount;
        payload.balance = 0;
      }
    }

    const updatedInvoice = {
      ...payload,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.invoices.update(params.id, updatedInvoice);
    const row = await offlineDB.invoices.get(params.id);

    if (row) {
      // TODO: await generateInvoiceJournalEntries(row);
    }

    // TODO: Implement population logic
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      const existing = await offlineDB.invoices.get(params.id);
      if (!existing || ((existing as any).type !== "sale" && (existing as any).type !== "sale_return" && (existing as any).type !== "pos")) {
        return fail("Permission denied", 403);
      }
    }
    
    // Get the invoice to extract partyId before deletion
    const invoice = await offlineDB.invoices.get(params.id);
    const partyId = (invoice as any)?.partyId;

    await offlineDB.invoices.delete(params.id);
    
    // Automatically delete associated journal entries
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    const entriesToDelete = allJournalEntries.filter((je: any) => je.invoiceId === params.id);
    for (const entry of entriesToDelete) {
      await offlineDB.journalEntries.delete(entry.id);
    }
    
    // Recalculate party balance
    if (partyId) {
      // TODO: await recalculatePartyBalance(partyId.toString());
    }

    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
