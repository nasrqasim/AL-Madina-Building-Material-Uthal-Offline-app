import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));
  const entries = await JournalEntry.find({ voucherNo: "CRV-00005" }).lean();
  console.log("Journal entries for CRV-00005:", JSON.stringify(entries, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
