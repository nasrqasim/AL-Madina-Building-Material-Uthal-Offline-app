import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Party from "@/models/Party";
import JournalEntry from "@/models/JournalEntry";
import { generateInvoiceJournalEntries, recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";
import { normalizeInvoicePayload } from "@/lib/invoicePayload";
import { getPopulatedInvoice } from "@/lib/invoiceQueries";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    const row = await getPopulatedInvoice(params.id);
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

    await dbConnect();

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      const existing = await Invoice.findById(params.id).lean();
      if (!existing || ((existing as any).type !== "sale" && (existing as any).type !== "sale_return" && (existing as any).type !== "pos")) {
        return fail("Permission denied", 403);
      }
    }

    const body = await req.json();
    const payload = normalizeInvoicePayload(body);

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if (payload.type && payload.type !== "sale" && payload.type !== "sale_return" && payload.type !== "pos") {
        return fail("Permission denied (Restricted invoice type)", 403);
      }
    }

    if (payload.partyId) {
      const party = await Party.findById(payload.partyId).lean() as any;
      if (party && (party.name || party.companyName || "").toLowerCase().includes("walk-in")) {
        payload.amountReceived = payload.totalAmount;
        payload.balance = 0;
      }
    }

    const row = await Invoice.findByIdAndUpdate(
      params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (row) {
      await generateInvoiceJournalEntries(row);
    }

    const populated = row ? await getPopulatedInvoice(params.id) : null;
    return ok(populated ?? row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    await dbConnect();

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      const existing = await Invoice.findById(params.id).lean();
      if (!existing || ((existing as any).type !== "sale" && (existing as any).type !== "sale_return" && (existing as any).type !== "pos")) {
        return fail("Permission denied", 403);
      }
    }
    
    // Get the invoice to extract partyId before deletion
    const invoice = await Invoice.findById(params.id);
    const partyId = invoice?.partyId;

    await Invoice.findByIdAndDelete(params.id);
    
    // Automatically delete associated journal entries
    await JournalEntry.deleteMany({ invoiceId: params.id });
    
    // Recalculate party balance
    if (partyId) {
      await recalculatePartyBalance(partyId.toString());
    }

    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
