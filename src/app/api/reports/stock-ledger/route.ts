import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return fail("itemId is required");
  await dbConnect();
  const invoices = await Invoice.find({ "lines.itemId": itemId }, { invoiceNo: 1, type: 1, date: 1, lines: 1 }).sort({ date: -1 }).lean();
  return ok(invoices);
}

export const dynamic = "force-dynamic";
