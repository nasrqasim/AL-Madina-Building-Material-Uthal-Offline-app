import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const allSettings = await offlineDB.settings.toArray();
  const salaryAdvances = allSettings.filter((s: any) => s.key === "salaryAdvance");
  // Sort by createdAt descending
  salaryAdvances.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(salaryAdvances.map((s: any) => s.value));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = generateUniqueId();
    const salaryAdvanceRecord = {
      id,
      key: "salaryAdvance",
      value: body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.settings.add(salaryAdvanceRecord as any);
    return ok(salaryAdvanceRecord.value, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
