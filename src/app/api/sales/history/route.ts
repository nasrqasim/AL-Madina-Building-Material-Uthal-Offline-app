import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const partyId = searchParams.get("partyId");
  const itemId = searchParams.get("itemId");
  if (!partyId || !itemId) return fail("partyId and itemId are required");

  const allInvoices = await offlineDB.invoices.toArray();
  const invoices = allInvoices
    .filter((inv: any) => inv.partyId === partyId && inv.type === "sale")
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const rates = invoices
    .flatMap((inv: any) => inv.lines || [])
    .filter((line: any) => String(line.itemId) === itemId)
    .slice(0, 5)
    .map((line: any) => ({ ratePerCarton: line.ratePerCarton, discountPercent: line.discountPercent ?? 0 }));
  return ok(rates);
}

export const dynamic = "force-dynamic";
