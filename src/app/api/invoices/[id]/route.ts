import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateInvoiceJournalEntries, updateInventoryFromInvoice, recalculatePartyBalance } from "@/lib/offline/postingService";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    let normalizedRole = "";
    try {
      const session = await getServerSession(authOptions);
      const role = session?.user?.role;
      normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");
    } catch (sessionErr) {
      console.warn("Session check skipped:", sessionErr);
    }

    const row = await offlineDB.invoices.get(params.id);
    if (!row) return fail("Invoice not found", 404);

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if ((row as any).type !== "sale" && (row as any).type !== "sale_return" && (row as any).type !== "pos") {
        return fail("Permission denied", 403);
      }
    }

    return ok({ ...row, _id: (row as any).id || (row as any)._id });
  } catch (e) {
    console.error("API Error [invoices GET id]:", e);
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    let normalizedRole = "";
    try {
      const session = await getServerSession(authOptions);
      const role = session?.user?.role;
      normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");
    } catch (sessionErr) {
      console.warn("Session check skipped:", sessionErr);
    }

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

    // Extract partyId cleanly (string or object)
    const partyId = typeof payload.partyId === "object" && payload.partyId !== null 
      ? (payload.partyId.id || payload.partyId._id) 
      : payload.partyId;

    if (partyId) {
      payload.partyId = partyId;
    }

    // Handle walk-in / cash payment auto-fill
    if (payload.partyId) {
      const party = await offlineDB.parties.get(payload.partyId) as any;
      const isWalkIn = party && (party.name || party.companyName || "").toLowerCase().includes("walk-in");
      const isCashPayment = payload.paymentMethod === "Cash" || payload.paymentMethod === "Card";
      
      if (isWalkIn || (isCashPayment && !payload.isCreditBill && !payload.isOnCredit)) {
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
          payload.partyId = (walkInVendor as any)._id || (walkInVendor as any).id;
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
      id: params.id,
      _id: params.id,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.invoices.put(updatedInvoice);
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

    return ok(row);
  } catch (e: any) {
    console.error("API Error [invoices PUT id]:", e);
    return fail(e?.message || "Failed to update invoice", 500);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    let normalizedRole = "";
    try {
      const session = await getServerSession(authOptions);
      const role = session?.user?.role;
      normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");
    } catch (sessionErr) {
      console.warn("Session check skipped:", sessionErr);
    }

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      const existing = await offlineDB.invoices.get(params.id);
      if (!existing || ((existing as any).type !== "sale" && (existing as any).type !== "sale_return" && (existing as any).type !== "pos")) {
        return fail("Permission denied", 403);
      }
    }
    
    // Get the invoice before deletion to reverse its effects
    const invoice = await offlineDB.invoices.get(params.id);
    const partyId = (invoice as any)?.partyId;
    const invNo = (invoice as any)?.invoiceNo;

    // Reverse inventory BEFORE deleting the invoice
    if (invoice) {
      await updateInventoryFromInvoice(invoice as any, true); // isDeletion=true reverses stock
    }

    // Delete the invoice
    await offlineDB.invoices.delete(params.id);
    
    // Delete associated journal entries
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    const entriesToDelete = allJournalEntries.filter((je: any) => 
      je.invoiceId === params.id || (invNo && je.voucherNo === invNo)
    );
    for (const entry of entriesToDelete) {
      if (entry.id) await offlineDB.journalEntries.delete(entry.id);
    }
    
    // Recalculate party balance after deletion
    if (partyId) {
      await recalculatePartyBalance(partyId.toString());
    }

    return ok({ deleted: true });
  } catch (e: any) {
    console.error("API Error [invoices DELETE id]:", e);
    return fail(e?.message || "Failed to delete invoice", 500);
  }
}

export const dynamic = "force-dynamic";

