import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    let row = await offlineDB.employees.get(params.id);
    if (!row) {
      const all = await offlineDB.employees.toArray();
      row = all.find((e: any) => e.id === params.id || e._id === params.id || e.code === params.id);
    }
    if (!row) return fail("Employee not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updatedEmployee = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.employees.update(params.id, updatedEmployee);
    const row = await offlineDB.employees.get(params.id);
    if (!row) return fail("Employee not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await offlineDB.employees.delete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
