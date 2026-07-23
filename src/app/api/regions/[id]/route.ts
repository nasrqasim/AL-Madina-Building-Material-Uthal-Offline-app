import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updatedRegion = {
      name: body.name,
      code: body.code,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.locations.update(params.id, updatedRegion);
    const row = await offlineDB.locations.get(params.id);
    if (!row) return fail("Region not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await offlineDB.locations.delete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
