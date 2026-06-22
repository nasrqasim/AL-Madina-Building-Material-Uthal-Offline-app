import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const CashPayment = mongoose.model('CashPayment', new mongoose.Schema({}, { strict: false }));
  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));

  const cp = await CashPayment.findOne({ voucherNo: { $regex: /CPV.*00010|CPV.*723/i } }).lean();
  console.log("CPV-00010 details:", JSON.stringify(cp, null, 2));

  const cr = await CashReceipt.findOne({ receiptNumber: { $regex: /CRV.*00012|CRV.*1198/i } }).lean();
  console.log("CRV-00012 details:", JSON.stringify(cr, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
