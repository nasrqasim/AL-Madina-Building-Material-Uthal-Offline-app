import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const regNo = searchParams.get("regNo");
  if (!regNo) return fail("regNo is required");

  const allInvoices = await offlineDB.invoices.toArray();
  const vehicleLogs = allInvoices.filter((inv: any) => inv.vehicleRegNo === regNo);
  vehicleLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const last = vehicleLogs.length > 0 ? vehicleLogs[0] : null;
  return ok({ startKms: (last as any)?.vehicleEndKms ?? 0, lastInvoiceId: last?.id ?? null });
}

export const dynamic = "force-dynamic";
