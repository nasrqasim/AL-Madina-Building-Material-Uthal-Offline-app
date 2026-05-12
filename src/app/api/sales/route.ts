import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Party from "@/models/Party";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    // Fetch Sale Orders, Sale Invoices, etc.
    const rows = await Invoice.find({ 
      type: { $in: ["sale", "sale_order", "quotation", "non_tax_sale", "pos_counter_sale"] } 
    })
    .populate("partyId", "name companyName")
    .populate("employeeId", "name")
    .populate("lines.itemId", "name code category unit")
    .sort({ date: -1, createdAt: -1 })
    .lean();

    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}
