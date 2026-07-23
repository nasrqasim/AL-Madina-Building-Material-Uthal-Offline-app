import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updatedAccount = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.accounts.update(params.id, updatedAccount);
    const row = await offlineDB.accounts.get(params.id);
    if (!row) return fail("Account not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await offlineDB.accounts.delete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
