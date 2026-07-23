import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const accounts = await offlineDB.accounts.toArray();
    const journalEntries = await offlineDB.journalEntries.toArray();

    // Filter journal entries by date range
    const filteredEntries = journalEntries.filter(entry => {
      const entryDate = entry.date.split("T")[0];
      if (fromDate && entryDate < fromDate) return false;
      if (toDate && entryDate > toDate) return false;
      return true;
    });

    const totals: Record<string, { debit: number; credit: number }> = {};
    accounts.forEach(a => {
      totals[a.code] = { debit: 0, credit: 0 };
    });

    filteredEntries.forEach(entry => {
      if (!totals[entry.accountCode]) {
        totals[entry.accountCode] = { debit: 0, credit: 0 };
      }
      totals[entry.accountCode].debit += (entry.debit || 0);
      totals[entry.accountCode].credit += (entry.credit || 0);
    });

    const reportData = accounts.map(acc => {
      const bal = totals[acc.code] || { debit: 0, credit: 0 };
      return {
        _id: acc.id,
        code: acc.code,
        title: acc.title,
        type: acc.type,
        debit: bal.debit,
        credit: bal.credit
      };
    }).filter(r => r.debit > 0 || r.credit > 0);

    reportData.sort((a, b) => a.code.localeCompare(b.code));

    return ok(reportData);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
