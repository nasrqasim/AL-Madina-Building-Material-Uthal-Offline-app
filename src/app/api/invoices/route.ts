import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateInvoiceJournalEntries, updateInventoryFromInvoice } from "@/lib/offline/postingService";
import { generateUniqueId } from "@/lib/dexie";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const partyIdParam = searchParams.get("partyId");

    let invoices = await offlineDB.invoices.toArray();
    
    if (type) {
      invoices = invoices.filter(inv => inv.type === type);
    }
    if (partyIdParam) {
      invoices = invoices.filter(inv => inv.partyId === partyIdParam);
    }

    // Sort by date descending
    invoices.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    // Populate party data
    const parties = await offlineDB.parties.toArray();
    const partyMap = new Map(parties.map(p => [p.id || p._id, p]));
    
    const populatedInvoices = invoices.map(inv => ({
      ...inv,
      _id: inv.id || inv._id,
      partyId: inv.partyId ? (partyMap.get(inv.partyId) || inv.partyId) : null
    }));

    return ok(populatedInvoices);
  } catch (e) {
    console.error("API Error [invoices GET]:", e);
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    let normalizedRole = "";
    try {
      const session = await getServerSession(authOptions);
      const role = session?.user?.role;
      normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");
    } catch (sessionErr) {
      console.warn("Session check skipped:", sessionErr);
    }

    const body = await req.json();

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if (body.type !== "sale" && body.type !== "sale_return" && body.type !== "pos") {
        return fail("Permission denied (Restricted invoice type)", 403);
      }
    }

    // Extract partyId cleanly (string or object)
    const partyId = typeof body.partyId === "object" && body.partyId !== null 
      ? (body.partyId.id || body.partyId._id) 
      : body.partyId;

    // Generate unique ID
    const id = generateUniqueId();
    
    // Check for walk-in customer, cash payment method, or direct purchase
    let amountReceived = Number(body.amountReceived) || 0;
    let balance = Number(body.balance) || 0;
    const totalAmount = Number(body.totalAmount) || 0;

    if (partyId) {
      const party = await offlineDB.parties.get(partyId);
      const isWalkIn = party && (party.name || party.companyName || "").toLowerCase().includes("walk-in");
      const isCashPayment = body.paymentMethod === "Cash" || body.paymentMethod === "Card";
      
      if (isWalkIn || (isCashPayment && !body.isCreditBill && !body.isOnCredit)) {
        amountReceived = totalAmount;
        balance = 0;
      }
    } else {
      if (body.paymentMethod === "Cash" || body.paymentMethod === "Card" || body.paymentMethod === "Bank") {
        amountReceived = totalAmount;
        balance = 0;
      }
    }

    // Create invoice record
    const invoiceRecord = {
      ...body,
      id,
      _id: id,
      invoiceNo: body.invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
      type: body.type || "sale",
      date: body.date || new Date().toISOString(),
      partyId: partyId || null,
      paymentMethod: body.paymentMethod || body.paymentTerms || "Credit",
      paymentTerms: body.paymentTerms || "Credit",
      isCreditBill: body.isCreditBill !== undefined ? (body.isCreditBill ? 1 : 0) : (body.paymentMethod === "Credit" ? 1 : 0),
      regNo: body.regNo || "",
      startKms: Number(body.startKms) || 0,
      endKms: Number(body.endKms) || 0,
      rangeKms: Number(body.rangeKms) || 0,
      oilGaugeLimit: Number(body.oilGaugeLimit) || 0,
      locationId: body.locationId || null,
      employeeId: body.employeeId || null,
      jobId: body.jobId || null,
      notes: body.notes || body.remarks || "",
      lines: body.lines || [],
      subTotal: Number(body.subTotal) || 0,
      discountAmount: Number(body.discountAmount) || 0,
      taxAmount: Number(body.taxAmount) || 0,
      totalAmount: totalAmount,
      amountReceived: amountReceived,
      balance: balance,
      status: body.status || "posted",
      useAdvance: body.useAdvance ? 1 : 0,
      advanceAmountUsed: Number(body.advanceAmountUsed) || 0,
      deliveryStatus: body.deliveryStatus || "posted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to SQLite
    await offlineDB.invoices.add(invoiceRecord);

    // Generate journal entries (Ledger & Customer/Vendor balance)
    await generateInvoiceJournalEntries(invoiceRecord as any);

    // Update inventory stock
    await updateInventoryFromInvoice(invoiceRecord as any);

    // Return created invoice
    return ok(invoiceRecord, 201);
  } catch (e: any) {
    console.error("API Error [invoices POST]:", e);
    return fail(e?.message || "Failed to save invoice", 500);
  }
}
