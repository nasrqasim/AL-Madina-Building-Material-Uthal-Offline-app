import { ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Account from "@/models/Account";
import JournalEntry from "@/models/JournalEntry";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    await dbConnect();

    const match: any = {};
    if (fromDate || toDate) {
      match.date = {};
      if (fromDate) match.date.$gte = new Date(fromDate);
      if (toDate) match.date.$lte = new Date(toDate);
    }

    const journalBalances = await JournalEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$accountCode",
          debit: { $sum: "$debit" },
          credit: { $sum: "$credit" },
        },
      },
    ]);

    const balanceMap = new Map();
    journalBalances.forEach((jb) => {
      balanceMap.set(jb._id, jb);
    });

    const accounts = await Account.find().lean();
    const accountMap = new Map();
    accounts.forEach(a => accountMap.set(a.code, a));

    const report = {
      revenue: [] as any[],
      expenses: [] as any[],
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0
    };

    // First grab titles from Journal Entries in case they aren't in Account collection
    const journalTitles = await JournalEntry.aggregate([
      { $match: match },
      { $group: { _id: "$accountCode", title: { $first: "$accountTitle" } } }
    ]);
    const titleMap = new Map(journalTitles.map((t: any) => [t._id, t.title]));

    balanceMap.forEach((journal, code) => {
      const acc = accountMap.get(code);
      let type = acc ? acc.type.toLowerCase() : "";
      
      // Infer type if missing or not an account
      if (!type) {
         if (code.startsWith("4")) type = "income";
         else if (code.startsWith("5")) type = "expense";
         else return; // Ignore assets/liabilities
      } else if (type === "revenue") {
         type = "income";
      }

      const title = acc ? acc.title : (titleMap.get(code) || `Account ${code}`);

      if (type === "income" || type === "revenue") {
        const balance = (journal.credit - journal.debit);
        if (balance !== 0) {
            report.revenue.push({ title, amount: balance });
            report.totalRevenue += balance;
        }
      } else if (type === "expense") {
        const balance = (journal.debit - journal.credit);
        if (balance !== 0) {
            report.expenses.push({ title, amount: balance });
            report.totalExpenses += balance;
        }
      }
    });

    report.netProfit = report.totalRevenue - report.totalExpenses;

    return ok(report);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
