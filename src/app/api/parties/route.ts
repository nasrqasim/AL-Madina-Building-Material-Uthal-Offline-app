import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Party from "@/models/Party";

export async function GET() {
  await dbConnect();
  const rows = await Party.find().sort({ createdAt: -1 }).lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    if (body.openingBalance && (!body.balance || body.balance === 0)) {
      body.balance = body.openingBalance;
    }
    const row = await Party.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
