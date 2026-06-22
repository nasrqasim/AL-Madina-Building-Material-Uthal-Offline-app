import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const Account = mongoose.model('Account', new mongoose.Schema({}, { strict: false }));
  const acc = await Account.findOne({ code: "00786" }).lean();
  console.log("Account 00786 details:", JSON.stringify(acc, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
