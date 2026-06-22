import { ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Item from "@/models/Item";
import Party from "@/models/Party";
import Account from "@/models/Account";
import JournalEntry from "@/models/JournalEntry";
import CashPayment from "@/models/CashPayment";
import CashReceipt from "@/models/CashReceipt";
import BankPayment from "@/models/BankPayment";
import BankReceipt from "@/models/BankReceipt";

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD format
    
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startStr = startOfDay.toISOString().split("T")[0];
    const endStr = endOfDay.toISOString().split("T")[0];

    // 1. Sales today (Daily Sales) - representing actual cash received
    // Include: Sale Invoices cash received (amountReceived), POS Sales total (since POS is cash/card received, so totalAmount)
    // Less: Sale Returns and POS Returns total amount
    const salesInvoicesTodayRes = await Invoice.aggregate([
      { $match: { type: { $in: ["sale", "non_tax_sale", "challan"] }, date: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const posSalesTodayRes = await Invoice.aggregate([
      { $match: { type: "pos", date: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const returnsTodayRes = await Invoice.aggregate([
      { $match: { type: { $in: ["sale_return", "non_tax_sale_return"] }, date: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const saleInvoiceTotal = salesInvoicesTodayRes[0]?.total ?? 0;
    const posSalesTotal = posSalesTodayRes[0]?.total ?? 0;
    const returnTotal = returnsTodayRes[0]?.total ?? 0;

    const salesToday = (saleInvoiceTotal + posSalesTotal) - returnTotal;

    // 2. Low Stock Count
    const lowStockCount = await Item.countDocuments({
      $expr: { $lte: ["$stockQtyCartons", "$reorderLevel"] }
    });

    // ==========================================
    // CASH & BANK BALANCES CALCULATIONS
    // ==========================================
    const cashBankAccs = await Account.find({ type: { $in: ["cash", "bank"] } }).lean();
    const cashBankCodes = Array.from(new Set(cashBankAccs.map((a: any) => a.code).concat(["1111", "1110"])));
    
    // Initial opening balance from Account schema
    const cashBankInitialOpening = cashBankAccs.reduce((sum, acc) => sum + (acc.openingBalance ?? 0), 0);
    
    // Transactions before today (Opening Balance)
    const cashBankTxBefore = await JournalEntry.aggregate([
      { $match: { accountCode: { $in: cashBankCodes }, date: { $lt: startOfDay } } },
      { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]);
    const cashBankOpening = cashBankInitialOpening + (cashBankTxBefore[0]?.balance ?? 0);

    // Receipts today (Debits today)
    const cashBankReceiptsRes = await JournalEntry.aggregate([
      { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$debit" } } }
    ]);
    const cashBankReceipts = cashBankReceiptsRes[0]?.total ?? 0;

    // Payments today (Credits today)
    const cashBankPaymentsRes = await JournalEntry.aggregate([
      { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$credit" } } }
    ]);
    const cashBankPayments = cashBankPaymentsRes[0]?.total ?? 0;
    
    const cashBankCurrent = cashBankOpening + cashBankReceipts - cashBankPayments;

    // ==========================================
    // RECEIVABLES CALCULATIONS (CUSTOMERS)
    // ==========================================
    const customers = await Party.find({ type: "Customer" }).lean();
    const recInitialOpening = customers.reduce((sum, c) => sum + (c.openingBalance ?? 0), 0);

    // Opening Receivables before today
    const recTxBefore = await JournalEntry.aggregate([
      { $match: { accountCode: "1100", date: { $lt: startOfDay } } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$debit", "$credit"] } } } }
    ]);
    const recOpening = recInitialOpening + (recTxBefore[0]?.total ?? 0);

    // Sales (debits) today
    const recSalesTodayRes = await JournalEntry.aggregate([
      { $match: { accountCode: "1100", date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$debit" } } }
    ]);
    const recSalesToday = recSalesTodayRes[0]?.total ?? 0;

    // Receipts/Credits today
    const recReceiptsTodayRes = await JournalEntry.aggregate([
      { $match: { accountCode: "1100", date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$credit" } } }
    ]);
    const recReceiptsToday = recReceiptsTodayRes[0]?.total ?? 0;

    const recCurrent = recOpening + recSalesToday - recReceiptsToday;

    // ==========================================
    // PAYABLES CALCULATIONS (VENDORS)
    // ==========================================
    const vendors = await Party.find({ type: "Vendor" }).lean();
    const payInitialOpening = vendors.reduce((sum, v) => sum + (v.openingBalance ?? 0), 0);

    // Opening Payables before today (Credit is positive, Debit is negative)
    const payTxBefore = await JournalEntry.aggregate([
      { $match: { accountCode: "2100", date: { $lt: startOfDay } } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$credit", "$debit"] } } } }
    ]);
    const payOpening = payInitialOpening + (payTxBefore[0]?.total ?? 0);

    // Purchases/Credits today
    const payPurchasesTodayRes = await JournalEntry.aggregate([
      { $match: { accountCode: "2100", date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$credit" } } }
    ]);
    const payPurchasesToday = payPurchasesTodayRes[0]?.total ?? 0;

    // Payments/Debits today
    const payPaymentsTodayRes = await JournalEntry.aggregate([
      { $match: { accountCode: "2100", date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$debit" } } }
    ]);
    const payPaymentsToday = payPaymentsTodayRes[0]?.total ?? 0;

    const payCurrent = payOpening + payPurchasesToday - payPaymentsToday;

    return ok({
      salesToday: salesToday,
      lowStockCount,
      cashBank: {
        opening: cashBankOpening,
        receipts: cashBankReceipts,
        payments: cashBankPayments,
        current: cashBankCurrent
      },
      receivables: {
        opening: recOpening,
        sales: recSalesToday,
        receipts: recReceiptsToday,
        current: recCurrent
      },
      payables: {
        opening: payOpening,
        purchases: payPurchasesToday,
        payments: payPaymentsToday,
        current: payCurrent
      }
    });
    
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
