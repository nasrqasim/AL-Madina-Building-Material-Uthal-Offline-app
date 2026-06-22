import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");
  const db = mongoose.connection.db;

  const startOfDay = new Date("2026-06-20T00:00:00.000Z");
  const endOfDay = new Date("2026-06-20T23:59:59.999Z");

  console.log("\n=== INVOICES ON 2026-06-20 ===");
  const invoices = await db.collection('invoices').find({
    date: { $gte: startOfDay, $lte: endOfDay }
  }).toArray();
  invoices.forEach(inv => {
    console.log(`Type: ${inv.type} | InvoiceNo: ${inv.invoiceNo} | Party: ${inv.partyName || inv.partyId} | Total: ${inv.totalAmount} | Recv: ${inv.amountReceived} | Status: ${inv.status}`);
  });

  console.log("\n=== CASH RECEIPTS ON 2026-06-20 ===");
  const cashReceipts = await db.collection('cashreceipts').find({
    date: { $regex: /2026-06-20/ }
  }).toArray();
  cashReceipts.forEach(cr => {
    console.log(`Number: ${cr.receiptNumber} | Party: ${cr.partyName || cr.partyId} | Amount: ${cr.amount} | Status: ${cr.status}`);
  });

  console.log("\n=== BANK RECEIPTS ON 2026-06-20 ===");
  const bankReceipts = await db.collection('bankreceipts').find({
    date: { $regex: /2026-06-20/ }
  }).toArray();
  bankReceipts.forEach(br => {
    console.log(`Number: ${br.receiptNumber} | Amount: ${br.amount} | Status: ${br.status}`);
  });

  console.log("\n=== CASH PAYMENTS ON 2026-06-20 ===");
  const cashPayments = await db.collection('cashpayments').find({
    date: { $regex: /2026-06-20/ }
  }).toArray();
  cashPayments.forEach(cp => {
    console.log(`Number: ${cp.voucherNo} | Vendor: ${cp.vendorName || cp.vendor} | Amount: ${cp.amount} | Status: ${cp.status}`);
  });

  console.log("\n=== BANK PAYMENTS ON 2026-06-20 ===");
  const bankPayments = await db.collection('bankpayments').find({
    date: { $regex: /2026-06-20/ }
  }).toArray();
  bankPayments.forEach(bp => {
    console.log(`Number: ${bp.voucherNo} | Vendor: ${bp.vendorName || bp.vendor} | Amount: ${bp.amount} | Status: ${bp.status}`);
  });

  console.log("\n=== JOURNAL ENTRIES ON 2026-06-20 ===");
  const journalEntries = await db.collection('journalentries').find({
    date: { $gte: startOfDay, $lte: endOfDay }
  }).toArray();
  journalEntries.forEach(je => {
    console.log(`Voucher: ${je.voucherNo} | Account: ${je.accountCode} (${je.accountName}) | Debit: ${je.debit} | Credit: ${je.credit}`);
  });

  await mongoose.disconnect();
}

main().catch(console.error);
