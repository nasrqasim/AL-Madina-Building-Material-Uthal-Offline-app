import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const rows = await offlineDB.employees.toArray();
  // Sort by createdAt descending
  rows.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const id = generateUniqueId();
    const employeeRecord = {
      id,
      _id: id,
      name: body.name || "",
      designation: body.designation || "",
      phone: body.phone || "",
      email: body.email || "",
      salary: body.salary || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await offlineDB.employees.add(employeeRecord);
    return ok(employeeRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
