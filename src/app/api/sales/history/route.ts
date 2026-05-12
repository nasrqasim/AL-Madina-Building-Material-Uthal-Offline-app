import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const partyId = searchParams.get("partyId");
  const itemId = searchParams.get("itemId");
  if (!partyId || !itemId) return fail("partyId and itemId are required");
  await dbConnect();
  const invoices = await Invoice.find({ partyId, type: "sale" }, { lines: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const rates = invoices
    .flatMap((inv) => inv.lines)
    .filter((line) => String(line.itemId) === itemId)
    .slice(0, 5)
    .map((line) => ({ ratePerCarton: line.ratePerCarton, discountPercent: line.discountPercent ?? 0 }));
  return ok(rates);
}

export const dynamic = "force-dynamic";
