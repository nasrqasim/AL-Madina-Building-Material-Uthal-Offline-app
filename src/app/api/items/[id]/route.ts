import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Item from "@/models/Item";
import mongoose from "mongoose";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const row = await Item.findById(params.id).lean();
    if (!row) return fail("Item not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // Sanitize ObjectIds
    if (body.mainCategoryId && !mongoose.Types.ObjectId.isValid(body.mainCategoryId)) {
      delete body.mainCategoryId;
    }
    if (body.subCategoryId && !mongoose.Types.ObjectId.isValid(body.subCategoryId)) {
      delete body.subCategoryId;
    }

    await dbConnect();
    const row = await Item.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Item not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    await Item.findByIdAndDelete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
