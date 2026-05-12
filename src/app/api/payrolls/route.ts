import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Payroll from "@/models/Payroll";

export async function GET() {
  await dbConnect();
  const rows = await Payroll.find().sort({ createdAt: -1 }).lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await Payroll.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
