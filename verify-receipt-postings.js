import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));

  const partyId = new mongoose.Types.ObjectId("6a0dca234a8a5f397836f8c5");
  const receipts = await CashReceipt.find({ partyId: partyId }).lean();
  console.log(`Found ${receipts.length} Cash Receipts in CashReceipt collection:`);
  for (const r of receipts) {
    const jes = await JournalEntry.find({ voucherNo: r.receiptNumber }).lean();
    const jeSum = jes.reduce((sum, je) => sum + (Number(je.credit) || 0), 0);
    console.log(`Receipt: ${r.receiptNumber}, Amount: ${r.amount}, Status: ${r.status}, JE Credit Sum: ${jeSum}, JE Count: ${jes.length}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
