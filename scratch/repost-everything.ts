import mongoose from 'mongoose';
import Invoice from '../src/models/Invoice';
import CashReceipt from '../src/models/CashReceipt';
import CashPayment from '../src/models/CashPayment';
import BankReceipt from '../src/models/BankReceipt';
import BankPayment from '../src/models/BankPayment';
import Party from '../src/models/Party';
import JournalEntry from '../src/models/JournalEntry';
import {
  generateInvoiceJournalEntries,
  postCashReceiptJournalEntries,
  postCashPaymentJournalEntries,
  postBankReceiptJournalEntries,
  postBankPaymentJournalEntries,
  recalculatePartyBalance
} from '../src/services/posting/invoicePostingHelper';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.");

  console.log("Deleting all journal entries...");
  const delRes = await JournalEntry.deleteMany({});
  console.log(`Deleted ${delRes.deletedCount} journal entries.`);

  // Invoices
  const invoices = await Invoice.find({ status: { $ne: "cancelled" } });
  console.log(`Found ${invoices.length} invoices to post...`);
  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    try {
      await generateInvoiceJournalEntries(inv);
      if (i > 0 && i % 100 === 0) {
        console.log(`Posted ${i} invoices...`);
      }
    } catch (err) {
      console.error(`Error posting invoice ${inv.invoiceNo}:`, err);
    }
  }
  console.log("Invoices posted.");

  // Cash Receipts
  const cashReceipts = await CashReceipt.find({ status: "Posted" });
  console.log(`Found ${cashReceipts.length} cash receipts to post...`);
  for (let i = 0; i < cashReceipts.length; i++) {
    const cr = cashReceipts[i];
    try {
      await postCashReceiptJournalEntries(cr);
      if (i > 0 && i % 100 === 0) {
        console.log(`Posted ${i} cash receipts...`);
      }
    } catch (err) {
      console.error(`Error posting cash receipt ${cr.receiptNumber}:`, err);
    }
  }
  console.log("Cash receipts posted.");

  // Cash Payments
  const cashPayments = await CashPayment.find({ status: "Posted" });
  console.log(`Found ${cashPayments.length} cash payments to post...`);
  for (let i = 0; i < cashPayments.length; i++) {
    const cp = cashPayments[i];
    try {
      await postCashPaymentJournalEntries(cp);
      if (i > 0 && i % 100 === 0) {
        console.log(`Posted ${i} cash payments...`);
      }
    } catch (err) {
      console.error(`Error posting cash payment ${cp.voucherNo}:`, err);
    }
  }
  console.log("Cash payments posted.");

  // Bank Receipts
  const bankReceipts = await BankReceipt.find({ status: { $in: ["Posted", "posted"] } });
  console.log(`Found ${bankReceipts.length} bank receipts to post...`);
  for (let i = 0; i < bankReceipts.length; i++) {
    const br = bankReceipts[i];
    try {
      await postBankReceiptJournalEntries(br);
      if (i > 0 && i % 100 === 0) {
        console.log(`Posted ${i} bank receipts...`);
      }
    } catch (err) {
      console.error(`Error posting bank receipt ${br.receiptNumber}:`, err);
    }
  }
  console.log("Bank receipts posted.");

  // Bank Payments
  const bankPayments = await BankPayment.find({ status: { $in: ["Posted", "posted"] } });
  console.log(`Found ${bankPayments.length} bank payments to post...`);
  for (let i = 0; i < bankPayments.length; i++) {
    const bp = bankPayments[i];
    try {
      await postBankPaymentJournalEntries(bp);
      if (i > 0 && i % 100 === 0) {
        console.log(`Posted ${i} bank payments...`);
      }
    } catch (err) {
      console.error(`Error posting bank payment ${bp.voucherNo}:`, err);
    }
  }
  console.log("Bank payments posted.");

  // Recalculate all parties
  const parties = await Party.find({});
  console.log(`Recalculating balances for ${parties.length} parties...`);
  for (let i = 0; i < parties.length; i++) {
    const party = parties[i];
    try {
      await recalculatePartyBalance(party._id.toString());
      if (i > 0 && i % 100 === 0) {
        console.log(`Recalculated ${i} parties...`);
      }
    } catch (err) {
      console.error(`Error recalculating party ${party.name || party.companyName}:`, err);
    }
  }
  console.log("Party balances recalculated.");

  console.log("Done!");
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
