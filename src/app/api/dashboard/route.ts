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

    const salesToday = await Invoice.aggregate([
      { $match: { type: "sale", createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    console.log("Dashboard API: salesToday fetched", salesToday);

    const receivables = await Party.aggregate([
      { $match: { type: "Customer" } }, 
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    console.log("Dashboard API: receivables fetched", receivables);

    const payables = await Party.aggregate([
      { $match: { type: "Vendor" } }, 
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    console.log("Dashboard API: payables fetched", payables);

    const lowStockCount = await Item.countDocuments({ 
      $expr: { $lte: ["$stockQtyCartons", "$reorderLevel"] } 
    });
    console.log("Dashboard API: lowStockCount fetched", lowStockCount);

    const bankBalances = await Bank.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);

    const cashOpening = await Account.aggregate([
      { $match: { type: "cash" } },
      { $group: { _id: null, total: { $sum: "$openingBalance" } } }
    ]);

    const cashTransactions = await JournalEntry.aggregate([
      { $match: { accountCode: "1111" } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]);

    const totalBank = bankBalances[0]?.total ?? 0;
    const totalCash = (cashOpening[0]?.total ?? 0) + (cashTransactions[0]?.balance ?? 0);

    return ok({
      salesToday: salesToday[0]?.total ?? 0,
      receivables: receivables[0]?.total ?? 0,
      payables: payables[0]?.total ?? 0,
      cashBankBalance: totalBank + totalCash,
      lowStockCount,
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}


export const dynamic = "force-dynamic";
