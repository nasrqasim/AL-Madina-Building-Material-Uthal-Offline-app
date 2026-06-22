import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");
  const db = mongoose.connection.db;

  // Let's inspect the party 6a0f058062d33c0341686da6
  const vendor = await db.collection('parties').findOne({ _id: new mongoose.Types.ObjectId("6a0f058062d33c0341686da6") });
  console.log("\n=== VENDOR 6a0f058062d33c0341686da6 ===");
  console.log(vendor);

  // Let's inspect the cash payments on 2026-06-20
  const cashPayments = await db.collection('cashpayments').find({}).toArray();
  console.log("\n=== ALL CASH PAYMENTS ===");
  cashPayments.forEach(cp => {
    console.log(`No: ${cp.voucherNo} | Vendor: ${cp.vendorName} | Amount: ${cp.amount} | Date: ${cp.date} | Status: ${cp.status}`);
  });

  // Let's inspect cash receipts on 2026-06-20
  const cashReceipts = await db.collection('cashreceipts').find({}).toArray();
  console.log("\n=== ALL CASH RECEIPTS ===");
  cashReceipts.forEach(cr => {
    console.log(`No: ${cr.receiptNumber} | Party: ${cr.partyName} | Amount: ${cr.amount} | Date: ${cr.date} | Status: ${cr.status}`);
  });

  await mongoose.disconnect();
}

main().catch(console.error);
