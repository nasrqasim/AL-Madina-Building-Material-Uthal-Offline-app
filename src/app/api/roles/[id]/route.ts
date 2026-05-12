import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { Role } from "@/models/Role";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await dbConnect();
    await Role.findByIdAndDelete(id);
    return ok({ message: "Role deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}
