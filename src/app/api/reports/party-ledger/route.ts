import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const partyId = searchParams.get("partyId");
  if (!partyId) return fail("partyId is required");
  await dbConnect();
  const rows = await Invoice.find({ partyId }, { invoiceNo: 1, type: 1, date: 1, totalAmount: 1 }).sort({ date: -1 }).lean();
  return ok(rows);
}

export const dynamic = "force-dynamic";
