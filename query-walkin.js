import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const parties = await Party.find({ name: { $regex: /walk/i } }).lean();
  console.log("Walk-in parties found:", JSON.stringify(parties, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
