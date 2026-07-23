import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
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
    const salesInvoicesToday = await offlineDB.invoices
      .where("date")
      .between(startStr, endStr, true, true)
      .filter(inv => ["sale", "non_tax_sale", "challan"].includes(inv.type) && inv.status !== "cancelled")
      .toArray();
    
    const posSalesToday = await offlineDB.invoices
      .where("date")
      .between(startStr, endStr, true, true)
      .filter(inv => inv.type === "pos" && inv.status !== "cancelled")
      .toArray();
    
    const returnsToday = await offlineDB.invoices
      .where("date")
      .between(startStr, endStr, true, true)
      .filter(inv => ["sale_return", "non_tax_sale_return"].includes(inv.type) && inv.status !== "cancelled")
      .toArray();

    const saleInvoiceTotal = salesInvoicesToday.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const posSalesTotal = posSalesToday.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const returnTotal = returnsToday.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    const salesToday = (saleInvoiceTotal + posSalesTotal) - returnTotal;

    // 2. Low Stock Count
    const allItems = await offlineDB.items.toArray();
    const lowStockCount = allItems.filter(item => 
      (Number(item.stockQtyCartons) || 0) <= (Number(item.reorderLevel) || 0)
    ).length;

    // ==========================================
    // CASH & BANK BALANCES CALCULATIONS
    // ==========================================
    const cashBankAccs = await offlineDB.accounts
      .filter(acc => acc.type === "cash" || acc.type === "bank")
      .toArray();
    const cashBankCodes = cashBankAccs.map(a => a.code);
    
    // Initial opening balance from Account schema
    const cashBankInitialOpening = cashBankAccs.reduce((sum, acc) => sum + (Number(acc.openingBalance) || 0), 0);
    
    // Transactions before today (Opening Balance)
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    const cashBankTxBefore = allJournalEntries.filter(entry => 
      cashBankCodes.includes(entry.accountCode) && new Date(entry.date) < startOfDay
    );
    const cashBankOpening = cashBankInitialOpening + cashBankTxBefore.reduce((sum, entry) => 
      sum + (Number(entry.debit) || 0) - (Number(entry.credit) || 0), 0);

    // Receipts today (Debits today) - from JournalEntries
    const cashBankReceiptsToday = allJournalEntries.filter(entry => 
      cashBankCodes.includes(entry.accountCode) && new Date(entry.date) >= startOfDay && new Date(entry.date) <= endOfDay
    );
    const cashBankReceipts = cashBankReceiptsToday.reduce((sum, entry) => 
      sum + (Number(entry.debit) || 0), 0);

    // Payments today (Credits today) - from JournalEntries
    const cashBankPayments = cashBankReceiptsToday.reduce((sum, entry) => 
      sum + (Number(entry.credit) || 0), 0);
    
    const cashBankCurrent = cashBankOpening + cashBankReceipts - cashBankPayments;

    // ==========================================
    // RECEIVABLES CALCULATIONS (CUSTOMERS)
    // ==========================================
    const customers = await offlineDB.parties
      .filter(p => p.type === "Customer")
      .toArray();
    const recInitialOpening = customers.reduce((sum, c) => sum + (Number(c.openingBalance) || 0), 0);

    // Get receivable account code dynamically
    const recAccount = cashBankAccs.find(a => a.type === "receivable");
    const recAccountCode = recAccount?.code || "1100";

    // Opening Receivables before today
    const recTxBefore = allJournalEntries.filter(entry => 
      entry.accountCode === recAccountCode && new Date(entry.date) < startOfDay
    );
    const recOpening = recInitialOpening + recTxBefore.reduce((sum, entry) => 
      sum + (Number(entry.debit) || 0) - (Number(entry.credit) || 0), 0);

    // Sales (debits) today
    const recSalesToday = allJournalEntries.filter(entry => 
      entry.accountCode === recAccountCode && new Date(entry.date) >= startOfDay && new Date(entry.date) <= endOfDay
    );
    const recSalesTodayTotal = recSalesToday.reduce((sum, entry) => 
      sum + (Number(entry.debit) || 0), 0);

    // Receipts/Credits today
    const recReceiptsTodayTotal = recSalesToday.reduce((sum, entry) => 
      sum + (Number(entry.credit) || 0), 0);

    const recCurrent = recOpening + recSalesTodayTotal - recReceiptsTodayTotal;

    // ==========================================
    // PAYABLES CALCULATIONS (VENDORS)
    // ==========================================
    const vendors = await offlineDB.parties
      .filter(p => p.type === "Vendor")
      .toArray();
    const payInitialOpening = vendors.reduce((sum, v) => sum + (Number(v.openingBalance) || 0), 0);

    // Get payable account code dynamically
    const payAccount = cashBankAccs.find(a => a.type === "payable");
    const payAccountCode = payAccount?.code || "2100";

    // Opening Payables before today (Credit is positive, Debit is negative)
    const payTxBefore = allJournalEntries.filter(entry => 
      entry.accountCode === payAccountCode && new Date(entry.date) < startOfDay
    );
    const payOpening = payInitialOpening + payTxBefore.reduce((sum, entry) => 
      sum + (Number(entry.credit) || 0) - (Number(entry.debit) || 0), 0);

    // Purchases/Credits today
    const payPurchasesToday = allJournalEntries.filter(entry => 
      entry.accountCode === payAccountCode && new Date(entry.date) >= startOfDay && new Date(entry.date) <= endOfDay
    );
    const payPurchasesTodayTotal = payPurchasesToday.reduce((sum, entry) => 
      sum + (Number(entry.credit) || 0), 0);

    // Payments/Debits today
    const payPaymentsTodayTotal = payPurchasesToday.reduce((sum, entry) => 
      sum + (Number(entry.debit) || 0), 0);

    const payCurrent = payOpening + payPurchasesTodayTotal - payPaymentsTodayTotal;

    // ==========================================
    // ACTIVITY FEED
    // ==========================================
    const activities = [];
    
    // Recent Sales Invoices
    const recentSales = await offlineDB.invoices
      .filter(inv => 
        ["sale", "non_tax_sale", "pos", "challan"].includes(inv.type) && 
        inv.status !== "cancelled" &&
        new Date(inv.date) >= startOfDay && 
        new Date(inv.date) <= endOfDay
      )
      .reverse()
      .limit(10)
      .toArray();
    
    for (const sale of recentSales) {
      const party = sale.partyId ? await offlineDB.parties.get(sale.partyId) : null;
      activities.push({
        type: "sale",
        description: `Sale Invoice #${sale.invoiceNo} created`,
        amount: sale.totalAmount,
        party: party?.name || "Unknown",
        date: sale.date
      });
    }
    
    // Recent Sale Returns
    const recentSaleReturns = await offlineDB.invoices
      .filter(inv => 
        ["sale_return", "non_tax_sale_return"].includes(inv.type) && 
        inv.status !== "cancelled" &&
        new Date(inv.date) >= startOfDay && 
        new Date(inv.date) <= endOfDay
      )
      .reverse()
      .limit(5)
      .toArray();
    
    for (const ret of recentSaleReturns) {
      const party = ret.partyId ? await offlineDB.parties.get(ret.partyId) : null;
      activities.push({
        type: "sale_return",
        description: `Sale Return #${ret.invoiceNo} posted`,
        amount: ret.totalAmount,
        party: party?.name || "Unknown",
        date: ret.date
      });
    }
    
    // Recent Purchase Invoices
    const recentPurchases = await offlineDB.invoices
      .filter(inv => 
        ["purchase", "non_tax_purchase", "import_purchase"].includes(inv.type) && 
        inv.status !== "cancelled" &&
        new Date(inv.date) >= startOfDay && 
        new Date(inv.date) <= endOfDay
      )
      .reverse()
      .limit(5)
      .toArray();
    
    for (const purchase of recentPurchases) {
      const party = purchase.partyId ? await offlineDB.parties.get(purchase.partyId) : null;
      activities.push({
        type: "purchase",
        description: `Purchase Invoice #${purchase.invoiceNo} posted`,
        amount: purchase.totalAmount,
        party: party?.name || "Unknown",
        date: purchase.date
      });
    }
    
    // Recent Purchase Returns
    const recentPurchaseReturns = await offlineDB.invoices
      .filter(inv => 
        ["purchase_return", "non_tax_purchase_return"].includes(inv.type) && 
        inv.status !== "cancelled" &&
        new Date(inv.date) >= startOfDay && 
        new Date(inv.date) <= endOfDay
      )
      .reverse()
      .limit(5)
      .toArray();
    
    for (const ret of recentPurchaseReturns) {
      const party = ret.partyId ? await offlineDB.parties.get(ret.partyId) : null;
      activities.push({
        type: "purchase_return",
        description: `Purchase Return #${ret.invoiceNo} posted`,
        amount: ret.totalAmount,
        party: party?.name || "Unknown",
        date: ret.date
      });
    }
    
    // Recent Cash Receipts
    const recentCashReceipts = await offlineDB.cashReceipts
      .filter(r => 
        r.status === "Posted" &&
        new Date(r.date) >= startOfDay && 
        new Date(r.date) <= endOfDay
      )
      .reverse()
      .limit(5)
      .toArray();
    
    for (const receipt of recentCashReceipts) {
      const party = receipt.partyId ? await offlineDB.parties.get(receipt.partyId) : null;
      activities.push({
        type: "cash_receipt",
        description: `Cash Receipt #${receipt.receiptNumber} received`,
        amount: receipt.amount,
        party: party?.name || "Unknown",
        date: receipt.date
      });
    }
    
    // Recent Cash Payments
    const recentCashPayments = await offlineDB.cashPayments
      .filter(p => 
        p.status === "Posted" &&
        new Date(p.date) >= startOfDay && 
        new Date(p.date) <= endOfDay
      )
      .reverse()
      .limit(5)
      .toArray();
    
    for (const payment of recentCashPayments) {
      const party = payment.partyId ? await offlineDB.parties.get(payment.partyId) : null;
      activities.push({
        type: "cash_payment",
        description: `Cash Payment #${payment.voucherNo} made`,
        amount: payment.amount,
        party: party?.name || "Unknown",
        date: payment.date
      });
    }
    
    // Recent Bank Receipts
    const recentBankReceipts = await offlineDB.bankReceipts
      .filter(r => 
        r.status === "Posted" &&
        new Date(r.date) >= startOfDay && 
        new Date(r.date) <= endOfDay
      )
      .reverse()
      .limit(5)
      .toArray();
    
    for (const receipt of recentBankReceipts) {
      const party = receipt.partyId ? await offlineDB.parties.get(receipt.partyId) : null;
      activities.push({
        type: "bank_receipt",
        description: `Bank Receipt #${receipt.receiptNumber} received`,
        amount: receipt.amount,
        party: party?.name || "Unknown",
        date: receipt.date
      });
    }
    
    // Recent Bank Payments
    const recentBankPayments = await offlineDB.bankPayments
      .filter(p => 
        p.status === "Posted" &&
        new Date(p.date) >= startOfDay && 
        new Date(p.date) <= endOfDay
      )
      .reverse()
      .limit(5)
      .toArray();
    
    for (const payment of recentBankPayments) {
      const party = payment.partyId ? await offlineDB.parties.get(payment.partyId) : null;
      activities.push({
        type: "bank_payment",
        description: `Bank Payment #${payment.voucherNo} made`,
        amount: payment.amount,
        party: party?.name || "Unknown",
        date: payment.date
      });
    }
    
    // Sort activities by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Limit to 20 most recent activities
    const recentActivities = activities.slice(0, 20);

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
        sales: recSalesTodayTotal,
        receipts: recReceiptsTodayTotal,
        current: recCurrent
      },
      payables: {
        opening: payOpening,
        purchases: payPurchasesTodayTotal,
        payments: payPaymentsTodayTotal,
        current: payCurrent
      },
      activities: recentActivities
    });
    
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
