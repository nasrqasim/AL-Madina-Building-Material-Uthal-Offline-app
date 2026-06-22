import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB!");

  // Switcher screenshot time is 2:52 PM on June 20, 2026.
  // In Pakistan Standard Time (UTC+5), 2:52 PM is 09:52 AM UTC.
  const screenshotTime = new Date("2026-06-20T14:52:00.000+05:00");
  
  const targetDate = new Date("2026-06-20");
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0); // local start of day (2026-06-19T19:00:00Z in UTC)
  
  console.log(`Target Date: ${targetDate.toISOString().split("T")[0]}`);
  console.log(`Start of Day (Local): ${startOfDay.toString()}`);
  console.log(`Screenshot Time (Local): ${screenshotTime.toString()}`);

  const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));
  const BankReceipt = mongoose.model('BankReceipt', new mongoose.Schema({}, { strict: false }));
  const CashPayment = mongoose.model('CashPayment', new mongoose.Schema({}, { strict: false }));
  const BankPayment = mongoose.model('BankPayment', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));
  const Account = mongoose.model('Account', new mongoose.Schema({}, { strict: false }));
  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const Bank = mongoose.model('Bank', new mongoose.Schema({}, { strict: false }));

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

  // 1. Sales today before 2:52 PM
  const sales = await Invoice.find({
    date: { $gte: startOfDay, $lte: screenshotTime },
    createdAt: { $lte: screenshotTime },
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
  console.log(`\n1. Sales Today (before 2:52 PM): PKR ${saleTotal}`);

  // 2. Cash & Bank calculations
  // Opening balance is balance from initial opening + journal entries before startOfDay
  const cashBankInitialOpening = cashBankAccs.reduce((sum, acc) => sum + (acc.openingBalance ?? 0), 0);
  const cbTxBefore = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $lt: startOfDay } } },
    { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
  ]);
  const cbOpening = cashBankInitialOpening + (cbTxBefore[0]?.balance ?? 0);
  console.log(`\n2. Cash & Banks:`);
  console.log(`   Opening Balance: PKR ${cbOpening}`);

  // Receipts today before 2:52 PM
  const cbReceiptsRes = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: screenshotTime }, createdAt: { $lte: screenshotTime } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]);
  const cbReceipts = cbReceiptsRes[0]?.total ?? 0;
  console.log(`   Receipts Today: PKR ${cbReceipts}`);

  // Payments today before 2:52 PM
  const cbPaymentsRes = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: screenshotTime }, createdAt: { $lte: screenshotTime } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]);
  const cbPayments = cbPaymentsRes[0]?.total ?? 0;
  console.log(`   Payments Today: PKR ${cbPayments}`);
  console.log(`   Current Balance: PKR ${cbOpening + cbReceipts - cbPayments}`);

  // 3. Receivables calculations
  const customers = await Party.find({ type: "Customer" }).lean();
  const recInitialOpening = customers.reduce((sum, c) => sum + (c.openingBalance ?? 0), 0);
  const recTxBefore = await JournalEntry.aggregate([
    { $match: { accountCode: "1100", date: { $lt: startOfDay } } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$debit", "$credit"] } } } }
  ]);
  const recOpening = recInitialOpening + (recTxBefore[0]?.total ?? 0);
  console.log(`\n3. Receivables / Customers:`);
  console.log(`   Opening Balance: PKR ${recOpening}`);

  const recSalesRes = await JournalEntry.aggregate([
    { $match: { accountCode: "1100", date: { $gte: startOfDay, $lte: screenshotTime }, createdAt: { $lte: screenshotTime } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]);
  const recSales = recSalesRes[0]?.total ?? 0;
  console.log(`   Sales (Debits) Today: PKR ${recSales}`);

  const recReceiptsRes = await JournalEntry.aggregate([
    { $match: { accountCode: "1100", date: { $gte: startOfDay, $lte: screenshotTime }, createdAt: { $lte: screenshotTime } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]);
  const recReceipts = recReceiptsRes[0]?.total ?? 0;
  console.log(`   Receipts (Credits) Today: PKR ${recReceipts}`);
  console.log(`   Current Balance: PKR ${recOpening + recSales - recReceipts}`);

  // 4. Payables calculations
  const vendors = await Party.find({ type: "Vendor" }).lean();
  const payInitialOpening = vendors.reduce((sum, v) => sum + (v.openingBalance ?? 0), 0);
  const payTxBefore = await JournalEntry.aggregate([
    { $match: { accountCode: "2100", date: { $lt: startOfDay } } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$credit", "$debit"] } } } }
  ]);
  const payOpening = payInitialOpening + (payTxBefore[0]?.total ?? 0);
  console.log(`\n4. Payables / Vendors:`);
  console.log(`   Opening Balance: PKR ${payOpening}`);

  const payPurchasesRes = await JournalEntry.aggregate([
    { $match: { accountCode: "2100", date: { $gte: startOfDay, $lte: screenshotTime }, createdAt: { $lte: screenshotTime } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]);
  const payPurchases = payPurchasesRes[0]?.total ?? 0;
  console.log(`   Purchases (Credits) Today: PKR ${payPurchases}`);

  const payPaymentsRes = await JournalEntry.aggregate([
    { $match: { accountCode: "2100", date: { $gte: startOfDay, $lte: screenshotTime }, createdAt: { $lte: screenshotTime } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]);
  const payPayments = payPaymentsRes[0]?.total ?? 0;
  console.log(`   Payments (Debits) Today: PKR ${payPayments}`);
  console.log(`   Current Balance: PKR ${payOpening + payPurchases - payPayments}`);

  await mongoose.disconnect();
}

main().catch(console.error);
