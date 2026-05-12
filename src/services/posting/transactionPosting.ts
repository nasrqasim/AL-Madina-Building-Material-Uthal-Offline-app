import mongoose from "mongoose";
import Party from "@/models/Party";
import Bank from "@/models/Bank";
import Account from "@/models/Account";
import JournalEntry from "@/models/JournalEntry";
import CashPayment from "@/models/CashPayment";
import BankPayment from "@/models/BankPayment";
import CashReceipt from "@/models/CashReceipt";
import BankReceipt from "@/models/BankReceipt";

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
};

export async function postCashPayment(input: TransactionInput) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // 1. Update Party Balance (if applicable)
      if (input.partyId) {
        await Party.findByIdAndUpdate(input.partyId, { $inc: { balance: -input.amount } }, { session });
      }

      // 2. Create Payment Record
      const payment = await CashPayment.create([
        {
          voucherNo: input.voucherNo,
          date: input.date,
          vendor: input.partyId, // Saving ID in vendor field for consistency if needed, though model says string
          amount: input.amount,
          wht: input.wht || 0,
          netPaid: input.netAmount,
          status: "Posted"
        }
      ], { session, ordered: true });

      // 3. Journal Entries
      // Debit: Party/Account (reducing liability or increasing expense)
      // Credit: Cash
      await JournalEntry.create([
        { 
          voucherNo: input.voucherNo, 
          accountCode: "2100", // Accounts Payable
          accountTitle: "Accounts Payable", 
          debit: input.amount, 
          credit: 0, 
          remarks: input.narration || "Cash Payment" 
        },
        { 
          voucherNo: input.voucherNo, 
          accountCode: "1111", // Cash
          accountTitle: "Cash", 
          debit: 0, 
          credit: input.netAmount, 
          remarks: input.narration || "Cash Payment" 
        }
      ], { session, ordered: true });

      if (input.wht && input.wht > 0) {
        await JournalEntry.create([{
          voucherNo: input.voucherNo,
          accountCode: "2200", // WHT Payable
          accountTitle: "WHT Payable",
          debit: 0,
          credit: input.wht,
          remarks: "WHT on Payment"
        }], { session, ordered: true });
      }

      return payment[0];
    });
  } catch (e) {
    console.error("Error in postCashPayment:", e);
    throw e;
  } finally {
    session.endSession();
  }
}

export async function postCashReceipt(input: TransactionInput) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      if (input.partyId) {
        await Party.findByIdAndUpdate(input.partyId, { $inc: { balance: -input.amount } }, { session });
      }

      const receipt = await CashReceipt.create([
        {
          receiptNumber: input.voucherNo,
          date: input.date,
          party: input.partyId, // The model says 'party' (string)
          amount: input.amount,
          netAmount: input.amount,
          status: "Posted"
        }
      ], { session, ordered: true });

      await JournalEntry.create([
        { 
          voucherNo: input.voucherNo, 
          accountCode: "1111", // Cash
          accountTitle: "Cash", 
          debit: input.amount, 
          credit: 0, 
          remarks: input.narration || "Cash Receipt" 
        },
        { 
          voucherNo: input.voucherNo, 
          accountCode: "1100", // Accounts Receivable
          accountTitle: "Accounts Receivable", 
          debit: 0, 
          credit: input.amount, 
          remarks: input.narration || "Cash Receipt" 
        }
      ], { session, ordered: true });

      return receipt[0];
    });
  } catch (e) {
    console.error("Error in postCashReceipt:", e);
    throw e;
  } finally {
    session.endSession();
  }
}

export async function postBankPayment(input: TransactionInput) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      if (input.partyId) {
        await Party.findByIdAndUpdate(input.partyId, { $inc: { balance: -input.amount } }, { session });
      }

      if (input.bankId) {
        await Bank.findByIdAndUpdate(input.bankId, { $inc: { balance: -input.netAmount } }, { session });
      }

      const payment = await BankPayment.create([
        {
          voucherNo: input.voucherNo,
          date: input.date,
          vendor: input.partyId,
          amount: input.amount,
          wht: input.wht || 0,
          netPaid: input.netAmount,
          status: "Posted"
        }
      ], { session, ordered: true });

      await JournalEntry.create([
        { 
          voucherNo: input.voucherNo, 
          accountCode: "2100", 
          accountTitle: "Accounts Payable", 
          debit: input.amount, 
          credit: 0, 
          remarks: input.narration || "Bank Payment" 
        },
        { 
          voucherNo: input.voucherNo, 
          accountCode: "1110", // Bank
          accountTitle: "Bank", 
          debit: 0, 
          credit: input.netAmount, 
          remarks: input.narration || "Bank Payment" 
        }
      ], { session, ordered: true });

      return payment[0];
    });
  } catch (e) {
    console.error("Error in postBankPayment:", e);
    throw e;
  } finally {
    session.endSession();
  }
}

export async function postBankReceipt(input: TransactionInput) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      if (input.partyId) {
        await Party.findByIdAndUpdate(input.partyId, { $inc: { balance: -input.amount } }, { session });
      }

      if (input.bankId) {
        await Bank.findByIdAndUpdate(input.bankId, { $inc: { balance: input.amount } }, { session });
      }

      const receipt = await BankReceipt.create([
        {
          receiptNumber: input.voucherNo,
          date: input.date,
          party: input.partyId, // The model says 'party' (string)
          bankAccount: input.bankId,
          amount: input.amount,
          netAmount: input.amount,
          status: "Posted"
        }
      ], { session, ordered: true });

      await JournalEntry.create([
        { 
          voucherNo: input.voucherNo, 
          accountCode: "1110", 
          accountTitle: "Bank", 
          debit: input.amount, 
          credit: 0, 
          remarks: input.narration || "Bank Receipt" 
        },
        { 
          voucherNo: input.voucherNo, 
          accountCode: "1100", 
          accountTitle: "Accounts Receivable", 
          debit: 0, 
          credit: input.amount, 
          remarks: input.narration || "Bank Receipt" 
        }
      ], { session, ordered: true });

      return receipt[0];
    });
  } catch (e) {
    console.error("Error in postBankReceipt:", e);
    throw e;
  } finally {
    session.endSession();
  }
}
