import JournalEntry from "@/models/JournalEntry";
import Party from "@/models/Party";
import Invoice from "@/models/Invoice";
import CashPayment from "@/models/CashPayment";
import BankPayment from "@/models/BankPayment";
import CashReceipt from "@/models/CashReceipt";
import BankReceipt from "@/models/BankReceipt";

export async function recalculatePartyBalance(partyId: string) {
  if (!partyId) return;

  const party = await Party.findById(partyId);
  if (!party) return;

  const isCustomer = party.type === "Customer";
  const openingBalance = Number(party.openingBalance) || 0;

  let totalInvoices = 0;
  let totalReturns = 0;
  let totalReceiptsPayments = 0;

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
    totalReceiptsPayments += cashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    totalReceiptsPayments += bankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  } else {
    const cashPayments = await CashPayment.find({
      $or: [{ partyId }, { vendor: partyId }],
      status: { $ne: "Cancelled" },
    }).lean();
    const bankPayments = await BankPayment.find({ vendor: partyId, status: { $ne: "Cancelled" } }).lean();
    totalReceiptsPayments += cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    totalReceiptsPayments += bankPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }

  let debit = 0;
  let credit = 0;
  let balance = 0;

  if (isCustomer) {
    debit = openingBalance + totalInvoices;
    credit = totalReturns + totalReceiptsPayments;
    balance = debit - credit;
  } else {
    credit = openingBalance + totalInvoices;
    debit = totalReturns + totalReceiptsPayments;
    balance = credit - debit;
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

  const isCash = paymentMethod === "Cash" || paymentMethod === "Card";
  const isBank = paymentMethod === "Bank" || paymentMethod === "Online";

  // Determine Asset / Balance Sheet Accounts
  const assetCode = isCash ? "1111" : isBank ? "1110" : "1100";
  const assetTitle = isCash ? "Cash" : isBank ? "Bank" : "Accounts Receivable";

  const liabilityCode = isCash ? "1111" : isBank ? "1110" : "2100";
  const liabilityTitle = isCash ? "Cash" : isBank ? "Bank" : "Accounts Payable";

  if (invoice.type === "sale" || invoice.type === "pos" || invoice.type === "non_tax_sale") {
    await JournalEntry.create([
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: total,
        credit: 0,
        remarks: `${invoice.type === "non_tax_sale" ? "Non-Tax " : ""}Sales invoice posted (${paymentMethod})`
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "4100",
        accountTitle: "Sales",
        debit: 0,
        credit: total,
        remarks: `${invoice.type === "non_tax_sale" ? "Non-Tax " : ""}Sales invoice posted (${paymentMethod})`
      }
    ]);
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
        remarks: `${invoice.type === "non_tax_sale_return" ? "Non-Tax " : ""}Sales return posted`
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: 0,
        credit: total,
        remarks: `${invoice.type === "non_tax_sale_return" ? "Non-Tax " : ""}Sales return posted`
      }
    ]);
  } else if (invoice.type === "purchase" || invoice.type === "non_tax_purchase") {
    await JournalEntry.create([
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "5100",
        accountTitle: "Purchases",
        debit: total,
        credit: 0,
        remarks: `${invoice.type === "non_tax_purchase" ? "Non-Tax " : ""}Purchase invoice posted (${paymentMethod})`
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: liabilityCode,
        accountTitle: liabilityTitle,
        debit: 0,
        credit: total,
        remarks: `${invoice.type === "non_tax_purchase" ? "Non-Tax " : ""}Purchase invoice posted (${paymentMethod})`
      }
    ]);
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
        remarks: `${invoice.type === "non_tax_purchase_return" ? "Non-Tax " : ""}Purchase return posted`
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "5101",
        accountTitle: "Purchase Return",
        debit: 0,
        credit: total,
        remarks: `${invoice.type === "non_tax_purchase_return" ? "Non-Tax " : ""}Purchase return posted`
      }
    ]);
  }

  if (invoice.partyId) {
    await recalculatePartyBalance(invoice.partyId.toString());
  }
}
