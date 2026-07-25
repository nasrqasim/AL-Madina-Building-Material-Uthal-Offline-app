import { offlineDB, generateUniqueId } from "../dexie";
import {
  InvoiceRecord,
  PartyRecord,
  JournalEntryRecord,
  ItemRecord,
  CashReceiptRecord,
  CashPaymentRecord,
  BankReceiptRecord,
  BankPaymentRecord,
} from "./types";
import { calculateCustomerBalance, calculateBalanceFromTransactions } from "../customerBalance";
import { calculateVendorBalance, calculateVendorBalanceFromTransactions } from "../vendorBalance";

/** Create/Update Journal Entry for Party Opening Balance */
export async function postPartyOpeningBalanceJournalEntry(party: any) {
  if (!party) return;
  const partyId = party.id || party._id;
  if (!partyId) return;
  const voucherNo = `OPBAL-${party.code || partyId}`;

  // Clear existing opening balance journal entries for this party
  const oldEntries = await offlineDB.journalEntries
    .where("voucherNo")
    .equals(voucherNo)
    .toArray();
  for (const entry of oldEntries) {
    if (entry.id) await offlineDB.journalEntries.delete(entry.id);
  }

  const opBal = Number(party.openingBalance) || 0;
  if (opBal === 0) return;

  const isCustomer = party.type === "Customer";
  const date = party.createdAt || new Date().toISOString();
  const entries: JournalEntryRecord[] = [];

  if (isCustomer) {
    if (opBal < 0) {
      // Customer Advance Opening Balance: Customer Advance Liability increases, contra to Equity (NOT Cash)
      const advAmt = Math.abs(opBal);
      entries.push({
        id: generateUniqueId(),
        voucherNo,
        date,
        accountCode: "3000",
        accountTitle: "Opening Balance Equity",
        debit: advAmt,
        credit: 0,
        remarks: `Opening Advance Balance for ${party.name || party.companyName}`,
        partyId,
        partyType: "customer",
        createdAt: date,
        updatedAt: date,
      });
      entries.push({
        id: generateUniqueId(),
        voucherNo,
        date,
        accountCode: "2120",
        accountTitle: "Customer Advance Liability",
        debit: 0,
        credit: advAmt,
        remarks: `Opening Advance Balance for ${party.name || party.companyName}`,
        partyId,
        partyType: "customer",
        createdAt: date,
        updatedAt: date,
      });
    } else {
      // Customer Receivable Opening Balance
      entries.push({
        id: generateUniqueId(),
        voucherNo,
        date,
        accountCode: "1100",
        accountTitle: "Accounts Receivable",
        debit: opBal,
        credit: 0,
        remarks: `Opening Receivable Balance for ${party.name || party.companyName}`,
        partyId,
        partyType: "customer",
        createdAt: date,
        updatedAt: date,
      });
      entries.push({
        id: generateUniqueId(),
        voucherNo,
        date,
        accountCode: "3000",
        accountTitle: "Opening Balance Equity",
        debit: 0,
        credit: opBal,
        remarks: `Opening Receivable Balance for ${party.name || party.companyName}`,
        partyId,
        partyType: "customer",
        createdAt: date,
        updatedAt: date,
      });
    }
  } else {
    // Vendor
    if (opBal > 0) {
      // Vendor Advance (we paid vendor advance) — use equity, NOT cash
      // Cash already moved before system started; this is just an opening balance
      entries.push({
        id: generateUniqueId(),
        voucherNo,
        date,
        accountCode: "1200",
        accountTitle: "Vendor Advance Asset",
        debit: opBal,
        credit: 0,
        remarks: `Opening Advance Balance to ${party.name || party.companyName}`,
        partyId,
        partyType: "vendor",
        createdAt: date,
        updatedAt: date,
      });
      entries.push({
        id: generateUniqueId(),
        voucherNo,
        date,
        accountCode: "3000",
        accountTitle: "Opening Balance Equity",
        debit: 0,
        credit: opBal,
        remarks: `Opening Advance Balance to ${party.name || party.companyName}`,
        partyId,
        partyType: "vendor",
        createdAt: date,
        updatedAt: date,
      });
    } else if (opBal < 0) {
      // Vendor Payable — use equity, NOT cash
      const payAmt = Math.abs(opBal);
      entries.push({
        id: generateUniqueId(),
        voucherNo,
        date,
        accountCode: "3000",
        accountTitle: "Opening Balance Equity",
        debit: payAmt,
        credit: 0,
        remarks: `Opening Payable Balance to ${party.name || party.companyName}`,
        partyId,
        partyType: "vendor",
        createdAt: date,
        updatedAt: date,
      });
      entries.push({
        id: generateUniqueId(),
        voucherNo,
        date,
        accountCode: "2100",
        accountTitle: "Accounts Payable",
        debit: 0,
        credit: payAmt,
        remarks: `Opening Payable Balance to ${party.name || party.companyName}`,
        partyId,
        partyType: "vendor",
        createdAt: date,
        updatedAt: date,
      });
    }
  }

  if (entries.length > 0) {
    await offlineDB.journalEntries.bulkAdd(entries);
  }
}

/** Recalculate a Customer or Vendor's running balance, total purchases/sales, and total payments. */
export async function recalculatePartyBalance(partyId: string) {
  if (!partyId) return;

  const party = await offlineDB.parties.get(partyId);
  if (!party) return;

  // Sync Opening Balance Journal Entry
  await postPartyOpeningBalanceJournalEntry(party);

  // Walk-in Customer Fix: always force balance to 0
  if ((party.name || party.companyName || "").toLowerCase().includes("walk-in")) {
    await offlineDB.parties.update(partyId, { debit: 0, credit: 0, balance: 0 });
    return;
  }

  const isCustomer = party.type === "Customer";
  const openingBalance = Number(party.openingBalance) || 0;

  let totalInvoices = 0;
  let totalReturns = 0;
  let totalReceiptsPayments = 0;
  let totalAdjustments = 0;

  // 1. Sum up all invoices for this party
  const invoices = await offlineDB.invoices
    .where("partyId")
    .equals(partyId)
    .toArray();

  const activeInvoices = invoices.filter((inv) => inv.status !== "cancelled");

  for (const inv of activeInvoices) {
    const total = Number(inv.totalAmount) || 0;
    const type = inv.type;
    if (["sale", "non_tax_sale", "pos", "challan"].includes(type)) {
      totalInvoices += total;
    } else if (["sale_return", "non_tax_sale_return"].includes(type)) {
      totalReturns += total;
    } else if (["purchase", "non_tax_purchase", "import_purchase"].includes(type)) {
      totalInvoices += total;
    } else if (["purchase_return", "non_tax_purchase_return"].includes(type)) {
      totalReturns += total;
    }
  }

  // 2. Sum up all receipts / payments for this party
  if (isCustomer) {
    // Receipts from customer
    const cashReceipts = await offlineDB.cashReceipts
      .where("partyId")
      .equals(partyId)
      .toArray();
    const bankReceipts = await offlineDB.bankReceipts
      .toArray(); // bank receipts schema filters by party name or id in-memory
    const filteredBankReceipts = bankReceipts.filter(
      (r) => r.status !== "Cancelled" && String(r.party) === String(partyId)
    );

    const cashSum = cashReceipts
      .filter((r) => r.status !== "Cancelled")
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const bankSum = filteredBankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Paid-at-creation invoices (without CashReceipt documents)
    let totalReceivedAtCreation = 0;
    for (const inv of activeInvoices) {
      if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
        const invNo = inv.invoiceNo;
        const linkedCashAmt = cashReceipts
          .filter((r) => r.reference === invNo || (r.narration && r.narration.toLowerCase().includes(invNo.toLowerCase())))
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const linkedBankAmt = filteredBankReceipts
          .filter((r) => r.instrumentNo === invNo || (r.narration && r.narration.toLowerCase().includes(invNo.toLowerCase())))
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

        // For cash sales, include amountReceived even if not linked to receipts
        const amountReceived = Number(inv.amountReceived) || 0;
        const isCashSale = inv.paymentMethod === "Cash" || inv.paymentMethod === "Card";
        
        if (isCashSale && amountReceived > 0) {
          // For cash sales, count the full amountReceived as payment
          const paidAtCreation = Math.max(0, amountReceived - (linkedCashAmt + linkedBankAmt));
          totalReceivedAtCreation += paidAtCreation;
        } else {
          // For credit sales with down payments, only count unlinked portion
          const paidAtCreation = Math.max(0, amountReceived - (linkedCashAmt + linkedBankAmt));
          totalReceivedAtCreation += paidAtCreation;
        }
      }
    }

    totalReceiptsPayments = cashSum + bankSum + totalReceivedAtCreation;

    // Payments to customer (Refunds / adjustments)
    const cashPayments = await offlineDB.cashPayments.toArray();
    const filteredCashPayments = cashPayments.filter(
      (p) => p.status !== "Cancelled" && (String(p.partyId) === String(partyId) || String(p.vendor) === String(partyId))
    );
    const bankPayments = await offlineDB.bankPayments.toArray();
    const filteredBankPayments = bankPayments.filter(
      (p) => p.status !== "Cancelled" && String(p.vendor) === String(partyId)
    );

    totalAdjustments = filteredCashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                       filteredBankPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  } else {
    // Payments to vendor
    const cashPayments = await offlineDB.cashPayments.toArray();
    const filteredCashPayments = cashPayments.filter(
      (p) => p.status !== "Cancelled" && (String(p.partyId) === String(partyId) || String(p.vendor) === String(partyId))
    );
    const bankPayments = await offlineDB.bankPayments.toArray();
    const filteredBankPayments = bankPayments.filter(
      (p) => p.status !== "Cancelled" && String(p.vendor) === String(partyId)
    );

    const cashSum = filteredCashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const bankSum = filteredBankPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Paid-at-creation purchases
    let totalPaidAtCreation = 0;
    for (const inv of activeInvoices) {
      if (["purchase", "non_tax_purchase", "import_purchase"].includes(inv.type)) {
        const invNo = inv.invoiceNo;
        const linkedCashAmt = filteredCashPayments
          .filter((p) => p.reference === invNo || (p.narration && p.narration.toLowerCase().includes(invNo.toLowerCase())))
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const linkedBankAmt = filteredBankPayments
          .filter((p) => p.instrumentNo === invNo || (p.narration && p.narration.toLowerCase().includes(invNo.toLowerCase())))
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const paidAtCreation = Math.max(0, (Number(inv.amountReceived) || 0) - (linkedCashAmt + linkedBankAmt));
        totalPaidAtCreation += paidAtCreation;
      }
    }

    totalReceiptsPayments = cashSum + bankSum + totalPaidAtCreation;

    // Receipts from Vendor (adjustments)
    const cashReceipts = await offlineDB.cashReceipts
      .where("partyId")
      .equals(partyId)
      .toArray();
    const bankReceipts = await offlineDB.bankReceipts
      .toArray();
    const filteredBankReceipts = bankReceipts.filter(
      (r) => r.status !== "Cancelled" && String(r.party) === String(partyId)
    );

    totalAdjustments = cashReceipts.filter(r => r.status !== "Cancelled").reduce((sum, r) => sum + (Number(r.amount) || 0), 0) +
                       filteredBankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  // Use unified balance calculation helpers for consistency
  let balanceResult;
  if (isCustomer) {
    balanceResult = await calculateCustomerBalance(party);
  } else {
    balanceResult = await calculateVendorBalance(party);
  }

  // Calculate advance stats (for customers only)
  let advanceBalance = 0;
  if (isCustomer) {
    const advStats = await getCustomerAdvanceStats(partyId);
    advanceBalance = advStats.remainingAdvance;
  } else {
    // For vendors, advance is calculated in balanceResult
    advanceBalance = balanceResult.advance;
  }

  const payableVal = !isCustomer && "payable" in balanceResult ? (balanceResult as any).payable : 0;
  const advanceVal = "advance" in balanceResult ? (balanceResult as any).advance : 0;

  await offlineDB.parties.update(partyId, {
    debit: isCustomer ? (party.manualDebit || 0) + totalInvoices + totalAdjustments : (party.manualDebit || 0) + totalReturns + totalReceiptsPayments,
    credit: isCustomer ? (party.manualCredit || 0) + totalReturns + totalReceiptsPayments : (party.manualCredit || 0) + totalInvoices + totalAdjustments,
    balance: balanceResult.netBalance,
    payable: payableVal,
    advanceBalance: advanceVal,
    totalPurchase: totalInvoices,
    totalPaid: totalReceiptsPayments,
    lastPurchaseDate: activeInvoices.length ? activeInvoices[activeInvoices.length - 1].date : undefined,
  });
}

/** Compute Customer's advance balance statistics. */
export async function getCustomerAdvanceStats(customerId: string) {
  const entries = await offlineDB.journalEntries
    .where("accountCode")
    .equals("2120")
    .toArray();

  const customerReceipts = await offlineDB.cashReceipts
    .where("partyId")
    .equals(customerId)
    .toArray();
  
  const activeReceipts = customerReceipts.filter(
    (r) => r.status !== "Cancelled" && ["Advance", "Deposit", "Extra Cash"].includes(r.partyReceiptType || "")
  );
  
  const receiptVouchers = new Set(activeReceipts.map((r) => r.receiptNumber));
  
  let totalAdvance = 0;
  let totalUsed = 0;
  let totalRefunded = 0;

  for (const entry of entries) {
    if (receiptVouchers.has(entry.voucherNo || "")) {
      totalAdvance += entry.credit || 0;
    }
    if (entry.debit > 0 && entry.partyId === customerId) {
      totalRefunded += entry.debit;
    }
  }

  // Invoice advance used
  const invoices = await offlineDB.invoices
    .where("partyId")
    .equals(customerId)
    .toArray();

  const activeInvoices = invoices.filter((inv) => inv.status !== "cancelled" && inv.useAdvance === true);
  totalUsed = activeInvoices.reduce((sum, inv) => sum + (Number(inv.advanceAmountUsed) || 0), 0);

  // Refund payments
  const cashPayments = await offlineDB.cashPayments.toArray();
  const bankPayments = await offlineDB.bankPayments.toArray();

  const cashRefunds = cashPayments.filter((p) => p.partyId === customerId && p.status === "Posted" && p.voucherNo.startsWith("CPV")); // refunds are marked Standard or custom
  const bankRefunds = bankPayments.filter((p) => p.vendor === customerId && p.status === "Posted");

  // Filter only explicit refund entries
  const totalCashRefund = cashRefunds.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalBankRefund = bankRefunds.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  totalRefunded += (totalCashRefund + totalBankRefund);

  const remainingAdvance = Math.max(0, totalAdvance - totalUsed - totalRefunded);

  return { totalAdvance, totalUsed, totalRefunded, remainingAdvance };
}

/** Generate Journal entries client-side for invoices. */
export async function generateInvoiceJournalEntries(invoice: InvoiceRecord) {
  // Clear old ones
  const oldEntries = await offlineDB.journalEntries
    .where("invoiceId")
    .equals(invoice.id)
    .toArray();
  
  for (const entry of oldEntries) {
    if (entry.id) await offlineDB.journalEntries.delete(entry.id);
  }

  const total = Number(invoice.totalAmount) || 0;
  if (total <= 0) {
    if (invoice.partyId) {
      await recalculatePartyBalance(invoice.partyId);
    }
    return;
  }

  const voucherNo = invoice.invoiceNo || `INV-${invoice.id}`;
  const date = invoice.date || new Date().toISOString();
  const paymentMethod = invoice.paymentMethod || invoice.paymentTerms || "Credit";

  let isWalkIn = false;
  if (invoice.partyId) {
    const party = await offlineDB.parties.get(invoice.partyId);
    if (party && (party.name || party.companyName || "").toLowerCase().includes("walk-in")) {
      isWalkIn = true;
    }
  }

  const isCash = paymentMethod === "Cash" || paymentMethod === "Card" || isWalkIn;
  const isBank = paymentMethod === "Bank" || paymentMethod === "Online";

  const assetCode = (isCash || isWalkIn) ? (isBank ? "1110" : "1111") : "1100";
  const assetTitle = (isCash || isWalkIn) ? (isBank ? "Bank Account" : "Cash Hand") : "Accounts Receivable";

  const liabilityCode = isCash ? "1111" : isBank ? "1110" : "2100";
  const liabilityTitle = isCash ? "Cash Hand" : isBank ? "Bank Account" : "Accounts Payable";

  const entries: JournalEntryRecord[] = [];

  const addEntry = (code: string, title: string, debit: number, credit: number, remarks: string, pId?: string | null) => {
    entries.push({
      id: generateUniqueId(),
      invoiceId: invoice.id,
      voucherNo,
      date,
      accountCode: code,
      accountTitle: title,
      debit,
      credit,
      remarks,
      partyId: pId || undefined,
      partyType: pId ? (invoice.type.includes("sale") ? "customer" : "vendor") : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  if (["sale", "pos", "non_tax_sale"].includes(invoice.type)) {
    const advUsed = invoice.useAdvance ? (Number(invoice.advanceAmountUsed) || 0) : 0;
    const cashOrRecPortion = Math.max(0, total - advUsed);

    // Customer Advance Usage: Debit 2120 Customer Advance Liability
    if (advUsed > 0) {
      addEntry("2120", "Customer Advance Liability", advUsed, 0, `Customer advance used against invoice`, invoice.partyId);
    }

    // Debit Receivable or Cash/Bank for remaining cash/credit portion only
    if (cashOrRecPortion > 0) {
      addEntry(assetCode, assetTitle, cashOrRecPortion, 0, `Sales invoice posted (${paymentMethod})`, invoice.partyId);
    }

    // Credit Sales Income by total amount
    addEntry("4100", "Sales", 0, total, `Sales invoice posted (${paymentMethod})`, invoice.partyId);

    // Handle down payment (amountReceived)
    if (assetCode === "1100" && (invoice.amountReceived || 0) > 0) {
      const recvMethod = invoice.paymentMethod === "Bank" ? "1110" : "1111";
      const recvTitle = invoice.paymentMethod === "Bank" ? "Bank Account" : "Cash Hand";
      addEntry(recvMethod, recvTitle, invoice.amountReceived || 0, 0, `Down payment received at sale`);
      addEntry("1100", "Accounts Receivable", 0, invoice.amountReceived || 0, `Down payment received at sale`, invoice.partyId);
    }
  } else if (["sale_return", "non_tax_sale_return"].includes(invoice.type)) {
    addEntry("4101", "Sales Return", total, 0, `Sales return posted`, invoice.partyId);
    if (invoice.useAdvance) {
      addEntry("2120", "Customer Advance Liability", 0, total, `Sales return refunded to Customer Advance`, invoice.partyId);
    } else {
      addEntry(assetCode, assetTitle, 0, total, `Sales return posted (${paymentMethod})`, invoice.partyId);
    }
  } else if (["purchase", "non_tax_purchase", "import_purchase"].includes(invoice.type)) {
    const taxAmount = Number(invoice.taxAmount) || 0;
    const subTotal = Number(invoice.subTotal) || 0;
    const discountAmount = Number(invoice.discountAmount) || 0;
    const purchasesAmt = subTotal - discountAmount;
    const advUsed = invoice.useAdvance ? (Number(invoice.advanceAmountUsed) || 0) : 0;
    const remainingLiability = Math.max(0, total - advUsed);

    // Debit Purchases
    addEntry("5100", "Purchases", purchasesAmt, 0, `Purchase invoice posted (${paymentMethod})`, invoice.partyId);
    
    // Debit Tax
    if (taxAmount > 0) {
      addEntry("Tax on Purchased Items", "Tax on Purchased Items", taxAmount, 0, `Purchase Tax`, invoice.partyId);
    }

    // Vendor Advance Usage: Credit 1200 Vendor Advance Asset
    if (advUsed > 0) {
      addEntry("1200", "Vendor Advance Asset", 0, advUsed, `Vendor advance used against purchase invoice`, invoice.partyId);
    }

    // For direct cash/bank purchases (not on credit), credit cash/bank directly
    if ((isCash || isBank) && !isWalkIn) {
      const cashBankCode = isBank ? "1110" : "1111";
      const cashBankTitle = isBank ? "Bank Account" : "Cash Hand";
      const amountPaid = Number(invoice.amountReceived) || Number((invoice as any).amountPaid) || 0;
      if (amountPaid > 0) {
        addEntry(cashBankCode, cashBankTitle, 0, amountPaid, `Direct cash/bank payment at purchase`);
      }
    } else {
      // Credit Accounts Payable for remaining liability (credit purchases)
      if (remainingLiability > 0) {
        addEntry(liabilityCode, liabilityTitle, 0, remainingLiability, `Purchase invoice posted (${paymentMethod})`, invoice.partyId);
      }

      // Down payment made for credit purchases
      if (liabilityCode === "2100" && (invoice.amountReceived || 0) > 0) {
        const payMethod = invoice.paymentMethod === "Bank" ? "1110" : "1111";
        const payTitle = invoice.paymentMethod === "Bank" ? "Bank Account" : "Cash Hand";
        addEntry("2100", "Accounts Payable", invoice.amountReceived || 0, 0, `Payment made at purchase`, invoice.partyId);
        addEntry(payMethod, payTitle, 0, invoice.amountReceived || 0, `Payment made at purchase`);
      }
    }
  } else if (["purchase_return", "non_tax_purchase_return"].includes(invoice.type)) {
    addEntry(liabilityCode, liabilityTitle, total, 0, `Purchase return posted`, invoice.partyId);
    addEntry("5101", "Purchase Return", 0, total, `Purchase return posted`, invoice.partyId);
  }

  if (entries.length > 0) {
    await offlineDB.journalEntries.bulkAdd(entries);
  }

  if (invoice.partyId) {
    await recalculatePartyBalance(invoice.partyId);
  }
}

/** Post Cash Receipt to Ledger. */
export async function postCashReceiptJournalEntries(receipt: CashReceiptRecord) {
  const oldEntries = await offlineDB.journalEntries
    .where("voucherNo")
    .equals(receipt.receiptNumber)
    .toArray();
  for (const entry of oldEntries) {
    if (entry.id) await offlineDB.journalEntries.delete(entry.id);
  }

  if (receipt.status !== "Posted") return;

  const entries: JournalEntryRecord[] = [];
  const date = receipt.date || new Date().toISOString();
  
  let cashCode = "1111";
  let cashTitle = "Cash Hand";
  if (receipt.cashAccountId) {
    const acc = await offlineDB.accounts.get(receipt.cashAccountId);
    if (acc) {
      cashCode = acc.code || cashCode;
      cashTitle = acc.title || cashTitle;
    }
  }

  const receiptType = receipt.receiptType || "party";
  const amount = Number(receipt.amount) || 0;
  const remarks = receipt.narration || receipt.notes || "Cash Receipt";

  const addEntry = (code: string, title: string, debit: number, credit: number, rId?: string | null) => {
    entries.push({
      id: generateUniqueId(),
      voucherNo: receipt.receiptNumber,
      date,
      accountCode: code,
      accountTitle: title,
      debit,
      credit,
      remarks,
      partyId: rId || undefined,
      partyType: rId ? "customer" : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  if (receipt.partyId) {
    const party = await offlineDB.parties.get(receipt.partyId);
    const isCustomer = party ? party.type === "Customer" : true;
    const isAdvance = ["Advance", "Deposit", "Extra Cash"].includes(receipt.partyReceiptType || "");

    let accountCode = isCustomer ? "1100" : "2100";
    let accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";

    if (isAdvance && isCustomer) {
      accountCode = "2120";
      accountTitle = "Customer Advance Liability";
    }

    // Debit Cash
    addEntry(cashCode, cashTitle, amount, 0);
    // Credit Party/Advance
    addEntry(accountCode, accountTitle, 0, amount, receipt.partyId);
  }

  if (entries.length > 0) {
    await offlineDB.journalEntries.bulkAdd(entries);
  }

  if (receipt.partyId) {
    await recalculatePartyBalance(receipt.partyId);
  }
}

/** Post Cash Payment to Ledger. */
export async function postCashPaymentJournalEntries(payment: CashPaymentRecord) {
  const oldEntries = await offlineDB.journalEntries
    .where("voucherNo")
    .equals(payment.voucherNo)
    .toArray();
  for (const entry of oldEntries) {
    if (entry.id) await offlineDB.journalEntries.delete(entry.id);
  }

  if (payment.status !== "Posted") return;

  const entries: JournalEntryRecord[] = [];
  const date = payment.date || new Date().toISOString();

  let cashCode = "1111";
  let cashTitle = "Cash Hand";
  if (payment.cashAccountId) {
    const acc = await offlineDB.accounts.get(payment.cashAccountId);
    if (acc) {
      cashCode = acc.code || cashCode;
      cashTitle = acc.title || cashTitle;
    }
  }

  const amount = Number(payment.amount) || 0;
  const remarks = payment.narration || payment.notes || "Cash Payment";

  const addEntry = (code: string, title: string, debit: number, credit: number, pId?: string | null) => {
    entries.push({
      id: generateUniqueId(),
      voucherNo: payment.voucherNo,
      date,
      accountCode: code,
      accountTitle: title,
      debit,
      credit,
      remarks,
      partyId: pId || undefined,
      partyType: pId ? "vendor" : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  // We support party payments
  if (payment.partyId) {
    const party = await offlineDB.parties.get(payment.partyId);
    const isCustomer = party ? party.type === "Customer" : false;
    const isAdvanceRefund = isCustomer && (payment.isRefund || payment.partyPaymentType === "Refund");

    let accountCode = isCustomer ? "1100" : "2100";
    let accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";

    if (isAdvanceRefund) {
      accountCode = "2120";
      accountTitle = "Customer Advance Liability";
    }

    // Debit Party
    addEntry(accountCode, accountTitle, amount, 0, payment.partyId);
    // Credit Cash
    addEntry(cashCode, cashTitle, 0, amount);
  }

  if (entries.length > 0) {
    await offlineDB.journalEntries.bulkAdd(entries);
  }

  if (payment.partyId) {
    await recalculatePartyBalance(payment.partyId);
  }
}

/** Post Bank Receipt to Ledger. */
export async function postBankReceiptJournalEntries(receipt: BankReceiptRecord) {
  const oldEntries = await offlineDB.journalEntries
    .where("voucherNo")
    .equals(receipt.receiptNumber)
    .toArray();
  for (const entry of oldEntries) {
    if (entry.id) await offlineDB.journalEntries.delete(entry.id);
  }

  if (receipt.status !== "Posted") return;

  const entries: JournalEntryRecord[] = [];
  const date = receipt.date || new Date().toISOString();

  let bankCode = "1110";
  let bankTitle = "Bank Account";
  if (receipt.bankId) {
    const b = await offlineDB.accounts.get(receipt.bankId);
    if (b) {
      bankCode = b.code || bankCode;
      bankTitle = b.title || bankTitle;
    }
  }

  const amount = Number(receipt.amount) || 0;
  const remarks = receipt.narration || "Bank Receipt";
  const partyId = receipt.partyId || receipt.party;

  const addEntry = (code: string, title: string, debit: number, credit: number, pId?: string | null) => {
    entries.push({
      id: generateUniqueId(),
      voucherNo: receipt.receiptNumber,
      date,
      accountCode: code,
      accountTitle: title,
      debit,
      credit,
      remarks,
      partyId: pId || undefined,
      partyType: pId ? "customer" : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  if (partyId) {
    const party = await offlineDB.parties.get(partyId);
    const isCustomer = party ? party.type === "Customer" : true;
    const accountCode = isCustomer ? "1100" : "2100";
    const accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";

    // Debit Bank
    addEntry(bankCode, bankTitle, amount, 0);
    // Credit Party
    addEntry(accountCode, accountTitle, 0, amount, partyId);
  }

  if (entries.length > 0) {
    await offlineDB.journalEntries.bulkAdd(entries);
  }

  if (partyId) {
    await recalculatePartyBalance(partyId);
  }
}

/** Post Bank Payment to Ledger. */
export async function postBankPaymentJournalEntries(payment: BankPaymentRecord) {
  const oldEntries = await offlineDB.journalEntries
    .where("voucherNo")
    .equals(payment.voucherNo)
    .toArray();
  for (const entry of oldEntries) {
    if (entry.id) await offlineDB.journalEntries.delete(entry.id);
  }

  if (payment.status !== "Posted") return;

  const entries: JournalEntryRecord[] = [];
  const date = payment.date || new Date().toISOString();

  let bankCode = "1110";
  let bankTitle = "Bank Account";
  if (payment.bankId) {
    const b = await offlineDB.accounts.get(payment.bankId);
    if (b) {
      bankCode = b.code || bankCode;
      bankTitle = b.title || bankTitle;
    }
  }

  const amount = Number(payment.amount) || 0;
  const remarks = payment.narration || "Bank Payment";
  const partyId = payment.vendor || payment.partyId;

  const addEntry = (code: string, title: string, debit: number, credit: number, pId?: string | null) => {
    entries.push({
      id: generateUniqueId(),
      voucherNo: payment.voucherNo,
      date,
      accountCode: code,
      accountTitle: title,
      debit,
      credit,
      remarks,
      partyId: pId || undefined,
      partyType: pId ? "vendor" : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  if (partyId) {
    const party = await offlineDB.parties.get(partyId);
    const isCustomer = party ? party.type === "Customer" : false;
    const accountCode = isCustomer ? "1100" : "2100";
    const accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";

    // Debit Party
    addEntry(accountCode, accountTitle, amount, 0, partyId);
    // Credit Bank
    addEntry(bankCode, bankTitle, 0, amount);
  }

  if (entries.length > 0) {
    await offlineDB.journalEntries.bulkAdd(entries);
  }

  if (partyId) {
    await recalculatePartyBalance(partyId);
  }
}

/** Update product stock counts based on invoice items. */
export async function updateInventoryFromInvoice(invoice: InvoiceRecord, isDeletion: boolean = false) {
  // If it's a draft invoice, it should NOT affect stock permanently
  if (invoice.status === "draft" || invoice.type === "draft") return;

  const coefficient = isDeletion ? -1 : 1;

  for (const line of invoice.lines) {
    if (!line.itemId) continue;

    const item = await offlineDB.items.get(line.itemId);
    if (!item) continue;

    const qty = line.qty || 0;
    const cartons = line.cartons || 0;
    const qtyChange = cartons > 0 ? cartons : qty; // fall back to qty if cartons is 0

    let stockAdjustment = 0;

    if (["sale", "pos", "non_tax_sale"].includes(invoice.type)) {
      // Decrease stock
      stockAdjustment = -qtyChange * coefficient;
    } else if (["purchase", "non_tax_purchase", "import_purchase"].includes(invoice.type)) {
      // Increase stock
      stockAdjustment = qtyChange * coefficient;
    } else if (["sale_return", "non_tax_sale_return"].includes(invoice.type)) {
      // Increase stock
      stockAdjustment = qtyChange * coefficient;
    } else if (["purchase_return", "non_tax_purchase_return"].includes(invoice.type)) {
      // Decrease stock
      stockAdjustment = -qtyChange * coefficient;
    }

    if (stockAdjustment !== 0) {
      const currentStock = Number(item.stockQtyCartons) || 0;
      const currentPieces = Number(item.stockQty) || 0;
      await offlineDB.items.update(line.itemId, {
        stockQtyCartons: Math.max(0, currentStock + stockAdjustment),
        stockQty: Math.max(0, currentPieces + stockAdjustment), // For simple units
      });
    }
  }
}
