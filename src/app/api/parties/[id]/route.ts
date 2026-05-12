import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Party from "@/models/Party";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await Party.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Party not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const row = await Party.findByIdAndDelete(params.id);
    if (!row) return fail("Party not found", 404);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
