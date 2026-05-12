import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";

export async function GET() {
  await dbConnect();
  const rows = await Category.find().sort({ createdAt: -1 }).lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Creating category with body:", body);
    await dbConnect();
    const row = await Category.create(body);
    return ok(row, 201);
  } catch (e) {
    console.error("API Error [categories POST]:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
