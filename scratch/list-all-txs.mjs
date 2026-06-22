import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));
  const BankReceipt = mongoose.model('BankReceipt', new mongoose.Schema({}, { strict: false }));
  const CashPayment = mongoose.model('CashPayment', new mongoose.Schema({}, { strict: false }));
  const BankPayment = mongoose.model('BankPayment', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));

  const p = await Party.findOne({ name: { $regex: /Max/i } }).lean();
  if (!p) {
    console.log("Max Customers not found!");
    return;
  }
  const partyId = p._id;

  console.log(`Max Customers Party ID: ${partyId}`);

  console.log("\n=== INVOICES ===");
  const invoices = await Invoice.find({ partyId }).lean();
  for (const inv of invoices) {
    console.log(`InvNo: ${inv.invoiceNo}, Type: ${inv.type}, Total: ${inv.totalAmount}, Recv: ${inv.amountReceived}, Status: ${inv.status}, Date: ${inv.date}`);
  }

  console.log("\n=== CASH RECEIPTS ===");
  const cashReceipts = await CashReceipt.find({ partyId }).lean();
  for (const cr of cashReceipts) {
    console.log(`CRNo: ${cr.receiptNumber}, Amt: ${cr.amount}, Status: ${cr.status}, Date: ${cr.date}, Ref: ${cr.reference}, Nar: ${cr.narration}`);
  }

  console.log("\n=== BANK RECEIPTS ===");
  const bankReceipts = await BankReceipt.find({ $or: [{ party: partyId }, { party: String(partyId) }] }).lean();
  for (const br of bankReceipts) {
    console.log(`BRNo: ${br.receiptNumber}, Amt: ${br.amount}, Status: ${br.status}, Date: ${br.date}, Inst: ${br.instrumentNo}`);
  }

  console.log("\n=== JOURNAL ENTRIES ===");
  const journalEntries = await JournalEntry.find({ $or: [{ partyId }, { partyId: String(partyId) }] }).lean();
  for (const je of journalEntries) {
    console.log(`Date: ${je.date}, VNo: ${je.voucherNo}, Acc: ${je.accountCode} (${je.accountTitle}), Dr: ${je.debit}, Cr: ${je.credit}, Rem: ${je.remarks}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
