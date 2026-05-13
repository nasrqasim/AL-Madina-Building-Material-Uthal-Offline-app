import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Item from "@/models/Item";
import mongoose from "mongoose";

export async function GET() {
  await dbConnect();
  const rows = await Item.find().sort({ createdAt: -1 }).lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Creating item with body:", body);
    
    // Sanitize ObjectIds
    if (body.mainCategoryId === "" || (body.mainCategoryId && !mongoose.Types.ObjectId.isValid(body.mainCategoryId))) {
      delete body.mainCategoryId;
    }
    if (body.subCategoryId === "" || (body.subCategoryId && !mongoose.Types.ObjectId.isValid(body.subCategoryId))) {
      delete body.subCategoryId;
    }

    await dbConnect();
    const row = await Item.create(body);
    return ok(row, 201);
  } catch (e) {
    console.error("API Error [items POST]:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
