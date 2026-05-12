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

    // 1. Fetch all accounts
    const accounts = await Account.find().lean();

    // 2. Fetch journal entries to calculate balances
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

    const journalTitles = await JournalEntry.aggregate([
      { $match: match },
      { $group: { _id: "$accountCode", title: { $first: "$accountTitle" } } }
    ]);
    const titleMap = new Map(journalTitles.map((t: any) => [t._id, t.title]));

    const accountMap = new Map(accounts.map((a: any) => [a.code, a]));

    const reportData: any[] = [];
    
    balanceMap.forEach((journal, code) => {
       const acc = accountMap.get(code);
       const title = acc ? acc.title : (titleMap.get(code) || `Account ${code}`);
       const type = acc ? acc.type : "Unknown";

       if (journal.debit > 0 || journal.credit > 0) {
           reportData.push({
               _id: acc ? acc._id : code,
               code: code,
               title: title,
               type: type,
               debit: journal.debit,
               credit: journal.credit
           });
       }
    });

    reportData.sort((a, b) => a.code.localeCompare(b.code));

    return ok(reportData);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
