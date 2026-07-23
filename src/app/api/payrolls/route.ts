import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const allSettings = await offlineDB.settings.toArray();
  const payrolls = allSettings.filter((s: any) => s.key === "payroll");
  // Sort by createdAt descending
  payrolls.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(payrolls.map((s: any) => s.value));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = generateUniqueId();
    const payrollRecord = {
      id,
      key: "payroll",
      value: body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.settings.add(payrollRecord as any);
    return ok(payrollRecord.value, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
