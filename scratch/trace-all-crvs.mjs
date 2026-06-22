import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));

  const receipts = await CashReceipt.find({}).lean();
  console.log(`Total Cash Receipts: ${receipts.length}`);
  
  for (const r of receipts) {
    const party = await Party.findById(r.partyId).lean();
    console.log(`ID: ${r._id}, CRNo: ${r.receiptNumber}, Party: ${party ? party.name : 'Unknown'}, Amt: ${r.amount}, Status: ${r.status}, Date: ${r.date}, Ref: ${r.reference}, Nar: ${r.narration}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
