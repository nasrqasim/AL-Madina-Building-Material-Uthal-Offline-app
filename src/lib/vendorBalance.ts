/** Unified Vendor Balance Calculation System
 * 
 * This provides a single source of truth for vendor balances across the entire ERP.
 * All pages (Vendor Balances, Vendor Ledger, Purchase Invoice, Dashboard) must use this function.
 * 
 * Formula mirrors customer balance but from vendor perspective:
 *   debit  = manualDebit + totalPayments (to vendor)
 *   credit = manualCredit + totalPurchases + totalReturns
 *   netBalance = openingBalance + debit - credit
 *   payable    = max(0, -netBalance)  // We owe vendor
 *   advance    = max(0, netBalance)   // Vendor owes us
 */

export interface VendorBalanceResult {
  payable: number;              // We owe vendor (always >= 0)
  advance: number;              // Vendor owes us (always >= 0)
  netBalance: number;           // advance - payable
  status: "We Owe Vendor" | "Advance Available" | "Settled";
}

export async function calculateVendorBalance(
  vendor: any,
  providedTransactions?: {
    purchases?: any[];
    purchaseReturns?: any[];
    cashPayments?: any[];
    bankPayments?: any[];
    cashReceipts?: any[];
    bankReceipts?: any[];
  }
): Promise<VendorBalanceResult> {
  if (!vendor) {
    return { payable: 0, advance: 0, netBalance: 0, status: "Settled" };
  }

  const vendorId = typeof vendor === "string" ? vendor : vendor._id || vendor.id || "";
  let vendorObj = typeof vendor === "string" ? null : vendor;

  try {
    const { offlineDB } = await import("./dexie");
    if (!vendorObj && vendorId) {
      vendorObj = await offlineDB.parties.get(vendorId);
    }

    if (!vendorObj) {
      return { payable: 0, advance: 0, netBalance: 0, status: "Settled" };
    }

    // Fetch transactions from Dexie if not provided
    let purchases = providedTransactions?.purchases;
    let purchaseReturns = providedTransactions?.purchaseReturns;
    let cashPayments = providedTransactions?.cashPayments;
    let bankPayments = providedTransactions?.bankPayments;
    let cashReceipts = providedTransactions?.cashReceipts;
    let bankReceipts = providedTransactions?.bankReceipts;

    if (!purchases || !purchaseReturns || !cashPayments || !bankPayments || !cashReceipts || !bankReceipts) {
      const [allInvoices, allCashPayments, allBankPayments, allCashReceipts, allBankReceipts] = await Promise.all([
        offlineDB.invoices.where("partyId").equals(vendorId).toArray(),
        offlineDB.cashPayments.toArray(),
        offlineDB.bankPayments.toArray(),
        offlineDB.cashReceipts.toArray(),
        offlineDB.bankReceipts.toArray()
      ]);

      purchases = purchases || allInvoices;
      cashPayments = cashPayments || allCashPayments;
      bankPayments = bankPayments || allBankPayments;
      cashReceipts = cashReceipts || allCashReceipts;
      bankReceipts = bankReceipts || allBankReceipts;
      purchaseReturns = purchaseReturns || [];
    }

    return calculateVendorBalanceFromTransactions(vendorObj, purchases, purchaseReturns, cashPayments, bankPayments, cashReceipts, bankReceipts);
  } catch (error) {
    console.error("Error calculating vendor balance:", error);
    const openingBalance = Number(vendorObj?.openingBalance) || 0;
    return {
      payable: openingBalance < 0 ? Math.abs(openingBalance) : 0,
      advance: openingBalance > 0 ? openingBalance : 0,
      netBalance: openingBalance,
      status: openingBalance < 0 ? "We Owe Vendor" : openingBalance > 0 ? "Advance Available" : "Settled"
    };
  }
}

export function isSameParty(p1: any, p2: any): boolean {
  if (!p1 || !p2) return false;
  
  // Extract IDs
  const id1 = typeof p1 === "object" ? (p1._id || p1.id || p1.code) : p1;
  const id2 = typeof p2 === "object" ? (p2._id || p2.id || p2.code) : p2;
  if (id1 && id2 && String(id1).toLowerCase() === String(id2).toLowerCase()) return true;

  // Extract Names
  const name1 = typeof p1 === "object" ? (p1.name || p1.companyName) : p1;
  const name2 = typeof p2 === "object" ? (p2.name || p2.companyName) : p2;
  if (name1 && name2 && String(name1).trim().toLowerCase() === String(name2).trim().toLowerCase()) return true;

  return false;
}

/**
 * Calculate vendor balance from provided transaction arrays (synchronous, for batch/listing pages).
 * Uses the EXACT same formula as customer balance but inverted for vendor perspective.
 */
export function calculateVendorBalanceFromTransactions(
  vendor: any,
  purchases: any[],
  purchaseReturns: any[] = [],
  cashPayments: any[],
  bankPayments: any[],
  cashReceipts: any[] = [],
  bankReceipts: any[] = []
): VendorBalanceResult {
  if (!vendor) {
    return { payable: 0, advance: 0, netBalance: 0, status: "Settled" };
  }

  const matchesVendor = (partyVal: any): boolean => {
    return isSameParty(partyVal, vendor);
  };

  // ── 1. Purchases & Purchase Returns ─────────────────────────────
  let totalPurchases = 0;
  let totalPurchaseReturns = 0;
  const activePurchases = (purchases || []).filter(inv => inv.status !== "cancelled" && matchesVendor(inv.partyId));

  for (const inv of activePurchases) {
    const total = Number(inv.totalAmount) || 0;
    if (["purchase", "non_tax_purchase"].includes(inv.type)) {
      totalPurchases += total;
    } else if (["purchase_return", "non_tax_purchase_return"].includes(inv.type)) {
      totalPurchaseReturns += total;
    }
  }

  // ── 2. Payments TO Vendor (Cash + Bank) ─────────────────────────
  const activeCashPayments = (cashPayments || []).filter(
    p => p.status !== "Cancelled" && (matchesVendor(p.partyId) || matchesVendor(p.vendor))
  );
  const activeBankPayments = (bankPayments || []).filter(
    p => p.status !== "Cancelled" && (matchesVendor(p.partyId) || matchesVendor(p.vendor))
  );
  const totalPayments = activeCashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                        activeBankPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // ── 3. Paid-at-creation (amountPaid on purchase, minus linked payments) ──
  let totalPaidAtCreation = 0;
  for (const inv of activePurchases) {
    if (["purchase", "non_tax_purchase"].includes(inv.type)) {
      const invNo = inv.invoiceNo || "";
      if (!invNo) continue;
      const linkedCashAmt = activeCashPayments
        .filter(p => p.reference === invNo || (p.narration && p.narration.toLowerCase().includes(invNo.toLowerCase())))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const linkedBankAmt = activeBankPayments
        .filter(p => p.instrumentNo === invNo || (p.narration && p.narration.toLowerCase().includes(invNo.toLowerCase())))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const amountPaid = Number(inv.amountPaid) || Number(inv.amountReceived) || 0;
      const paidAtCreation = Math.max(0, amountPaid - (linkedCashAmt + linkedBankAmt));
      totalPaidAtCreation += paidAtCreation;
    }
  }

  // ── 3.5. Advance used on purchases (advanceAmountUsed) ──
  // When vendor advance is used on a purchase, it counts as a payment (debit) to reduce the advance
  let totalAdvanceUsed = 0;
  for (const inv of activePurchases) {
    if (["purchase", "non_tax_purchase"].includes(inv.type) && inv.useAdvance === true) {
      totalAdvanceUsed += Number(inv.advanceAmountUsed) || 0;
    }
  }

  const totalPaymentsMade = totalPayments + totalPaidAtCreation + totalAdvanceUsed;

  // ── 4. Receipts FROM Vendor (Cash + Bank) - rare but possible ─────
  const activeCashReceipts = (cashReceipts || []).filter(
    r => r.status !== "Cancelled" && (matchesVendor(r.partyId) || matchesVendor(r.vendor))
  );
  const activeBankReceipts = (bankReceipts || []).filter(
    r => r.status !== "Cancelled" && (matchesVendor(r.partyId) || matchesVendor(r.vendor))
  );
  const totalReceipts = activeCashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) +
                       activeBankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // ── 5. Final calculation (mirrors customer balance but inverted) ────
  const openingBalance = Number(vendor.openingBalance) || 0;
  // For vendors: payments reduce payable, purchases increase payable
  // debit = payments TO vendor (reduces what we owe)
  // credit = purchases FROM vendor (increases what we owe)
  const debit = (Number(vendor.manualDebit) || 0) + totalPaymentsMade + totalReceipts;
  const credit = (Number(vendor.manualCredit) || 0) + totalPurchases + totalPurchaseReturns;
  const netBalance = openingBalance + debit - credit;

  // For vendors: negative netBalance means we owe them (payable)
  // positive netBalance means they owe us (advance)
  const payable = netBalance < 0 ? Math.abs(netBalance) : 0;
  const advance = netBalance > 0 ? netBalance : 0;

  let status: "We Owe Vendor" | "Advance Available" | "Settled" = "Settled";
  if (netBalance < 0) {
    status = "We Owe Vendor";
  } else if (netBalance > 0) {
    status = "Advance Available";
  }

  return { payable, advance, netBalance, status };
}

/**
 * Get formatted balance display for UI
 */
export function formatVendorBalance(balance: VendorBalanceResult): {
  payable: string;
  advance: string;
  netBalance: string;
  status: string;
  statusEmoji: string;
} {
  const statusEmoji = balance.status === "We Owe Vendor" ? "🔴" : 
                      balance.status === "Advance Available" ? "🟢" : "⚪";

  return {
    payable: `Rs. ${balance.payable.toLocaleString()}`,
    advance: `Rs. ${balance.advance.toLocaleString()}`,
    netBalance: `Rs. ${Math.abs(balance.netBalance).toLocaleString()}`,
    status: balance.status,
    statusEmoji
  };
}
