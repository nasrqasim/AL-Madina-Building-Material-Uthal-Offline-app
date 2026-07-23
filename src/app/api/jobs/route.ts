import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const allInvoices = await offlineDB.invoices.toArray();
  const rows = allInvoices.filter((inv: any) => inv.type === "job");
  // Sort by createdAt descending
  rows.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.jobNumber) body.jobNumber = body.code;

    const id = generateUniqueId();
    const jobRecord = {
      id,
      _id: id,
      ...body,
      type: "job",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.invoices.add(jobRecord);
    return ok(jobRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
