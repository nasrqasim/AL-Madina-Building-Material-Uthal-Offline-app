import mongoose from "mongoose";
import Invoice from "@/models/Invoice";
import Item from "@/models/Item";
import Party from "@/models/Party";
import JournalEntry from "@/models/JournalEntry";

type PurchaseInput = {
  invoiceNo: string;
  partyId: string;
  lines: Array<{
    itemId: string;
    qty?: number;
    cartons?: number;
    rate?: number;
    ratePerCarton?: number;
    discountPercent?: number;
  }>;
};

export async function postPurchaseInvoice(input: PurchaseInput) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      let total = 0;
      const lines = input.lines.map((line) => {
        const qty = line.qty ?? line.cartons ?? 0;
        const rate = line.rate ?? line.ratePerCarton ?? 0;
        const grossAmount = qty * rate;
        const discountPercent = line.discountPercent ?? 0;
        const netAmount = grossAmount - (grossAmount * discountPercent) / 100;
        total += netAmount;
        return { ...line, qty, rate, grossAmount, discountPercent, netAmount };
      });

      for (const line of lines) {
        await Item.findByIdAndUpdate(line.itemId, { 
          $inc: { stockQtyCartons: line.qty }, 
          $set: { purchaseRate: line.rate } 
        }, { session });
      }
      await Party.findByIdAndUpdate(input.partyId, { $inc: { balance: total } }, { session });

      const invoice = await Invoice.create(
        [{ invoiceNo: input.invoiceNo, type: "purchase", partyId: input.partyId, lines, totalAmount: total, status: "posted" }],
        { session, ordered: true }
      );

      await JournalEntry.create(
        [
          { invoiceId: invoice[0]._id, accountCode: "1200", accountTitle: "Inventory", debit: total, credit: 0, remarks: "Purchase posted" },
          { invoiceId: invoice[0]._id, accountCode: "2100", accountTitle: "Accounts Payable", debit: 0, credit: total, remarks: "Purchase posted" },
        ],
        { session, ordered: true }
      );
      return invoice[0];
    });
  } finally {
    session.endSession();
  }
}

export async function postPurchaseReturn(input: { invoiceNo: string; partyId: string; linkedInvoiceId: string; lines: PurchaseInput["lines"] }) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      let total = 0;
      const lines = input.lines.map((line) => {
        const grossAmount = (line.cartons || 0) * (line.ratePerCarton || 0);
        const discountPercent = line.discountPercent ?? 0;
        const netAmount = grossAmount - (grossAmount * discountPercent) / 100;
        total += netAmount;
        return { ...line, grossAmount, discountPercent, netAmount };
      });

      for (const line of lines) {
        await Item.findByIdAndUpdate(line.itemId, { $inc: { stockQtyCartons: -(line.cartons || 0) } }, { session });
      }
      await Party.findByIdAndUpdate(input.partyId, { $inc: { balance: -total } }, { session });

      const invoice = await Invoice.create(
        [{ invoiceNo: input.invoiceNo, type: "purchase_return", partyId: input.partyId, linkedInvoiceId: input.linkedInvoiceId, lines, totalAmount: total, status: "posted" }],
        { session, ordered: true }
      );

      await JournalEntry.create(
        [
          { invoiceId: invoice[0]._id, accountCode: "2100", accountTitle: "Accounts Payable", debit: total, credit: 0, remarks: "Purchase return posted" },
          { invoiceId: invoice[0]._id, accountCode: "1200", accountTitle: "Inventory", debit: 0, credit: total, remarks: "Purchase return posted" },
        ],
        { session, ordered: true }
      );
      return invoice[0];
    });
  } finally {
    session.endSession();
  }
}
