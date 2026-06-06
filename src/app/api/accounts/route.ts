import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Account from "@/models/Account";
import JournalEntry from "@/models/JournalEntry";

export async function GET() {
  await dbConnect();
  const accounts = await Account.find().sort({ code: 1 }).lean();
  
  const rows = [];
  for (const acc of accounts) {
    const jvs = await JournalEntry.find({ accountCode: acc.code }).select("debit credit").lean();
    const debits = jvs.reduce((s, j) => s + (j.debit || 0), 0);
    const credits = jvs.reduce((s, j) => s + (j.credit || 0), 0);
    
    let balance = acc.openingBalance || 0;
    const isDebit = ["cash", "bank", "expense", "receivable", "asset"].includes(String(acc.type || "").toLowerCase());
    if (isDebit) {
      balance += debits - credits;
    } else {
      balance += credits - debits;
    }
    
    rows.push({
      ...acc,
      currentBalance: balance
    });
  }
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await Account.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
