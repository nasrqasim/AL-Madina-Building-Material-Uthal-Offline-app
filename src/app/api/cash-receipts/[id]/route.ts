import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashReceipt from "@/models/CashReceipt";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await CashReceipt.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    await CashReceipt.findByIdAndDelete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
