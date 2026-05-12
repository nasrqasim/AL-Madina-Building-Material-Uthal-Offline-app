import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";

export async function GET() {
  await dbConnect();
  const rows = await Job.find().sort({ createdAt: -1 }).lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.jobNumber) body.jobNumber = body.code;
    await dbConnect();
    const row = await Job.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
