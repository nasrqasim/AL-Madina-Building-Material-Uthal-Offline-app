import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));
  const cr = await CashReceipt.findOne({ receiptNumber: "CRV-00005" }).lean();
  console.log("CRV-00005 details:", JSON.stringify(cr, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
