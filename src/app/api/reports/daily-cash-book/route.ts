import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET() {
  const allJournalEntries = await offlineDB.journalEntries.toArray();
  const rows = allJournalEntries
    .filter((je: any) => ["1000", "1010"].includes(je.accountCode))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 200);
  return ok(rows);
}

export const dynamic = "force-dynamic";
