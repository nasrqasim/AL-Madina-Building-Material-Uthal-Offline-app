import JournalEntry from "@/models/JournalEntry";
import Party from "@/models/Party";
import Invoice from "@/models/Invoice";
import CashPayment from "@/models/CashPayment";
import BankPayment from "@/models/BankPayment";
import CashReceipt from "@/models/CashReceipt";
import BankReceipt from "@/models/BankReceipt";
import Account from "@/models/Account";
import Bank from "@/models/Bank";

async function getOrCreateTaxAccount() {
  let acc = await Account.findOne({
    $or: [
      { code: "Tax on Purchased Items" },
      { code: "Tax on Purchased items" },
      { title: { $regex: /^tax on purchased items$/i } }
    ]
  });
  if (!acc) {
    acc = await Account.create({
      code: "Tax on Purchased Items",
      title: "Tax on Purchased Items",
      type: "expense",
      openingBalance: 0
    });
  }
  return acc;
}

export async function recalculatePartyBalance(partyId: string) {
  if (!partyId) return;

  const party = await Party.findById(partyId);
  if (!party) return;

  // Walk-in Customer Fix: always force balance, debit, and credit to 0
  if ((party.name || party.companyName || "").toLowerCase().includes("walk-in")) {
    await Party.findByIdAndUpdate(partyId, { debit: 0, credit: 0, balance: 0 });
    return;
  }

  const isCustomer = party.type === "Customer";
  const openingBalance = Number(party.openingBalance) || 0;

  let totalInvoices = 0;
  let totalReturns = 0;
  let totalReceiptsPayments = 0;
  let totalAdjustments = 0; // payments to customer or receipts from vendor

  // 1. Sum up all invoices for this party
  const invoices = await Invoice.find({ partyId, status: { $ne: "cancelled" } }).lean();
  for (const inv of invoices) {
    const total = Number(inv.totalAmount) || 0;
    const type = inv.type;
    if (type === "sale" || type === "non_tax_sale" || type === "pos" || type === "challan") {
      totalInvoices += total;
    } else if (type === "sale_return" || type === "non_tax_sale_return") {
      totalReturns += total;
    } else if (type === "purchase" || type === "non_tax_purchase" || type === "import_purchase") {
      totalInvoices += total;
    } else if (type === "purchase_return" || type === "non_tax_purchase_return") {
      totalReturns += total;
    }
  }

  // 2. Sum up all receipts / payments for this party
  if (isCustomer) {
    const cashReceipts = await CashReceipt.find({ partyId, status: { $ne: "Cancelled" } }).lean();
    const bankReceipts = await BankReceipt.find({
      $or: [{ party: partyId }, { party: String(partyId) }],
      status: { $ne: "Cancelled" },
    }).lean();

    const cashSum = cashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const bankSum = bankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Compute total received at creation time for invoices (which does not have a CashReceipt/BankReceipt document)
    let totalReceivedAtCreation = 0;
    for (const inv of invoices) {
      if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
        const invNo = inv.invoiceNo;
        const linkedCashAmt = cashReceipts
          .filter((r: any) => r.reference === invNo || (r.narration && r.narration.toLowerCase().includes(invNo.toLowerCase())))
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const linkedBankAmt = bankReceipts
          .filter((r: any) => r.instrumentNo === invNo || (r.instrumentNo && r.instrumentNo.toLowerCase().includes(invNo.toLowerCase())))
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

        const paidAtCreation = Math.max(0, (Number(inv.amountReceived) || 0) - (linkedCashAmt + linkedBankAmt));
        totalReceivedAtCreation += paidAtCreation;
      }
    }

    totalReceiptsPayments = cashSum + bankSum + totalReceivedAtCreation;

    // Payments to Customer (Debit adjustments, e.g. CPV-00010)
    const cashPayments = await CashPayment.find({
      $or: [{ partyId }, { vendor: partyId }],
      status: { $ne: "Cancelled" },
    }).lean();
    const bankPayments = await BankPayment.find({ vendor: partyId, status: { $ne: "Cancelled" } }).lean();
    
    totalAdjustments = cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                       bankPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  } else {
    const cashPayments = await CashPayment.find({
      $or: [{ partyId }, { vendor: partyId }],
      status: { $ne: "Cancelled" },
    }).lean();
    const bankPayments = await BankPayment.find({ vendor: partyId, status: { $ne: "Cancelled" } }).lean();
    
    const cashSum = cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const bankSum = bankPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Compute total paid at creation time for invoices (which does not have a CashPayment/BankPayment document)
    let totalPaidAtCreation = 0;
    for (const inv of invoices) {
      if (["purchase", "non_tax_purchase", "import_purchase"].includes(inv.type)) {
        const invNo = inv.invoiceNo;
        const linkedCashAmt = cashPayments
          .filter((p: any) => p.reference === invNo || (p.narration && p.narration.toLowerCase().includes(invNo.toLowerCase())))
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const linkedBankAmt = bankPayments
          .filter((p: any) => p.instrumentNo === invNo || (p.instrumentNo && p.instrumentNo.toLowerCase().includes(invNo.toLowerCase())))
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const paidAtCreation = Math.max(0, (Number(inv.amountReceived) || 0) - (linkedCashAmt + linkedBankAmt));
        totalPaidAtCreation += paidAtCreation;
      }
    }

    totalReceiptsPayments = cashSum + bankSum + totalPaidAtCreation;

    // Receipts from Vendor (Credit adjustments)
    const cashReceipts = await CashReceipt.find({ partyId, status: { $ne: "Cancelled" } }).lean();
    const bankReceipts = await BankReceipt.find({
      $or: [{ party: partyId }, { party: String(partyId) }],
      status: { $ne: "Cancelled" },
    }).lean();
    
    totalAdjustments = cashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) +
                       bankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  let debit = 0;
  let credit = 0;
  let balance = 0;

  if (isCustomer) {
    // Debit side = period sales + period payments to customer
    debit = totalInvoices + totalAdjustments;
    // Credit side = period returns + period receipts from customer
    credit = totalReturns + totalReceiptsPayments;
    // Closing balance = opening balance (natural Debit) + debits - credits
    balance = openingBalance + debit - credit;
  } else {
    // Credit side = period purchases + period receipts from vendor
    credit = totalInvoices + totalAdjustments;
    // Debit side = period returns + period payments to vendor
    debit = totalReturns + totalReceiptsPayments;
    // Closing balance = opening balance (natural Credit) + credits - debits
    balance = openingBalance + credit - debit;
  }

  await Party.findByIdAndUpdate(partyId, { debit, credit, balance });
}

export async function generateInvoiceJournalEntries(invoice: any) {
  await JournalEntry.deleteMany({ invoiceId: invoice._id });

  const total = Number(invoice.totalAmount) || 0;
  if (total <= 0) {
    if (invoice.partyId) {
      await recalculatePartyBalance(invoice.partyId.toString());
    }
    return;
  }

  const voucherNo = invoice.invoiceNo || `INV-${invoice._id}`;
  const date = invoice.date || invoice.createdAt || new Date();
  const paymentMethod = invoice.paymentMethod || invoice.paymentTerms || "Credit";

  // Check if customer is Walk-in Cash Customer
  let isWalkIn = false;
  if (invoice.partyId) {
    const party = await Party.findById(invoice.partyId).lean() as any;
    if (party && (party.name || party.companyName || "").toLowerCase().includes("walk-in")) {
      isWalkIn = true;
    }
  }

  const isCash = paymentMethod === "Cash" || paymentMethod === "Card" || isWalkIn;
  const isBank = paymentMethod === "Bank" || paymentMethod === "Online";

  // Determine Asset / Balance Sheet Accounts
  const assetCode = (isCash || isWalkIn) ? (isBank ? "1110" : "1111") : "1100";
  const assetTitle = (isCash || isWalkIn) ? (isBank ? "Bank" : "Cash") : "Accounts Receivable";

  const liabilityCode = isCash ? "1111" : isBank ? "1110" : "2100";
  const liabilityTitle = isCash ? "Cash" : isBank ? "Bank" : "Accounts Payable";

  if (invoice.type === "sale" || invoice.type === "pos" || invoice.type === "non_tax_sale") {
    const entries = [
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: total,
        credit: 0,
        remarks: `${invoice.type === "non_tax_sale" ? "Non-Tax " : ""}Sales invoice posted (${paymentMethod})`,
        partyId: invoice.partyId || null
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "4100",
        accountTitle: "Sales",
        debit: 0,
        credit: total,
        remarks: `${invoice.type === "non_tax_sale" ? "Non-Tax " : ""}Sales invoice posted (${paymentMethod})`,
        partyId: invoice.partyId || null
      }
    ];

    if (assetCode === "1100" && invoice.amountReceived > 0) {
      const recvMethod = invoice.paymentMethod === "Bank" ? "1110" : "1111";
      const recvTitle = invoice.paymentMethod === "Bank" ? "Bank" : "Cash";
      entries.push({
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: recvMethod,
        accountTitle: recvTitle,
        debit: invoice.amountReceived,
        credit: 0,
        remarks: `Down payment received at sale`,
        partyId: null
      });
      entries.push({
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "1100",
        accountTitle: "Accounts Receivable",
        debit: 0,
        credit: invoice.amountReceived,
        remarks: `Down payment received at sale`,
        partyId: invoice.partyId || null
      });
    }

    await JournalEntry.create(entries);
  } else if (invoice.type === "sale_return" || invoice.type === "non_tax_sale_return") {
    await JournalEntry.create([
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "4101",
        accountTitle: "Sales Return",
        debit: total,
        credit: 0,
        remarks: `${invoice.type === "non_tax_sale_return" ? "Non-Tax " : ""}Sales return posted`,
        partyId: invoice.partyId || null
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: 0,
        credit: total,
        remarks: `${invoice.type === "non_tax_sale_return" ? "Non-Tax " : ""}Sales return posted`,
        partyId: invoice.partyId || null
      }
    ]);
  } else if (invoice.type === "purchase" || invoice.type === "non_tax_purchase") {
    const taxAmount = Number(invoice.taxAmount) || 0;
    const subTotal = Number(invoice.subTotal) || 0;
    const discountAmount = Number(invoice.discountAmount) || 0;
    const purchasesAmt = subTotal - discountAmount;

    const entries = [];

    // 1. Debit Purchases
    entries.push({
      invoiceId: invoice._id,
      voucherNo,
      date,
      accountCode: "5100",
      accountTitle: "Purchases",
      debit: purchasesAmt,
      credit: 0,
      remarks: `${invoice.type === "non_tax_purchase" ? "Non-Tax " : ""}Purchase invoice posted (${paymentMethod})`,
      partyId: invoice.partyId || null
    });

    // 2. Debit Tax Account (if tax exists)
    if (taxAmount > 0) {
      const taxAcc = await getOrCreateTaxAccount();
      let vendorName = "";
      if (invoice.partyId) {
        const party = await Party.findById(invoice.partyId).lean();
        if (party) {
          vendorName = (party as any).companyName || (party as any).name || "";
        }
      }
      entries.push({
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: taxAcc.code,
        accountTitle: taxAcc.title,
        debit: taxAmount,
        credit: 0,
        remarks: `Purchase Tax - ${vendorName}`.trim(),
        partyId: invoice.partyId || null
      });
    }

    // 3. Credit Liability/Cash/Bank
    entries.push({
      invoiceId: invoice._id,
      voucherNo,
      date,
      accountCode: liabilityCode,
      accountTitle: liabilityTitle,
      debit: 0,
      credit: total,
      remarks: `${invoice.type === "non_tax_purchase" ? "Non-Tax " : ""}Purchase invoice posted (${paymentMethod})`,
      partyId: invoice.partyId || null
    });

    await JournalEntry.create(entries);
  } else if (invoice.type === "purchase_return" || invoice.type === "non_tax_purchase_return") {
    await JournalEntry.create([
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: liabilityCode,
        accountTitle: liabilityTitle,
        debit: total,
        credit: 0,
        remarks: `${invoice.type === "non_tax_purchase_return" ? "Non-Tax " : ""}Purchase return posted`,
        partyId: invoice.partyId || null
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "5101",
        accountTitle: "Purchase Return",
        debit: 0,
        credit: total,
        remarks: `${invoice.type === "non_tax_purchase_return" ? "Non-Tax " : ""}Purchase return posted`,
        partyId: invoice.partyId || null
      }
    ]);
  }

  if (invoice.partyId) {
    await recalculatePartyBalance(invoice.partyId.toString());
  }
}

export async function postCashReceiptJournalEntries(receipt: any) {
  await JournalEntry.deleteMany({ voucherNo: receipt.receiptNumber });

  if (receipt.status !== "Posted") return;

  const entries = [];
  const date = receipt.date ? new Date(receipt.date) : new Date();
  
  let cashCode = "1111";
  let cashTitle = "Cash Hand";
  if (receipt.cashAccountId) {
    const acc = await Account.findById(receipt.cashAccountId).lean();
    if (acc) {
      cashCode = (acc as any).code || cashCode;
      cashTitle = (acc as any).title || cashTitle;
    }
  }

  const receiptType = receipt.receiptType || "party";
  const amount = Number(receipt.amount) || 0;
  const remarks = receipt.narration || receipt.notes || "Cash Receipt";

  if (receiptType === "party" && receipt.partyId) {
    const party = await Party.findById(receipt.partyId).lean() as any;
    const isCustomer = party ? party.type === "Customer" : true;
    const accountCode = isCustomer ? "1100" : "2100";
    const accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";
    const partyType = isCustomer ? "customer" : "vendor";

    entries.push({
      date,
      voucherNo: receipt.receiptNumber,
      accountCode: cashCode,
      accountTitle: cashTitle,
      debit: amount,
      credit: 0,
      remarks,
      partyId: null,
      partyType: ""
    });
    entries.push({
      date,
      voucherNo: receipt.receiptNumber,
      accountCode,
      accountTitle,
      debit: 0,
      credit: amount,
      remarks,
      partyId: receipt.partyId,
      partyType
    });
  } else if (receiptType === "petty" && Array.isArray(receipt.contraLines)) {
    entries.push({
      date,
      voucherNo: receipt.receiptNumber,
      accountCode: cashCode,
      accountTitle: cashTitle,
      debit: amount,
      credit: 0,
      remarks,
      partyId: null,
      partyType: ""
    });
    for (const line of receipt.contraLines) {
      let code = "40002001";
      let title = "Other Income";
      if (line.accountId) {
        const acc = await Account.findById(line.accountId).lean();
        if (acc) {
          code = (acc as any).code || code;
          title = (acc as any).title || title;
        }
      }
      entries.push({
        date,
        voucherNo: receipt.receiptNumber,
        accountCode: code,
        accountTitle: title,
        debit: 0,
        credit: Number(line.amount) || 0,
        remarks: line.description || remarks,
        partyId: null,
        partyType: ""
      });
    }
  } else if (receiptType === "multi" && Array.isArray(receipt.partyLines)) {
    entries.push({
      date,
      voucherNo: receipt.receiptNumber,
      accountCode: cashCode,
      accountTitle: cashTitle,
      debit: amount,
      credit: 0,
      remarks,
      partyId: null,
      partyType: ""
    });
    for (const line of receipt.partyLines) {
      const party = await Party.findById(line.partyId).lean() as any;
      const isCustomer = party ? party.type === "Customer" : true;
      const accountCode = isCustomer ? "1100" : "2100";
      const accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";
      const partyType = isCustomer ? "customer" : "vendor";

      entries.push({
        date,
        voucherNo: receipt.receiptNumber,
        accountCode,
        accountTitle,
        debit: 0,
        credit: Number(line.amount) || 0,
        remarks,
        partyId: line.partyId || null,
        partyType
      });
    }
  }

  if (entries.length > 0) {
    await JournalEntry.create(entries);
  }
}

export async function postCashPaymentJournalEntries(payment: any) {
  await JournalEntry.deleteMany({ voucherNo: payment.voucherNo });

  if (payment.status !== "Posted") return;

  const entries = [];
  const date = payment.date ? new Date(payment.date) : new Date();

  let cashCode = "1111";
  let cashTitle = "Cash Hand";
  if (payment.cashAccountId) {
    const acc = await Account.findById(payment.cashAccountId).lean();
    if (acc) {
      cashCode = (acc as any).code || cashCode;
      cashTitle = (acc as any).title || cashTitle;
    }
  }

  const paymentType = payment.paymentType || "party";
  const amount = Number(payment.amount) || 0;
  const remarks = payment.narration || payment.notes || "Cash Payment";

  if (paymentType === "party" && payment.partyId) {
    const party = await Party.findById(payment.partyId).lean() as any;
    const isCustomer = party ? party.type === "Customer" : false;
    const accountCode = isCustomer ? "1100" : "2100";
    const accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";
    const partyType = isCustomer ? "customer" : "vendor";

    entries.push({
      date,
      voucherNo: payment.voucherNo,
      accountCode,
      accountTitle,
      debit: amount,
      credit: 0,
      remarks,
      partyId: payment.partyId,
      partyType
    });
    entries.push({
      date,
      voucherNo: payment.voucherNo,
      accountCode: cashCode,
      accountTitle: cashTitle,
      debit: 0,
      credit: amount,
      remarks,
      partyId: null,
      partyType: ""
    });
  } else if (paymentType === "petty" && Array.isArray(payment.contraLines)) {
    entries.push({
      date,
      voucherNo: payment.voucherNo,
      accountCode: cashCode,
      accountTitle: cashTitle,
      debit: 0,
      credit: amount,
      remarks,
      partyId: null,
      partyType: ""
    });
    for (const line of payment.contraLines) {
      let code = "5100";
      let title = "Purchases";
      if (line.accountId) {
        const acc = await Account.findById(line.accountId).lean();
        if (acc) {
          code = (acc as any).code || code;
          title = (acc as any).title || title;
        }
      }
      entries.push({
        date,
        voucherNo: payment.voucherNo,
        accountCode: code,
        accountTitle: title,
        debit: Number(line.amount) || 0,
        credit: 0,
        remarks: line.description || remarks,
        partyId: null,
        partyType: ""
      });
    }
  }

  if (entries.length > 0) {
    await JournalEntry.create(entries);
  }
}

export async function postBankReceiptJournalEntries(receipt: any) {
  const vNo = receipt.receiptNumber || receipt.voucherNo;
  await JournalEntry.deleteMany({ voucherNo: vNo });

  if (receipt.status !== "Posted" && receipt.status !== "posted") return;

  const entries = [];
  const date = receipt.date ? new Date(receipt.date) : new Date();

  let bankCode = "1110";
  let bankTitle = "Bank";
  if (receipt.bankAccount) {
    const b = await Bank.findById(receipt.bankAccount).lean();
    if (b) {
      bankCode = (b as any).code || bankCode;
      bankTitle = (b as any).name || (b as any).title || bankTitle;
    }
  }

  const amount = Number(receipt.amount) || 0;
  const remarks = receipt.narration || receipt.notes || "Bank Receipt";
  const partyId = receipt.party || receipt.partyId;

  if (partyId) {
    const party = await Party.findById(partyId).lean() as any;
    const isCustomer = party ? party.type === "Customer" : true;
    const accountCode = isCustomer ? "1100" : "2100";
    const accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";
    const partyType = isCustomer ? "customer" : "vendor";

    entries.push({
      date,
      voucherNo: vNo,
      accountCode: bankCode,
      accountTitle: bankTitle,
      debit: amount,
      credit: 0,
      remarks,
      partyId: null,
      partyType: ""
    });
    entries.push({
      date,
      voucherNo: vNo,
      accountCode,
      accountTitle,
      debit: 0,
      credit: amount,
      remarks,
      partyId,
      partyType
    });
  }

  if (entries.length > 0) {
    await JournalEntry.create(entries);
  }
}

export async function postBankPaymentJournalEntries(payment: any) {
  await JournalEntry.deleteMany({ voucherNo: payment.voucherNo });

  if (payment.status !== "Posted" && payment.status !== "posted") return;

  const entries = [];
  const date = payment.date ? new Date(payment.date) : new Date();

  let bankCode = "1110";
  let bankTitle = "Bank";
  if (payment.bankAccount || payment.bankAccountId) {
    const b = await Bank.findById(payment.bankAccount || payment.bankAccountId).lean();
    if (b) {
      bankCode = (b as any).code || bankCode;
      bankTitle = (b as any).name || (b as any).title || bankTitle;
    }
  }

  const amount = Number(payment.amount) || 0;
  const remarks = payment.narration || payment.notes || "Bank Payment";
  const partyId = payment.vendor || payment.partyId;

  if (partyId) {
    const party = await Party.findById(partyId).lean() as any;
    const isCustomer = party ? party.type === "Customer" : false;
    const accountCode = isCustomer ? "1100" : "2100";
    const accountTitle = isCustomer ? "Accounts Receivable" : "Accounts Payable";
    const partyType = isCustomer ? "customer" : "vendor";

    entries.push({
      date,
      voucherNo: payment.voucherNo,
      accountCode,
      accountTitle,
      debit: amount,
      credit: 0,
      remarks,
      partyId,
      partyType
    });
    entries.push({
      date,
      voucherNo: payment.voucherNo,
      accountCode: bankCode,
      accountTitle: bankTitle,
      debit: 0,
      credit: amount,
      remarks,
      partyId: null,
      partyType: ""
    });
  }

  if (entries.length > 0) {
    await JournalEntry.create(entries);
  }
}
