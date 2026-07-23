import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateInvoiceJournalEntries, updateInventoryFromInvoice } from "@/lib/offline/postingService";
import { generateUniqueId } from "@/lib/dexie";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const partyId = searchParams.get("partyId");

    let invoices = await offlineDB.invoices.toArray();
    
    if (type) {
      invoices = invoices.filter(inv => inv.type === type);
    }
    if (partyId) {
      invoices = invoices.filter(inv => inv.partyId === partyId);
    }

    // Sort by date descending
    invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Populate party data
    const parties = await offlineDB.parties.toArray();
    const partyMap = new Map(parties.map(p => [p.id, p]));
    
    const populatedInvoices = invoices.map(inv => ({
      ...inv,
      partyId: inv.partyId ? partyMap.get(inv.partyId) : null
    }));

    return ok(populatedInvoices);
  } catch (e) {
    return fail((e as Error).message);
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    const body = await req.json();

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if (body.type !== "sale" && body.type !== "sale_return" && body.type !== "pos") {
        return fail("Permission denied (Restricted invoice type)", 403);
      }
    }

    // Generate unique ID
    const id = generateUniqueId();
    
    // Check for walk-in customer or cash payment method
    if (body.partyId) {
      const party = await offlineDB.parties.get(body.partyId);
      const isWalkIn = party && (party.name || party.companyName || "").toLowerCase().includes("walk-in");
      const isCashPayment = body.paymentMethod === "Cash" || body.paymentMethod === "Card";
      
      if (isWalkIn || (isCashPayment && !body.isOnCredit)) {
        body.amountReceived = body.totalAmount;
        body.balance = 0;
      }
    }

    // Create invoice record
    const invoiceRecord = {
      id,
      _id: id,
      invoiceNo: body.invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
      type: body.type || "sale",
      date: body.date || new Date().toISOString(),
      partyId: body.partyId || null,
      paymentMethod: body.paymentMethod || body.paymentTerms || "Credit",
      paymentTerms: body.paymentTerms || "Credit",
      regNo: body.regNo || "",
      startKms: body.startKms || 0,
      endKms: body.endKms || 0,
      rangeKms: body.rangeKms || 0,
      oilGaugeLimit: body.oilGaugeLimit || 0,
      locationId: body.locationId || null,
      employeeId: body.employeeId || null,
      jobId: body.jobId || null,
      notes: body.notes || "",
      lines: body.lines || [],
      subTotal: body.subTotal || 0,
      discountAmount: body.discountAmount || 0,
      taxAmount: body.taxAmount || 0,
      totalAmount: body.totalAmount || 0,
      amountReceived: body.amountReceived || 0,
      status: body.status || "posted",
      useAdvance: body.useAdvance || false,
      advanceAmountUsed: body.advanceAmountUsed || 0,
      deliveryStatus: body.deliveryStatus || "posted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to IndexedDB
    await offlineDB.invoices.add(invoiceRecord);

    // Generate journal entries
    await generateInvoiceJournalEntries(invoiceRecord);

    // Update inventory
    await updateInventoryFromInvoice(invoiceRecord);

    // Return the created invoice
    return ok(invoiceRecord, 201);
  } catch (e) {
    console.error("Error creating invoice:", e);
    return fail((e as Error).message);
  }
}
