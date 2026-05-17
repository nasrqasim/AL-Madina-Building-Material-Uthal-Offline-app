import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import JournalEntry from "@/models/JournalEntry";
import { generateInvoiceJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const row = await Invoice.findById(params.id).populate("partyId").populate("lines.itemId");
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
    const row = await Invoice.findByIdAndUpdate(params.id, body, { new: true });
    
    if (row) {
      await generateInvoiceJournalEntries(row);
    }
    
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    await Invoice.findByIdAndDelete(params.id);
    
    // Automatically delete associated journal entries
    await JournalEntry.deleteMany({ invoiceId: params.id });
    
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
