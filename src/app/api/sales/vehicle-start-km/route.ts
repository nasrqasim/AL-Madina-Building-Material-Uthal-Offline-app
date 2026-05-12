import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import VehicleLog from "@/models/VehicleLog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const regNo = searchParams.get("regNo");
  if (!regNo) return fail("regNo is required");
  await dbConnect();
  const last = (await VehicleLog.findOne({ regNo }).sort({ createdAt: -1 }).lean()) as
    | { endKms?: number; invoiceId?: string }
    | null;
  return ok({ startKms: last?.endKms ?? 0, lastInvoiceId: last?.invoiceId ?? null });
}

export const dynamic = "force-dynamic";
