import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Employee from "@/models/Employee";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const row = await Employee.findById(params.id).lean();
    if (!row) return fail("Employee not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await Employee.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Employee not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    await Employee.findByIdAndDelete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
