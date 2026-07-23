import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const accounts = await offlineDB.accounts.toArray();
    const journalEntries = await offlineDB.journalEntries.toArray();

    // Get cash and bank account codes
    const cashBankAccounts = accounts.filter(a => a.type === "cash" || a.type === "bank");
    const cbCodes = cashBankAccounts.map(a => a.code);

    // Opening Balance (total cash/bank balance before fromDate)
    const openingEntries = journalEntries.filter(entry => {
      const isCashBank = cbCodes.includes(entry.accountCode);
      if (!isCashBank) return false;
      if (fromDate) {
        const entryDate = entry.date.split("T")[0];
        return entryDate < fromDate;
      }
      return true;
    });

    const openingBalance = openingEntries.reduce((sum, entry) => {
      return sum + (entry.debit || 0) - (entry.credit || 0);
    }, 0);

    // Transactions during period
    const periodEntries = journalEntries.filter(entry => {
      const isCashBank = cbCodes.includes(entry.accountCode);
      if (!isCashBank) return false;
      const entryDate = entry.date.split("T")[0];
      if (fromDate && entryDate < fromDate) return false;
      if (toDate && entryDate > toDate) return false;
      return true;
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    const details = {
      operating: [] as any[],
      investing: [] as any[],
      financing: [] as any[]
    };

    periodEntries.forEach(m => {
      if (m.debit > 0) totalInflow += m.debit;
      if (m.credit > 0) totalOutflow += m.credit;
      
      // Basic categorization - put everything in operating for now
      details.operating.push({
        date: m.date,
        remarks: m.remarks,
        amount: (m.debit || 0) - (m.credit || 0)
      });
    });

    const closingBalance = openingBalance + totalInflow - totalOutflow;

    return ok({
      openingBalance,
      totalInflow,
      totalOutflow,
      closingBalance,
      details
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
