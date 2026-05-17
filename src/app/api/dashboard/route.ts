import { ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Item from "@/models/Item";
import Party from "@/models/Party";
import Bank from "@/models/Bank";
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

    // 2. Receivables from Party opening balance + JournalEntry (Account 1100)
    const customerOpening = await Party.aggregate([
      { $match: { type: "Customer" } },
      { $group: { _id: null, total: { $sum: "$openingBalance" } } }
    ]);
    const receivableTransactions = await JournalEntry.aggregate([
      { $match: { accountCode: "1100" } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]);
    const totalReceivables = (customerOpening[0]?.total ?? 0) + (receivableTransactions[0]?.balance ?? 0);
    console.log("Dashboard API: totalReceivables calculated", totalReceivables);

    // 3. Payables from Party opening balance + JournalEntry (Account 2100)
    const vendorOpening = await Party.aggregate([
      { $match: { type: "Vendor" } },
      { $group: { _id: null, total: { $sum: "$openingBalance" } } }
    ]);
    const payableTransactions = await JournalEntry.aggregate([
      { $match: { accountCode: "2100" } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$credit", "$debit"] } } } }
    ]);
    const totalPayables = (vendorOpening[0]?.total ?? 0) + (payableTransactions[0]?.balance ?? 0);
    console.log("Dashboard API: totalPayables calculated", totalPayables);

    // 4. Low stock items
    const lowStockCount = await Item.countDocuments({ 
      $expr: { $lte: ["$stockQtyCartons", "$reorderLevel"] } 
    });
    console.log("Dashboard API: lowStockCount fetched", lowStockCount);

    // 5. Cash & Bank balances from Account opening + JournalEntry (Accounts 1111 & 1110)
    const cashOpening = await Account.aggregate([
      { $match: { type: "cash" } },
      { $group: { _id: null, total: { $sum: "$openingBalance" } } }
    ]);
    const cashTransactions = await JournalEntry.aggregate([
      { $match: { accountCode: "1111" } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]);
    const totalCash = (cashOpening[0]?.total ?? 0) + (cashTransactions[0]?.balance ?? 0);

    const bankOpening = await Account.aggregate([
      { $match: { type: "bank" } },
      { $group: { _id: null, total: { $sum: "$openingBalance" } } }
    ]);
    const bankTransactions = await JournalEntry.aggregate([
      { $match: { accountCode: "1110" } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]);
    const totalBank = (bankOpening[0]?.total ?? 0) + (bankTransactions[0]?.balance ?? 0);

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
