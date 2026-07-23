import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updatedUnit = {
      name: body.name,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.units.update(params.id, updatedUnit);
    const row = await offlineDB.units.get(params.id);
    if (!row) return fail("Unit not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await offlineDB.units.delete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
