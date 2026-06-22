import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));

  const receipts = await CashReceipt.find({ receiptNumber: { $in: ["CRV-00024", "CRV-00025"] } }).lean();
  console.log(JSON.stringify(receipts, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
