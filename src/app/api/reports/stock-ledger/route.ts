import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return fail("itemId is required");

  const allInvoices = await offlineDB.invoices.toArray();
  const invoices = allInvoices
    .filter((inv: any) => inv.lines && inv.lines.some((line: any) => line.itemId === itemId))
    .map((inv: any) => ({
      invoiceNo: inv.invoiceNo,
      type: inv.type,
      date: inv.date,
      lines: inv.lines
    }))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return ok(invoices);
}

export const dynamic = "force-dynamic";
