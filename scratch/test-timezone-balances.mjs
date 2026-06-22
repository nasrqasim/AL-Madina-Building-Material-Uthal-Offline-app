import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function runForTimezone(tzName, startOfDay, endOfDay) {
  console.log(`\n================ TIMEZONE: ${tzName} ===============`);
  console.log(`Start of Day: ${startOfDay.toISOString()}`);
  console.log(`End of Day: ${endOfDay.toISOString()}`);

  const Invoice = mongoose.model('Invoice');
  const CashReceipt = mongoose.model('CashReceipt');
  const BankReceipt = mongoose.model('BankReceipt');
  const CashPayment = mongoose.model('CashPayment');
  const BankPayment = mongoose.model('BankPayment');
  const JournalEntry = mongoose.model('JournalEntry');
  const Account = mongoose.model('Account');
  const Party = mongoose.model('Party');
  const Bank = mongoose.model('Bank');

  // Cash/Bank account codes
  const cashBankAccs = await Account.find({
    $or: [
      { type: { $in: ["cash", "bank"] } },
      { code: { $in: ["1000", "1010", "00786", "1111", "1110"] } }
    ]
  }).lean();
  const bankDocs = await Bank.find().lean();
  const cashBankCodes = Array.from(new Set([
    ...cashBankAccs.map(a => a.code),
    ...bankDocs.map(b => b.code),
    "1000", "1010", "00786", "1111", "1110"
  ]));

  // 1. Sales
  const sales = await Invoice.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: "cancelled" }
  }).lean();
  let saleTotal = 0;
  for (const s of sales) {
    if (["sale", "non_tax_sale", "pos", "challan"].includes(s.type)) {
      saleTotal += Number(s.totalAmount) || 0;
    } else if (["sale_return", "non_tax_sale_return"].includes(s.type)) {
      saleTotal -= Number(s.totalAmount) || 0;
    }
  }
  console.log(`Sales today: ${saleTotal}`);

  // 2. Cash & Banks
  const cashBankInitialOpening = cashBankAccs.reduce((sum, acc) => sum + (acc.openingBalance ?? 0), 0);
  const cbTxBefore = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $lt: startOfDay } } },
    { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
  ]);
  const cbOpening = cashBankInitialOpening + (cbTxBefore[0]?.balance ?? 0);
  
  const cbReceiptsRes = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]);
  const cbReceipts = cbReceiptsRes[0]?.total ?? 0;

  const cbPaymentsRes = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]);
  const cbPayments = cbPaymentsRes[0]?.total ?? 0;
  console.log(`Cash & Banks:`);
  console.log(`  Opening Balance: ${cbOpening}`);
  console.log(`  Receipts: ${cbReceipts}`);
  console.log(`  Payments: ${cbPayments}`);
  console.log(`  Current Balance: ${cbOpening + cbReceipts - cbPayments}`);

  // 3. Receivables / Customers
  const customers = await Party.find({ type: "Customer" }).lean();
  const recInitialOpening = customers.reduce((sum, c) => sum + (c.openingBalance ?? 0), 0);
  const recTxBefore = await JournalEntry.aggregate([
    { $match: { accountCode: "1100", date: { $lt: startOfDay } } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$debit", "$credit"] } } } }
  ]);
  const recOpening = recInitialOpening + (recTxBefore[0]?.total ?? 0);

  const recSalesRes = await JournalEntry.aggregate([
    { $match: { accountCode: "1100", date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]);
  const recSales = recSalesRes[0]?.total ?? 0;

  const recReceiptsRes = await JournalEntry.aggregate([
    { $match: { accountCode: "1100", date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]);
  const recReceipts = recReceiptsRes[0]?.total ?? 0;
  console.log(`Receivables / Customers:`);
  console.log(`  Opening Balance: ${recOpening}`);
  console.log(`  Sales (Debits): ${recSales}`);
  console.log(`  Receipts (Credits): ${recReceipts}`);
  console.log(`  Current Balance: ${recOpening + recSales - recReceipts}`);

  // 4. Payables / Vendors
  const vendors = await Party.find({ type: "Vendor" }).lean();
  const payInitialOpening = vendors.reduce((sum, v) => sum + (v.openingBalance ?? 0), 0);
  const payTxBefore = await JournalEntry.aggregate([
    { $match: { accountCode: "2100", date: { $lt: startOfDay } } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$credit", "$debit"] } } } }
  ]);
  const payOpening = payInitialOpening + (payTxBefore[0]?.total ?? 0);

  const payPurchasesRes = await JournalEntry.aggregate([
    { $match: { accountCode: "2100", date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]);
  const payPurchases = payPurchasesRes[0]?.total ?? 0;

  const payPaymentsRes = await JournalEntry.aggregate([
    { $match: { accountCode: "2100", date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]);
  const payPayments = payPaymentsRes[0]?.total ?? 0;
  console.log(`Payables / Vendors:`);
  console.log(`  Opening Balance: ${payOpening}`);
  console.log(`  Purchases (Credits): ${payPurchases}`);
  console.log(`  Payments (Debits): ${payPayments}`);
  console.log(`  Current Balance: ${payOpening + payPurchases - payPayments}`);
}

async function main() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB!");

  const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));
  const BankReceipt = mongoose.model('BankReceipt', new mongoose.Schema({}, { strict: false }));
  const CashPayment = mongoose.model('CashPayment', new mongoose.Schema({}, { strict: false }));
  const BankPayment = mongoose.model('BankPayment', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));
  const Account = mongoose.model('Account', new mongoose.Schema({}, { strict: false }));
  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const Bank = mongoose.model('Bank', new mongoose.Schema({}, { strict: false }));

  // Case A: UTC Timezone
  const targetDateA = new Date("2026-06-20");
  const startOfDayA = new Date(targetDateA);
  startOfDayA.setUTCHours(0, 0, 0, 0);
  const endOfDayA = new Date(targetDateA);
  endOfDayA.setUTCHours(23, 59, 59, 999);
  await runForTimezone("UTC", startOfDayA, endOfDayA);

  // Case B: Pakistan Standard Time (UTC+5)
  const startOfDayB = new Date("2026-06-20T00:00:00.000+05:00");
  const endOfDayB = new Date("2026-06-20T23:59:59.999+05:00");
  await runForTimezone("PST (UTC+5)", startOfDayB, endOfDayB);

  await mongoose.disconnect();
}

main().catch(console.error);
