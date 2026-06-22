import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));

  const parties = await Party.find({ openingBalance: { $exists: true, $ne: 0 } }).lean();
  console.log(`Found ${parties.length} parties with non-zero opening balances:`);
  for (const p of parties) {
    console.log(`ID: ${p._id}, Code: ${p.code}, Name: ${p.name || p.companyName}, Type: ${p.type}, Opening: ${p.openingBalance}, Debit: ${p.debit}, Credit: ${p.credit}, Balance: ${p.balance}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
