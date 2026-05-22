import { ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Item from "@/models/Item";
import Party from "@/models/Party";
import Account from "@/models/Account";
import JournalEntry from "@/models/JournalEntry";

export async function GET() {
  try {
    console.log("Dashboard API: Connecting to DB...");
    await dbConnect();
    console.log("Dashboard API: Connected. Fetching data...");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Today's Sales
    const salesToday = await Invoice.aggregate([
      { $match: { type: "sale", createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    console.log("Dashboard API: salesToday fetched", salesToday);

    // 2. Receivables: Sum of Customer outstanding balances (real-time udhaar)
    const customerBalances = await Party.find({ type: "Customer" }).lean();
    const totalReceivables = customerBalances.reduce((sum, p) => sum + (p.balance ?? 0), 0);
    console.log("Dashboard API: totalReceivables calculated", totalReceivables);

    // 3. Payables: Sum of Vendor outstanding balances
    const vendorBalances = await Party.find({ type: "Vendor" }).lean();
    const totalPayables = vendorBalances.reduce((sum, p) => sum + (p.balance ?? 0), 0);
    console.log("Dashboard API: totalPayables calculated", totalPayables);

    // 4. Low stock items
    const lowStockCount = await Item.countDocuments({ 
      $expr: { $lte: ["$stockQtyCartons", "$reorderLevel"] } 
    });
    console.log("Dashboard API: lowStockCount fetched", lowStockCount);

    // 5. Cash & Bank balances from Account opening + JournalEntry
    const cashOpeningAccs = await Account.find({ type: "cash" }).lean();
    const cashOpening = cashOpeningAccs.reduce((sum, acc) => sum + (acc.openingBalance ?? 0), 0);
    const cashCodes = cashOpeningAccs.map((acc: any) => acc.code);

    const cashTransactions = cashCodes.length > 0 ? await JournalEntry.aggregate([
      { $match: { accountCode: { $in: cashCodes } } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]) : [];
    const totalCash = cashOpening + (cashTransactions[0]?.balance ?? 0);

    const bankOpeningAccs = await Account.find({ type: "bank" }).lean();
    const bankOpening = bankOpeningAccs.reduce((sum, acc) => sum + (acc.openingBalance ?? 0), 0);
    const bankCodes = bankOpeningAccs.map((acc: any) => acc.code);

    const bankTransactions = bankCodes.length > 0 ? await JournalEntry.aggregate([
      { $match: { accountCode: { $in: bankCodes } } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]) : [];
    const totalBank = bankOpening + (bankTransactions[0]?.balance ?? 0);

    const cashBankBalance = totalCash + totalBank;
    console.log("Dashboard API: cashBankBalance calculated", cashBankBalance);

    return ok({
      salesToday: salesToday[0]?.total ?? 0,
      receivables: totalReceivables,
      payables: totalPayables,
      cashBankBalance: cashBankBalance,
      lowStockCount,
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
