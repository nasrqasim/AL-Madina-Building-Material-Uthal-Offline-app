import mongoose from "mongoose";
import Invoice from "@/models/Invoice";
import Item from "@/models/Item";
import Party from "@/models/Party";
import JournalEntry from "@/models/JournalEntry";
import VehicleLog from "@/models/VehicleLog";

type SalesInput = {
  invoiceNo: string;
  partyId: string;
  regNo?: string;
  startKms?: number;
  endKms?: number;
  oilGaugeLimit?: number;
  lines: Array<{
    itemId: string;
    qty?: number;
    cartons?: number;
    rate?: number;
    ratePerCarton?: number;
    discountPercent?: number;
  }>;
  paymentMethod?: "Cash" | "Card" | "Credit" | "Bank";
};

export async function postSalesInvoice(input: SalesInput) {
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
        await Item.findByIdAndUpdate(line.itemId, { $inc: { stockQtyCartons: -line.qty } }, { session });
      }

      if (input.paymentMethod !== "Cash" && input.paymentMethod !== "Card") {
        await Party.findByIdAndUpdate(input.partyId, { $inc: { balance: total } }, { session });
      }

      const invoice = await Invoice.create(
        [
          {
            invoiceNo: input.invoiceNo,
            type: "sale",
            partyId: input.partyId,
            regNo: input.regNo ?? "",
            startKms: input.startKms ?? 0,
            endKms: input.endKms ?? 0,
            rangeKms: (input.endKms ?? 0) - (input.startKms ?? 0),
            oilGaugeLimit: input.oilGaugeLimit ?? 0,
            lines,
            totalAmount: total,
            status: "posted",
            paymentMethod: input.paymentMethod || "Credit",
          },
        ],
        { session, ordered: true }
      );

      const isCash = input.paymentMethod === "Cash" || input.paymentMethod === "Card";
      
      await JournalEntry.create(
        [
          { 
            invoiceId: invoice[0]._id, 
            accountCode: isCash ? "1000" : "1100", 
            accountTitle: isCash ? "Cash in Hand" : "Accounts Receivable", 
            debit: total, 
            credit: 0, 
            remarks: `Sales invoice posted (${input.paymentMethod || "Credit"})` 
          },
          { 
            invoiceId: invoice[0]._id, 
            accountCode: "4100", 
            accountTitle: "Sales", 
            debit: 0, 
            credit: total, 
            remarks: "Sales invoice posted" 
          },
        ],
        { session, ordered: true }
      );

      if (input.regNo) {
        await VehicleLog.create(
          [
            {
              regNo: input.regNo,
              invoiceId: invoice[0]._id,
              startKms: input.startKms ?? 0,
              endKms: input.endKms ?? 0,
            },
          ],
          { session }
        );
      }

      return invoice[0];
    });
  } finally {
    session.endSession();
  }
}

export async function postSaleReturn(input: { invoiceNo: string; partyId: string; linkedInvoiceId: string; lines: SalesInput["lines"] }) {
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
        await Item.findByIdAndUpdate(line.itemId, { $inc: { stockQtyCartons: (line.cartons || 0) } }, { session });
      }
      await Party.findByIdAndUpdate(input.partyId, { $inc: { balance: -total } }, { session });

      const invoice = await Invoice.create(
        [{ invoiceNo: input.invoiceNo, type: "sale_return", partyId: input.partyId, linkedInvoiceId: input.linkedInvoiceId, lines, totalAmount: total, status: "posted" }],
        { session }
      );

      await JournalEntry.create(
        [
          { invoiceId: invoice[0]._id, accountCode: "4100", accountTitle: "Sales Return", debit: total, credit: 0, remarks: "Sales return posted" },
          { invoiceId: invoice[0]._id, accountCode: "1100", accountTitle: "Accounts Receivable", debit: 0, credit: total, remarks: "Sales return posted" },
        ],
        { session }
      );

      return invoice[0];
    });
  } finally {
    session.endSession();
  }
}
