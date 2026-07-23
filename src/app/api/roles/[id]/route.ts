import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await offlineDB.settings.delete(id);
    return ok({ message: "Role deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}
