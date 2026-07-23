import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const allSettings = await offlineDB.settings.toArray();
  const salaryLoans = allSettings.filter((s: any) => s.key === "salaryLoan");
  // Sort by createdAt descending
  salaryLoans.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(salaryLoans.map((s: any) => s.value));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = generateUniqueId();
    const salaryLoanRecord = {
      id,
      key: "salaryLoan",
      value: body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.settings.add(salaryLoanRecord as any);
    return ok(salaryLoanRecord.value, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
