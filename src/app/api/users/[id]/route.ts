import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await dbConnect();
    await User.findByIdAndDelete(id);
    return ok({ message: "User deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}
