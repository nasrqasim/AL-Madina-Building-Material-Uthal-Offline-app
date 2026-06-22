import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB!");

  const targetDate = new Date("2026-06-20");
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const Account = mongoose.model('Account', new mongoose.Schema({}, { strict: false }));
  const Bank = mongoose.model('Bank', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));

  // Retrieve cash/bank accounts
  const cashBankAccs = await Account.find({
    $or: [
      { type: { $in: ["cash", "bank"] } },
      { code: { $in: ["1000", "1010", "00786", "1111", "1110"] } }
    ]
  }).lean();
  
  const banks = await Bank.find().lean();
  
  // Combine all codes
  const cashBankCodes = Array.from(new Set([
    ...cashBankAccs.map(a => a.code),
    ...banks.map(b => b.code),
    "1000", "1010", "00786", "1111", "1110"
  ]));

  console.log(`\nCash/Bank Codes used: ${cashBankCodes.join(", ")}`);

  // Calculate opening balance
  const cashBankInitialOpening = cashBankAccs.reduce((sum, acc) => sum + (acc.openingBalance ?? 0), 0);
  // Note: we can also check if banks have opening balances, but we saw they don't.
  
  const cashBankTxBefore = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $lt: startOfDay } } },
    { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
  ]);
  const cbOpening = cashBankInitialOpening + (cashBankTxBefore[0]?.balance ?? 0);
  console.log(`Cash & Bank Initial Opening: ${cashBankInitialOpening}`);
  console.log(`Cash & Bank Tx Before: ${cashBankTxBefore[0]?.balance ?? 0}`);
  console.log(`Calculated Cash & Bank Opening: ${cbOpening}`);

  // Receipts today
  const cbReceiptsRes = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]);
  const cbReceipts = cbReceiptsRes[0]?.total ?? 0;
  console.log(`Cash & Bank Receipts today: ${cbReceipts}`);

  // Payments today
  const cbPaymentsRes = await JournalEntry.aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]);
  const cbPayments = cbPaymentsRes[0]?.total ?? 0;
  console.log(`Cash & Bank Payments today: ${cbPayments}`);
  console.log(`Cash & Bank Current Balance: ${cbOpening + cbReceipts - cbPayments}`);

  await mongoose.disconnect();
}

main().catch(console.error);
