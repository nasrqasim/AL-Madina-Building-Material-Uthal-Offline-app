import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import SalarySettlement from "@/models/SalarySettlement";

export async function GET() {
  await dbConnect();
  const rows = await SalarySettlement.find().sort({ createdAt: -1 }).lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await SalarySettlement.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
