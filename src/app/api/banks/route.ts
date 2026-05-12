import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Bank from "@/models/Bank";

export async function GET() {
  await dbConnect();
  const rows = await Bank.find().sort({ createdAt: -1 }).lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    // If setting as default, unset all others first
    if (body.isDefault) {
      await Bank.updateMany({}, { isDefault: false });
    }
    const row = await Bank.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
