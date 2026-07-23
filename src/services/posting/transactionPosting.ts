import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

type TransactionInput = {
  voucherNo: string;
  date: string;
  partyId?: string;
  accountId?: string; // For non-party payments/receipts
  bankId?: string;    // For bank transactions
  cashAccountId?: string; // For cash transactions
  amount: number;
  wht?: number;
  netAmount: number;
  narration?: string;
  reference?: string;
  partyPaymentType?: string;
  isRefund?: boolean;
};

export async function postCashPayment(input: TransactionInput) {
  // 1. Update Party Balance (if applicable)
  if (input.partyId) {
    const party = await offlineDB.parties.get(input.partyId) as any;
    if (party) {
      await offlineDB.parties.update(input.partyId, { 
        balance: (party.balance || 0) - input.amount,
        updatedAt: new Date().toISOString()
      });
    }
  }

  // 2. Create Payment Record
  const paymentId = generateUniqueId();
  const payment = {
    id: paymentId,
    voucherNo: input.voucherNo,
    date: input.date,
    vendor: input.partyId,
    amount: input.amount,
    wht: input.wht || 0,
    netPaid: input.netAmount,
    status: "Posted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await offlineDB.cashPayments.add(payment as any);

  // 3. Journal Entries
  // Debit: Party/Account (reducing liability or increasing expense)
  // Credit: Cash
  await offlineDB.journalEntries.bulkAdd([
    { 
      id: generateUniqueId(),
      voucherNo: input.voucherNo, 
      accountCode: "2100", // Accounts Payable
      accountTitle: "Accounts Payable", 
      debit: input.amount, 
      credit: 0, 
      remarks: input.narration || "Cash Payment",
      createdAt: new Date().toISOString()
    },
    { 
      id: generateUniqueId(),
      voucherNo: input.voucherNo, 
      accountCode: "1111", // Cash
      accountTitle: "Cash", 
      debit: 0, 
      credit: input.netAmount, 
      remarks: input.narration || "Cash Payment",
      createdAt: new Date().toISOString()
    }
  ] as any);

  if (input.wht && input.wht > 0) {
    await offlineDB.journalEntries.add({
      id: generateUniqueId(),
      voucherNo: input.voucherNo,
      accountCode: "2200", // WHT Payable
      accountTitle: "WHT Payable",
      debit: 0,
      credit: input.wht,
      remarks: "WHT on Payment",
      createdAt: new Date().toISOString()
    } as any);
  }

  return payment;
}

export async function postCashReceipt(input: TransactionInput) {
  if (input.partyId) {
    const party = await offlineDB.parties.get(input.partyId) as any;
    if (party) {
      await offlineDB.parties.update(input.partyId, { 
        balance: (party.balance || 0) - input.amount,
        updatedAt: new Date().toISOString()
      });
    }
  }

  const receiptId = generateUniqueId();
  const receipt = {
    id: receiptId,
    receiptNumber: input.voucherNo,
    date: input.date,
    party: input.partyId,
    amount: input.amount,
    netAmount: input.amount,
    status: "Posted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await offlineDB.cashReceipts.add(receipt as any);

  await offlineDB.journalEntries.bulkAdd([
    { 
      id: generateUniqueId(),
      voucherNo: input.voucherNo, 
      accountCode: "1111", // Cash
      accountTitle: "Cash", 
      debit: input.amount, 
      credit: 0, 
      remarks: input.narration || "Cash Receipt",
      createdAt: new Date().toISOString()
    },
    { 
      id: generateUniqueId(),
      voucherNo: input.voucherNo, 
      accountCode: "1100", // Accounts Receivable
      accountTitle: "Accounts Receivable", 
      debit: 0, 
      credit: input.amount, 
      remarks: input.narration || "Cash Receipt",
      createdAt: new Date().toISOString()
    }
  ] as any);

  return receipt;
}

export async function postBankPayment(input: TransactionInput) {
  // 1. Update Party Balance (if applicable)
  if (input.partyId) {
    const party = await offlineDB.parties.get(input.partyId) as any;
    if (party) {
      await offlineDB.parties.update(input.partyId, { 
        balance: (party.balance || 0) - input.amount,
        updatedAt: new Date().toISOString()
      });
    }
  }

  if (input.bankId) {
    const bank = await offlineDB.banks.get(input.bankId) as any;
    if (bank) {
      await offlineDB.banks.update(input.bankId, { 
        balance: (bank.balance || 0) - input.netAmount,
        updatedAt: new Date().toISOString()
      });
    }
  }

  const paymentId = generateUniqueId();
  const payment = {
    id: paymentId,
    voucherNo: input.voucherNo,
    date: input.date,
    vendor: input.partyId,
    amount: input.amount,
    wht: input.wht || 0,
    netPaid: input.netAmount,
    status: "Posted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await offlineDB.bankPayments.add(payment as any);

  await offlineDB.journalEntries.bulkAdd([
    { 
      id: generateUniqueId(),
      voucherNo: input.voucherNo, 
      accountCode: "2100", 
      accountTitle: "Accounts Payable", 
      debit: input.amount, 
      credit: 0, 
      remarks: input.narration || "Bank Payment",
      createdAt: new Date().toISOString()
    },
    { 
      id: generateUniqueId(),
      voucherNo: input.voucherNo, 
      accountCode: "1110", // Bank
      accountTitle: "Bank", 
      debit: 0, 
      credit: input.netAmount, 
      remarks: input.narration || "Bank Payment",
      createdAt: new Date().toISOString()
    }
  ] as any);

  return payment;
}

export async function postBankReceipt(input: TransactionInput) {
  if (input.partyId) {
    const party = await offlineDB.parties.get(input.partyId) as any;
    if (party) {
      await offlineDB.parties.update(input.partyId, { 
        balance: (party.balance || 0) - input.amount,
        updatedAt: new Date().toISOString()
      });
    }
  }

  if (input.bankId) {
    const bank = await offlineDB.banks.get(input.bankId) as any;
    if (bank) {
      await offlineDB.banks.update(input.bankId, { 
        balance: (bank.balance || 0) + input.amount,
        updatedAt: new Date().toISOString()
      });
    }
  }

  const receiptId = generateUniqueId();
  const receipt = {
    id: receiptId,
    receiptNumber: input.voucherNo,
    date: input.date,
    party: input.partyId,
    bankAccount: input.bankId,
    amount: input.amount,
    netAmount: input.amount,
    status: "Posted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await offlineDB.bankReceipts.add(receipt as any);

  await offlineDB.journalEntries.bulkAdd([
    { 
      id: generateUniqueId(),
      voucherNo: input.voucherNo, 
      accountCode: "1110", 
      accountTitle: "Bank", 
      debit: input.amount, 
      credit: 0, 
      remarks: input.narration || "Bank Receipt",
      createdAt: new Date().toISOString()
    },
    { 
      id: generateUniqueId(),
      voucherNo: input.voucherNo, 
      accountCode: "1100", 
      accountTitle: "Accounts Receivable", 
      debit: 0, 
      credit: input.amount, 
      remarks: input.narration || "Bank Receipt",
      createdAt: new Date().toISOString()
    }
  ] as any);

  return receipt;
}
