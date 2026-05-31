import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import JournalEntry from "@/models/JournalEntry";
import { generateInvoiceJournalEntries, recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";
import { normalizeInvoicePayload } from "@/lib/invoicePayload";
import { getPopulatedInvoice } from "@/lib/invoiceQueries";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const row = await getPopulatedInvoice(params.id);
    if (!row) return fail("Invoice not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const payload = normalizeInvoicePayload(body);
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
    await dbConnect();
    
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
