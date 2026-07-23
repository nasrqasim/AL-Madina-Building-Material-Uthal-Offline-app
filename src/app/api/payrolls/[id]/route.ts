import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updatedPayroll = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.settings.update(params.id, { value: updatedPayroll });
    const row = await offlineDB.settings.get(params.id);
    if (!row) return fail("Not found", 404);
    return ok((row as any).value);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await offlineDB.settings.delete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
