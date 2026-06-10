import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Party from "@/models/Party";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function GET() {
  await dbConnect();
  const parties = await Party.find().lean();
  for (const p of parties) {
    await recalculatePartyBalance(String(p._id));
  }
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
    await recalculatePartyBalance(String(row._id));
    const finalRow = await Party.findById(row._id).lean();
    return ok(finalRow || row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
