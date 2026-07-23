import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const partyId = searchParams.get("partyId");
  if (!partyId) return fail("partyId is required");

  const allInvoices = await offlineDB.invoices.toArray();
  const rows = allInvoices
    .filter((inv: any) => inv.partyId === partyId)
    .map((inv: any) => ({
      invoiceNo: inv.invoiceNo,
      type: inv.type,
      date: inv.date,
      totalAmount: inv.totalAmount
    }))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return ok(rows);
}

export const dynamic = "force-dynamic";
