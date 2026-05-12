import { ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import JournalEntry from "@/models/JournalEntry";

export async function GET() {
  await dbConnect();
  const rows = await JournalEntry.find({ accountCode: { $in: ["1000", "1010"] } }).sort({ date: -1 }).limit(200).lean();
  return ok(rows);
}

export const dynamic = "force-dynamic";
