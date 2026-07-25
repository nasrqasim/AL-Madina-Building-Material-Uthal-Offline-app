import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateInvoiceJournalEntries, updateInventoryFromInvoice, recalculatePartyBalance } from "@/lib/offline/postingService";

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

    // Get the OLD invoice before update to reverse its effects
    const oldInvoice = await offlineDB.invoices.get(params.id);
    const oldPartyId = (oldInvoice as any)?.partyId;

    // Reverse OLD inventory before applying changes
    if (oldInvoice) {
      await updateInventoryFromInvoice(oldInvoice as any, true); // isDeletion=true reverses stock
    }

    const body = await req.json();
    const payload = body;

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if (payload.type && payload.type !== "sale" && payload.type !== "sale_return" && payload.type !== "pos") {
        return fail("Permission denied (Restricted invoice type)", 403);
      }
    }

    // Handle walk-in / cash payment auto-fill
    if (payload.partyId) {
      const party = await offlineDB.parties.get(payload.partyId) as any;
      const isWalkIn = party && (party.name || party.companyName || "").toLowerCase().includes("walk-in");
      const isCashPayment = payload.paymentMethod === "Cash" || payload.paymentMethod === "Card";
      
      if (isWalkIn || (isCashPayment && !payload.isOnCredit)) {
        payload.amountReceived = payload.totalAmount;
        payload.balance = 0;
      }
    } else {
      // Direct purchase without vendor - create or find Walk-in Vendor
      if (payload.type === "purchase" || payload.type === "non_tax_purchase") {
        let walkInVendor = await offlineDB.parties.where("name").equals("Walk-in Vendor").first();
        if (!walkInVendor) {
          walkInVendor = await offlineDB.parties.where("companyName").equals("Walk-in Vendor").first();
        }
        
        if (!walkInVendor) {
          // Create Walk-in Vendor
          const walkInVendorId = `walkin-vendor-${Date.now()}`;
          await offlineDB.parties.add({
            id: walkInVendorId,
            _id: walkInVendorId,
            name: "Walk-in Vendor",
            companyName: "Walk-in Vendor",
            type: "Vendor",
            code: "WALKIN",
            balance: 0,
            openingBalance: 0,
            creditLimit: 0,
            debit: 0,
            credit: 0,
            address: "",
            phone: "",
            email: "",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          walkInVendor = await offlineDB.parties.get(walkInVendorId);
        }
        
        if (walkInVendor) {
          payload.partyId = walkInVendor._id || walkInVendor.id;
        }
      }
      
      // For cash/bank payments, set amountReceived
      if (payload.paymentMethod === "Cash" || payload.paymentMethod === "Card" || payload.paymentMethod === "Bank") {
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
      // Regenerate journal entries (this clears old entries first, then creates new ones)
      await generateInvoiceJournalEntries(row as any);
      // Apply NEW inventory
      await updateInventoryFromInvoice(row as any);
    }

    // If party changed, recalculate BOTH old and new party balances
    const newPartyId = (row as any)?.partyId;
    if (oldPartyId && oldPartyId !== newPartyId) {
      await recalculatePartyBalance(oldPartyId);
    }
    // Note: generateInvoiceJournalEntries already calls recalculatePartyBalance for newPartyId

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
    
    // Get the invoice before deletion to reverse its effects
    const invoice = await offlineDB.invoices.get(params.id);
    const partyId = (invoice as any)?.partyId;

    // Reverse inventory BEFORE deleting the invoice
    if (invoice) {
      await updateInventoryFromInvoice(invoice as any, true); // isDeletion=true reverses stock
    }

    // Delete the invoice
    await offlineDB.invoices.delete(params.id);
    
    // Delete associated journal entries
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    const entriesToDelete = allJournalEntries.filter((je: any) => je.invoiceId === params.id);
    for (const entry of entriesToDelete) {
      await offlineDB.journalEntries.delete(entry.id);
    }
    
    // Recalculate party balance after deletion
    if (partyId) {
      await recalculatePartyBalance(partyId.toString());
    }

    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
