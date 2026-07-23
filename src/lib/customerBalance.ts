/** Unified Customer Balance Calculation System
 * 
 * This provides a single source of truth for customer balances across the entire ERP.
 * All pages (Customer Balances, Customer Ledger, Sale Invoice, Dashboard) must use this function.
 * 
 * Formula matches recalculatePartyBalance in postingService.ts exactly:
 *   debit  = manualDebit + totalInvoices + totalAdjustments
 *   credit = manualCredit + totalReturns + totalReceiptsPayments
 *   netBalance = openingBalance + debit - credit
 *   receivable = max(0, netBalance)
 *   advance    = max(0, -netBalance)
 */

import { offlineDB } from "./dexie";

export interface CustomerBalanceResult {
  receivable: number;           // Customer owes us (always >= 0)
  advance: number;              // We owe customer (always >= 0)
  netBalance: number;           // receivable - advance
  status: "Customer Owes" | "Advance Available" | "Settled";
}

/**
 * Calculate customer balance live from Dexie IndexedDB.
 * Can also accept pre-fetched transaction arrays for batch operations.
 */
export async function calculateCustomerBalance(
  customer: any,
  providedTransactions?: {
    sales?: any[];
    cashReceipts?: any[];
    bankReceipts?: any[];
    cashPayments?: any[];
    bankPayments?: any[];
  }
): Promise<CustomerBalanceResult> {
  if (!customer) {
    return { receivable: 0, advance: 0, netBalance: 0, status: "Settled" };
  }

  const customerId = typeof customer === "string" ? customer : customer._id || customer.id || "";
  let custObj = typeof customer === "string" ? null : customer;

  try {
    if (!custObj && customerId) {
      custObj = await offlineDB.parties.get(customerId);
    }

    if (!custObj) {
      return { receivable: 0, advance: 0, netBalance: 0, status: "Settled" };
    }

    // Walk-in Customer: always 0
    if ((custObj.name || custObj.companyName || "").toLowerCase().includes("walk-in")) {
      return { receivable: 0, advance: 0, netBalance: 0, status: "Settled" };
    }

    // Fetch transactions from Dexie if not provided
    let sales = providedTransactions?.sales;
    let cashReceipts = providedTransactions?.cashReceipts;
    let bankReceipts = providedTransactions?.bankReceipts;
    let cashPayments = providedTransactions?.cashPayments;
    let bankPayments = providedTransactions?.bankPayments;

    if (!sales || !cashReceipts || !bankReceipts || !cashPayments || !bankPayments) {
      const [allInvoices, allCashReceipts, allBankReceipts, allCashPayments, allBankPayments] = await Promise.all([
        offlineDB.invoices.where("partyId").equals(customerId).toArray(),
        offlineDB.cashReceipts.where("partyId").equals(customerId).toArray(),
        offlineDB.bankReceipts.toArray(),
        offlineDB.cashPayments.toArray(),
        offlineDB.bankPayments.toArray()
      ]);

      sales = sales || allInvoices;
      cashReceipts = cashReceipts || allCashReceipts;
      bankReceipts = bankReceipts || allBankReceipts;
      cashPayments = cashPayments || allCashPayments;
      bankPayments = bankPayments || allBankPayments;
    }

    return calculateBalanceFromTransactions(custObj, sales, cashReceipts, bankReceipts, cashPayments, bankPayments);
  } catch (error) {
    console.error("Error calculating customer balance:", error);
    const openingBalance = Number(custObj?.openingBalance) || 0;
    return {
      receivable: openingBalance > 0 ? openingBalance : 0,
      advance: openingBalance < 0 ? Math.abs(openingBalance) : 0,
      netBalance: openingBalance,
      status: openingBalance > 0 ? "Customer Owes" : openingBalance < 0 ? "Advance Available" : "Settled"
    };
  }
}

/**
 * Calculate balance from provided transaction arrays (synchronous, for batch/listing pages).
 * Uses the EXACT same formula as recalculatePartyBalance in postingService.ts.
 */
export function calculateBalanceFromTransactions(
  customer: any,
  sales: any[],
  cashReceipts: any[],
  bankReceipts: any[],
  cashPayments: any[] = [],
  bankPayments: any[] = []
): CustomerBalanceResult {
  if (!customer) {
    return { receivable: 0, advance: 0, netBalance: 0, status: "Settled" };
  }

  // Walk-in Customer: always 0
  if ((customer.name || customer.companyName || "").toLowerCase().includes("walk-in")) {
    return { receivable: 0, advance: 0, netBalance: 0, status: "Settled" };
  }

  const customerId = customer._id || customer.id || "";

  // Helper to match customer ID across different field formats
  const matchesCustomer = (partyVal: any): boolean => {
    if (!partyVal && !customerId) return false;
    const pId = typeof partyVal === "object" ? partyVal?._id || partyVal?.id || partyVal?.code || partyVal?.name : partyVal;
    const pStr = String(pId || "").toLowerCase();
    const cIdStr = String(customerId || "").toLowerCase();
    const cCodeStr = String(customer.code || "").toLowerCase();
    const cNameStr = String(customer.name || customer.companyName || "").toLowerCase();

    return Boolean(
      (cIdStr && pStr === cIdStr) ||
      (cCodeStr && pStr === cCodeStr) ||
      (cNameStr && pStr === cNameStr)
    );
  };

  // ── 1. Sales & Returns ──────────────────────────────────────────
  let totalInvoices = 0;
  let totalReturns = 0;
  const activeInvoices = (sales || []).filter(inv => inv.status !== "cancelled" && matchesCustomer(inv.partyId));

  for (const inv of activeInvoices) {
    const total = Number(inv.totalAmount) || 0;
    if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
      totalInvoices += total;
    } else if (["sale_return", "non_tax_sale_return"].includes(inv.type)) {
      totalReturns += total;
    }
  }

  // ── 2. Cash Receipts ────────────────────────────────────────────
  const activeCashReceipts = (cashReceipts || []).filter(
    r => r.status !== "Cancelled" && matchesCustomer(r.partyId)
  );
  const cashSum = activeCashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // ── 3. Bank Receipts ────────────────────────────────────────────
  const activeBankReceipts = (bankReceipts || []).filter(
    r => r.status !== "Cancelled" && (matchesCustomer(r.partyId) || matchesCustomer(r.party))
  );
  const bankSum = activeBankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // ── 4. Paid-at-creation (amountReceived on invoice, minus linked receipts) ──
  let totalReceivedAtCreation = 0;
  for (const inv of activeInvoices) {
    if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
      const invNo = inv.invoiceNo || "";
      if (!invNo) continue;
      const linkedCashAmt = activeCashReceipts
        .filter(r => r.reference === invNo || (r.narration && r.narration.toLowerCase().includes(invNo.toLowerCase())))
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const linkedBankAmt = activeBankReceipts
        .filter(r => r.instrumentNo === invNo || (r.narration && r.narration.toLowerCase().includes(invNo.toLowerCase())))
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      const amountReceived = Number(inv.amountReceived) || 0;
      const paidAtCreation = Math.max(0, amountReceived - (linkedCashAmt + linkedBankAmt));
      totalReceivedAtCreation += paidAtCreation;
    }
  }

  const totalReceiptsPayments = cashSum + bankSum + totalReceivedAtCreation;

  // ── 5. Adjustments (Payments/Refunds TO customer) ───────────────
  const activeCashPayments = (cashPayments || []).filter(
    p => p.status !== "Cancelled" && (matchesCustomer(p.partyId) || matchesCustomer(p.vendor))
  );
  const activeBankPayments = (bankPayments || []).filter(
    p => p.status !== "Cancelled" && (matchesCustomer(p.partyId) || matchesCustomer(p.vendor))
  );

  const totalAdjustments = activeCashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                           activeBankPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // ── 6. Final calculation (matches postingService.ts exactly) ────
  const openingBalance = Number(customer.openingBalance) || 0;
  const debit = (Number(customer.manualDebit) || 0) + totalInvoices + totalAdjustments;
  const credit = (Number(customer.manualCredit) || 0) + totalReturns + totalReceiptsPayments;
  const netBalance = openingBalance + debit - credit;

  const receivable = netBalance > 0 ? netBalance : 0;
  const advance = netBalance < 0 ? Math.abs(netBalance) : 0;

  let status: "Customer Owes" | "Advance Available" | "Settled" = "Settled";
  if (netBalance > 0) {
    status = "Customer Owes";
  } else if (netBalance < 0) {
    status = "Advance Available";
  }

  return { receivable, advance, netBalance, status };
}

/**
 * Get formatted balance display for UI
 */
export function formatBalance(balance: CustomerBalanceResult): {
  receivable: string;
  advance: string;
  netBalance: string;
  status: string;
  statusEmoji: string;
} {
  const statusEmoji = balance.status === "Customer Owes" ? "🔴" : 
                      balance.status === "Advance Available" ? "🟢" : "⚪";

  return {
    receivable: `Rs. ${balance.receivable.toLocaleString()}`,
    advance: `Rs. ${balance.advance.toLocaleString()}`,
    netBalance: `Rs. ${Math.abs(balance.netBalance).toLocaleString()}`,
    status: balance.status,
    statusEmoji
  };
}
