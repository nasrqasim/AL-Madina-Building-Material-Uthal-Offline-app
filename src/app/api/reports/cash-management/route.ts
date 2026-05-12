import { ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Account from "@/models/Account";
import JournalEntry from "@/models/JournalEntry";
import Invoice from "@/models/Invoice";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate") || new Date().toISOString();
    const toDate = searchParams.get("toDate") || new Date().toISOString();

    await dbConnect();

    // 1. Get cash/bank accounts
    const cbAccounts = await Account.find({ type: { $in: ["cash", "bank"] } }).lean();
    const cbCodes = cbAccounts.map((a: any) => a.code);

    // 2. Opening Balance
    const openingRes = await JournalEntry.aggregate([
      { $match: { accountCode: { $in: cbCodes }, date: { $lt: new Date(fromDate) } } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]);
    const openingBalance = openingRes[0]?.balance || 0;

    // 3. Movements during period
    const movements = await JournalEntry.aggregate([
      { $match: { accountCode: { $in: cbCodes }, date: { $gte: new Date(fromDate), $lte: new Date(toDate) } } },
      { $group: { _id: null, inflow: { $sum: "$debit" }, outflow: { $sum: "$credit" } } }
    ]);
    const totalInflow = movements[0]?.inflow || 0;
    const totalOutflow = movements[0]?.outflow || 0;
    const closingBalance = openingBalance + totalInflow - totalOutflow;

    // 4. Upcoming Payables (posted but not paid)
    const payables = await Invoice.find({
      type: "purchase",
      status: { $in: ["posted", "received"] },
      dueDate: { $gte: new Date() }
    }).populate("partyId").sort({ dueDate: 1 }).limit(10).lean();

    // 5. Expected Receivables
    const receivables = await Invoice.find({
      type: "sale",
      status: { $in: ["posted", "delivered"] },
      dueDate: { $gte: new Date() }
    }).populate("partyId").sort({ dueDate: 1 }).limit(10).lean();

    return ok({
      openingBalance,
      totalInflow,
      totalOutflow,
      closingBalance,
      payables: payables.map((p: any) => ({
        vendor: p.partyId?.name || "Unknown",
        invoiceNo: p.invoiceNo,
        amount: p.totalAmount,
        dueDate: p.dueDate
      })),
      receivables: receivables.map((r: any) => ({
        customer: r.partyId?.name || "Unknown",
        invoiceNo: r.invoiceNo,
        amount: r.totalAmount,
        dueDate: r.dueDate
      })),
      waterfall: [
        { name: 'Opening', value: openingBalance, type: 'total' },
        { name: 'Total Inflow', value: totalInflow, type: 'inflow' },
        { name: 'Total Outflow', value: -totalOutflow, type: 'outflow' },
        { name: 'Closing', value: closingBalance, type: 'total' },
      ]
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
