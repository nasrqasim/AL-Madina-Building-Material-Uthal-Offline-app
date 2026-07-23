import { fail, ok } from "@/lib/api";
import { offlineDB, generateUniqueId } from "@/lib/dexie";

export async function GET() {
  try {
    const accounts = await offlineDB.accounts.toArray();
    const journalEntries = await offlineDB.journalEntries.toArray();
    
    const rows = [];
    for (const acc of accounts) {
      const jvs = journalEntries.filter(j => j.accountCode === acc.code);
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
    
    // Sort by code
    rows.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = generateUniqueId();
    
    const accountRecord = {
      id,
      _id: id,
      code: body.code,
      title: body.title,
      type: body.type,
      openingBalance: Number(body.openingBalance) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await offlineDB.accounts.add(accountRecord);
    return ok(accountRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
