import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const row = await offlineDB.items.get(params.id);
    if (!row) return fail("Item not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // Sanitize empty category IDs
    if (body.mainCategoryId === "") {
      delete body.mainCategoryId;
    }
    if (body.subCategoryId === "") {
      delete body.subCategoryId;
    }

    const updatedItem = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.items.update(params.id, updatedItem);
    const row = await offlineDB.items.get(params.id);
    if (!row) return fail("Item not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await offlineDB.items.delete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
