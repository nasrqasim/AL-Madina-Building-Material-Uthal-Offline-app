import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Bank from "@/models/Bank";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    if (body.isDefault) {
      await Bank.updateMany({ _id: { $ne: params.id } }, { isDefault: false });
    }
    const row = await Bank.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Bank not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    await Bank.findByIdAndDelete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
