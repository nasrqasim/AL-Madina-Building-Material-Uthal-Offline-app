import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import JournalEntry from "@/models/JournalEntry";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountCode = searchParams.get("accountCode");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  await dbConnect();
  try {
    const query: any = {};
    if (accountCode) query.accountCode = accountCode;
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const rows = await JournalEntry.find(query).sort({ date: 1, createdAt: 1 }).lean();
    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    
    // Manual JV creation logic if needed, but for now we just want to show them
    const row = await JournalEntry.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
