import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString();

    const journalEntries = await offlineDB.journalEntries.toArray();
    const accounts = await offlineDB.accounts.toArray();

    // Filter journal entries up to the specified date
    const filteredEntries = journalEntries.filter(entry => {
      const entryDate = entry.date.split("T")[0];
      const targetDate = date.split("T")[0];
      return entryDate <= targetDate;
    });

    // Group balances by code
    const groupBalances: Record<string, { debit: number; credit: number; title: string }> = {};
    filteredEntries.forEach(entry => {
      if (!groupBalances[entry.accountCode]) {
        groupBalances[entry.accountCode] = { debit: 0, credit: 0, title: entry.accountTitle };
      }
      groupBalances[entry.accountCode].debit += (entry.debit || 0);
      groupBalances[entry.accountCode].credit += (entry.credit || 0);
    });

    const accountMap = new Map(accounts.map(a => [a.code, a]));

    const report = {
      assets: [] as any[],
      liabilities: [] as any[],
      equity: [] as any[],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      netProfit: 0 // Retained Earnings
    };

    let totalRevenue = 0;
    let totalExpenses = 0;

    Object.entries(groupBalances).forEach(([code, journal]) => {
      const acc = accountMap.get(code);
      let type = acc ? acc.type.toLowerCase() : "";

      if (!type) {
        if (code.startsWith("1")) type = "asset";
        else if (code.startsWith("2")) type = "payable"; // liability
        else if (code.startsWith("3")) type = "equity";
        else if (code.startsWith("4")) type = "income";
        else if (code.startsWith("5")) type = "expense";
        else return;
      } else if (type === "revenue") {
        type = "income";
      } else if (type === "liability") {
        type = "payable";
      }

      const title = acc ? acc.title : journal.title;

      if (type === "income") {
        totalRevenue += (journal.credit - journal.debit);
      } else if (type === "expense") {
        totalExpenses += (journal.debit - journal.credit);
      } else if (["cash", "bank", "receivable", "asset"].includes(type)) {
        const balance = (journal.debit - journal.credit);
        if (balance !== 0) {
          report.assets.push({ title, balance });
          report.totalAssets += balance;
        }
      } else if (["payable", "liability"].includes(type)) {
        const liabBalance = (journal.credit - journal.debit);
        if (liabBalance !== 0) {
          report.liabilities.push({ title, balance: liabBalance });
          report.totalLiabilities += liabBalance;
        }
      } else if (type === "equity") {
        const eqBalance = (journal.credit - journal.debit);
        if (eqBalance !== 0) {
          report.equity.push({ title, balance: eqBalance });
          report.totalEquity += eqBalance;
        }
      }
    });

    report.netProfit = totalRevenue - totalExpenses;
    report.totalEquity += report.netProfit;

    return ok(report);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
