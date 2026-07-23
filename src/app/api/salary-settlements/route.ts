import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const allSettings = await offlineDB.settings.toArray();
  const salarySettlements = allSettings.filter((s: any) => s.key === "salarySettlement");
  // Sort by createdAt descending
  salarySettlements.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(salarySettlements.map((s: any) => s.value));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = generateUniqueId();
    const salarySettlementRecord = {
      id,
      key: "salarySettlement",
      value: body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.settings.add(salarySettlementRecord as any);
    return ok(salarySettlementRecord.value, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
