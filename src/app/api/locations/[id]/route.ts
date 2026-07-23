import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body.isDefault) {
      const allLocations = await offlineDB.locations.toArray();
      for (const loc of allLocations) {
        if (loc.id !== params.id) {
          await offlineDB.locations.update(loc.id, { isDefault: false });
        }
      }
    }
    const updatedLocation = {
      name: body.name,
      address: body.address,
      isDefault: body.isDefault,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.locations.update(params.id, updatedLocation);
    const row = await offlineDB.locations.get(params.id);
    if (!row) return fail("Location not found", 404);
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
