import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Party from "@/models/Party";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    // Fetch both Purchase Orders and regular Purchases
    const rows = await Invoice.find({ 
      type: { $in: ["purchase", "purchase_order", "grn", "non_tax_purchase", "import_purchase", "purchase_return", "non_tax_purchase_return"] } 
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
