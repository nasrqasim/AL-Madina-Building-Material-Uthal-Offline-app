import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD format
    
    // Determine target date string (YYYY-MM-DD)
    const targetDateStr = dateParam || new Date().toISOString().split("T")[0];

    // Helper functions for date comparison on YYYY-MM-DD
    const getDateStr = (d?: string) => {
      if (!d) return "";
      try {
        return new Date(d).toISOString().split("T")[0];
      } catch {
        return String(d).slice(0, 10);
      }
    };

    const isTargetDay = (d?: string) => getDateStr(d) === targetDateStr;
    const isBeforeTargetDay = (d?: string) => {
      const ds = getDateStr(d);
      return ds !== "" && ds < targetDateStr;
    };

    // ==========================================
    // 1. INVOICES TODAY & SALES TODAY
    // ==========================================
    const allInvoices = await offlineDB.invoices.toArray();
    const activeInvoices = allInvoices.filter(inv => inv.status !== "cancelled" && inv.status !== "draft");

    const salesInvoicesToday = activeInvoices.filter(inv => 
      ["sale", "non_tax_sale", "pos", "challan"].includes(inv.type) && isTargetDay(inv.date)
    );
    const saleReturnsToday = activeInvoices.filter(inv => 
      ["sale_return", "non_tax_sale_return"].includes(inv.type) && isTargetDay(inv.date)
    );

    const purchaseInvoicesToday = activeInvoices.filter(inv => 
      ["purchase", "non_tax_purchase", "import_purchase"].includes(inv.type) && isTargetDay(inv.date)
    );
    const purchaseReturnsToday = activeInvoices.filter(inv => 
      ["purchase_return", "non_tax_purchase_return"].includes(inv.type) && isTargetDay(inv.date)
    );

    const totalSalesTodayAmount = salesInvoicesToday.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const totalSaleReturnsTodayAmount = saleReturnsToday.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const salesToday = totalSalesTodayAmount - totalSaleReturnsTodayAmount;

    const totalPurchasesTodayAmount = purchaseInvoicesToday.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const totalPurchaseReturnsTodayAmount = purchaseReturnsToday.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    // ==========================================
    // 2. LOW STOCK COUNT
    // ==========================================
    const allItems = await offlineDB.items.toArray();
    const lowStockCount = allItems.filter(item => 
      (Number(item.stockQtyCartons) || 0) <= (Number(item.reorderLevel) || 0)
    ).length;

    // ==========================================
    // 3. CASH & BANK BALANCES CALCULATIONS
    // ==========================================
    const accounts = await offlineDB.accounts.toArray();
    const cashBankAccs = accounts.filter(acc => acc.type === "cash" || acc.type === "bank");
    
    // Always include standard cash & bank codes
    const defaultCashBankCodes = new Set(["1111", "1110", "1101", "1102", "CASH", "BANK"]);
    cashBankAccs.forEach(a => { if (a.code) defaultCashBankCodes.add(a.code); });

    // Initial opening balance from accounts schema
    const cashBankInitialOpening = cashBankAccs.reduce((sum, acc) => sum + (Number(acc.openingBalance) || 0), 0);
    
    const allJournalEntries = await offlineDB.journalEntries.toArray();

    // Cash/Bank entries before target date
    const cashBankTxBefore = allJournalEntries.filter(entry => 
      defaultCashBankCodes.has(entry.accountCode) && isBeforeTargetDay(entry.date)
    );
    const cashBankOpening = cashBankInitialOpening + cashBankTxBefore.reduce((sum, entry) => 
      sum + (Number(entry.debit) || 0) - (Number(entry.credit) || 0), 0);

    // Cash/Bank entries on target date
    const cashBankTxToday = allJournalEntries.filter(entry => 
      defaultCashBankCodes.has(entry.accountCode) && isTargetDay(entry.date)
    );
    const cashBankReceipts = cashBankTxToday.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
    const cashBankPayments = cashBankTxToday.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);

    // Total Cash/Bank balance across all entries up to end of target date
    const cashBankTxAll = allJournalEntries.filter(entry => 
      defaultCashBankCodes.has(entry.accountCode) && (isBeforeTargetDay(entry.date) || isTargetDay(entry.date))
    );
    const cashBankCurrent = cashBankInitialOpening + cashBankTxAll.reduce((sum, entry) => 
      sum + (Number(entry.debit) || 0) - (Number(entry.credit) || 0), 0);

    // ==========================================
    // 4. RECEIVABLES CALCULATIONS (CUSTOMERS)
    // ==========================================
    const allParties = await offlineDB.parties.toArray();
    const customers = allParties.filter(p => p.type === "Customer");
    const recInitialOpening = customers.reduce((sum, c) => sum + (Number(c.openingBalance) || 0), 0);

    const recAccountCodes = new Set(["1100", "AR"]);

    // Receivables before target date
    const recTxBefore = allJournalEntries.filter(entry => 
      recAccountCodes.has(entry.accountCode) && isBeforeTargetDay(entry.date)
    );
    const recOpening = recInitialOpening + recTxBefore.reduce((sum, entry) => 
      sum + (Number(entry.debit) || 0) - (Number(entry.credit) || 0), 0);

    // Receivables debits (Sales on credit) & credits (Customer payments) today
    const recTxToday = allJournalEntries.filter(entry => 
      recAccountCodes.has(entry.accountCode) && isTargetDay(entry.date)
    );
    
    // Total Sales today (sum of invoice totals for sales today)
    const recSalesTodayTotal = totalSalesTodayAmount;
    
    // Customer receipts today (from journal entries or direct cash/bank receipts)
    const recReceiptsTodayTotal = recTxToday.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0) +
      salesInvoicesToday.filter(inv => inv.paymentMethod === "Cash" || inv.paymentMethod === "Card").reduce((sum, inv) => sum + (Number(inv.amountReceived) || 0), 0);

    // Current total Customer Receivables (sum of all customer party balances in SQLite)
    const recCurrent = customers.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);

    // ==========================================
    // 5. PAYABLES CALCULATIONS (VENDORS)
    // ==========================================
    const vendors = allParties.filter(p => p.type === "Vendor");
    const payInitialOpening = vendors.reduce((sum, v) => sum + (Number(v.openingBalance) || 0), 0);

    const payAccountCodes = new Set(["2100", "AP"]);

    // Payables before target date
    const payTxBefore = allJournalEntries.filter(entry => 
      payAccountCodes.has(entry.accountCode) && isBeforeTargetDay(entry.date)
    );
    const payOpening = payInitialOpening + payTxBefore.reduce((sum, entry) => 
      sum + (Number(entry.credit) || 0) - (Number(entry.debit) || 0), 0);

    // Payables credits (Purchases) & debits (Vendor payments) today
    const payTxToday = allJournalEntries.filter(entry => 
      payAccountCodes.has(entry.accountCode) && isTargetDay(entry.date)
    );
    
    const payPurchasesTodayTotal = totalPurchasesTodayAmount;
    const payPaymentsTodayTotal = payTxToday.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0) +
      purchaseInvoicesToday.filter(inv => inv.paymentMethod === "Cash" || inv.paymentMethod === "Card").reduce((sum, inv) => sum + (Number(inv.amountReceived) || 0), 0);

    // Current total Vendor Payables (sum of all vendor party balances in SQLite)
    const payCurrent = vendors.reduce((sum, v) => sum + (Number(v.balance) || Number(v.payable) || 0), 0);

    // ==========================================
    // 6. ACTIVITY FEED
    // ==========================================
    const activities: any[] = [];
    const partyMap = new Map(allParties.map(p => [p.id || p._id, p]));

    // Sales Invoices today
    for (const sale of salesInvoicesToday) {
      const party = sale.partyId ? partyMap.get(sale.partyId) : null;
      activities.push({
        type: "sale",
        description: `Sale Invoice #${sale.invoiceNo} created`,
        amount: Number(sale.totalAmount) || 0,
        party: party?.name || party?.companyName || "Walk-in Customer",
        date: sale.date
      });
    }
    
    // Sale Returns today
    for (const ret of saleReturnsToday) {
      const party = ret.partyId ? partyMap.get(ret.partyId) : null;
      activities.push({
        type: "sale_return",
        description: `Sale Return #${ret.invoiceNo} posted`,
        amount: Number(ret.totalAmount) || 0,
        party: party?.name || party?.companyName || "Walk-in Customer",
        date: ret.date
      });
    }
    
    // Purchase Invoices today
    for (const purchase of purchaseInvoicesToday) {
      const party = purchase.partyId ? partyMap.get(purchase.partyId) : null;
      activities.push({
        type: "purchase",
        description: `Purchase Invoice #${purchase.invoiceNo} posted`,
        amount: Number(purchase.totalAmount) || 0,
        party: party?.name || party?.companyName || "Walk-in Vendor",
        date: purchase.date
      });
    }
    
    // Purchase Returns today
    for (const ret of purchaseReturnsToday) {
      const party = ret.partyId ? partyMap.get(ret.partyId) : null;
      activities.push({
        type: "purchase_return",
        description: `Purchase Return #${ret.invoiceNo} posted`,
        amount: Number(ret.totalAmount) || 0,
        party: party?.name || party?.companyName || "Walk-in Vendor",
        date: ret.date
      });
    }
    
    // Cash Receipts today
    const cashReceipts = await offlineDB.cashReceipts.toArray();
    for (const receipt of cashReceipts.filter(r => r.status === "Posted" && isTargetDay(r.date))) {
      const party = receipt.partyId ? partyMap.get(receipt.partyId) : null;
      activities.push({
        type: "cash_receipt",
        description: `Cash Receipt #${receipt.receiptNumber} received`,
        amount: Number(receipt.amount) || 0,
        party: party?.name || party?.companyName || "Customer",
        date: receipt.date
      });
    }
    
    // Cash Payments today
    const cashPayments = await offlineDB.cashPayments.toArray();
    for (const payment of cashPayments.filter(p => p.status === "Posted" && isTargetDay(p.date))) {
      const party = payment.partyId ? partyMap.get(payment.partyId) : null;
      activities.push({
        type: "cash_payment",
        description: `Cash Payment #${payment.voucherNo} made`,
        amount: Number(payment.amount) || 0,
        party: party?.name || party?.companyName || "Vendor",
        date: payment.date
      });
    }
    
    // Bank Receipts today
    const bankReceipts = await offlineDB.bankReceipts.toArray();
    for (const receipt of bankReceipts.filter(r => r.status === "Posted" && isTargetDay(r.date))) {
      const party = (receipt.partyId || receipt.party) ? partyMap.get(receipt.partyId || receipt.party) : null;
      activities.push({
        type: "bank_receipt",
        description: `Bank Receipt #${receipt.receiptNumber} received`,
        amount: Number(receipt.amount) || 0,
        party: party?.name || party?.companyName || "Customer",
        date: receipt.date
      });
    }
    
    // Bank Payments today
    const bankPayments = await offlineDB.bankPayments.toArray();
    for (const payment of bankPayments.filter(p => p.status === "Posted" && isTargetDay(p.date))) {
      const party = (payment.vendor || payment.partyId) ? partyMap.get(payment.vendor || payment.partyId) : null;
      activities.push({
        type: "bank_payment",
        description: `Bank Payment #${payment.voucherNo} made`,
        amount: Number(payment.amount) || 0,
        party: party?.name || party?.companyName || "Vendor",
        date: payment.date
      });
    }
    
    // Sort activities by date descending
    activities.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
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

