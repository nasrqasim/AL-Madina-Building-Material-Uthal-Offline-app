import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Party from "@/models/Party";
import Employee from "@/models/Employee";
import Job from "@/models/Job";
import Location from "@/models/Location";
import { generateInvoiceJournalEntries } from "@/services/posting/invoicePostingHelper";
import { normalizeInvoicePayload } from "@/lib/invoicePayload";
import { getPopulatedInvoice } from "@/lib/invoiceQueries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const partyId = searchParams.get("partyId");

    const query: any = {};
    if (type) query.type = type;
    if (partyId) query.partyId = partyId;

    await dbConnect();
    const rows = await Invoice.find(query)
      .populate("partyId", "companyName name")
      .populate("employeeId", "name")
      .populate("jobId", "title name")
      .populate("locationId", "name")
      .populate("lines.itemId", "name code category unit")
      .sort({ createdAt: -1 })
      .lean();

    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();

    const payload = normalizeInvoicePayload(body);
    const row = await Invoice.create(payload);

    await generateInvoiceJournalEntries(row);

    const populated = await getPopulatedInvoice(String(row._id));
    return ok(populated ?? row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}
