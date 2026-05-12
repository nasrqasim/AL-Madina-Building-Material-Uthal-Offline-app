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

    // 1. Get all cash and bank accounts
    const cashBankAccounts = await Account.find({ type: { $in: ["cash", "bank"] } }).lean();
    const cbCodes = cashBankAccounts.map((a: any) => a.code);

    // 2. Opening Balance (total cash/bank balance before fromDate)
    const openingMatch: any = { accountCode: { $in: cbCodes } };
    if (fromDate) openingMatch.date = { $lt: new Date(fromDate) };

    const openingRes = await JournalEntry.aggregate([
      { $match: openingMatch },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]);
    const openingBalance = openingRes[0]?.balance || 0;

    // 3. Transactions during period
    const match: any = { date: {} };
    if (fromDate) match.date.$gte = new Date(fromDate);
    if (toDate) match.date.$lte = new Date(toDate);

    // Fetch all journal entries during period that involve cash/bank
    // We want to find the OTHER side of the transaction to categorize it
    // But since JournalEntry is flat, we might need the invoiceId or voucherNo to find the counterparts.
    // For now, let's simplify: 
    // Inflows = total debits to cash/bank
    // Outflows = total credits to cash/bank

    const movements = await JournalEntry.find({
      ...match,
      accountCode: { $in: cbCodes }
    }).lean();

    let totalInflow = 0;
    let totalOutflow = 0;
    const details = {
      operating: [] as any[],
      investing: [] as any[],
      financing: [] as any[]
    };

    movements.forEach((m: any) => {
      if (m.debit > 0) totalInflow += m.debit;
      if (m.credit > 0) totalOutflow += m.credit;
      
      // Basic categorization based on remarks or account types if we had them linked
      // For now, put everything in operating
      details.operating.push({
        date: m.date,
        remarks: m.remarks,
        amount: m.debit - m.credit
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
