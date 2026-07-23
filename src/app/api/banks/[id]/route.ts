import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body.isDefault) {
      const allBanks = await offlineDB.banks.toArray();
      for (const bank of allBanks) {
        if (bank.id !== params.id) {
          await offlineDB.banks.update(bank.id, { isDefault: false });
        }
      }
    }
    const updatedBank = {
      name: body.name,
      accountNo: body.accountNo,
      branch: body.branch,
      isDefault: body.isDefault,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.banks.update(params.id, updatedBank);
    const row = await offlineDB.banks.get(params.id);
    if (!row) return fail("Bank not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await offlineDB.banks.delete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
