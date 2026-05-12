import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Item from "@/models/Item";

export async function GET() {
  await dbConnect();
  const rows = await Item.find().sort({ createdAt: -1 }).lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Creating item with body:", body);
    await dbConnect();
    const row = await Item.create(body);
    return ok(row, 201);
  } catch (e) {
    console.error("API Error [items POST]:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
