import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const allSettings = await offlineDB.settings.toArray();
    const financialYear = allSettings.find((s: any) => s.key === "financialYear" && s.id === id);

    if (financialYear) {
      const fyValue = financialYear.value as any;
      const updatedValue = {
        ...fyValue,
        ...body,
        updatedAt: new Date().toISOString()
      };
      await offlineDB.settings.update(id, { value: updatedValue });
      const updated = await offlineDB.settings.get(id);
      return ok((updated as any).value);
    }

    return fail("Financial year not found", 404);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await offlineDB.settings.delete(id);
    return ok({ message: "Financial year deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}
