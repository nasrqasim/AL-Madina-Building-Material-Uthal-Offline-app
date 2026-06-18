import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));

  // 1. Migrate Al Hadid Noman's opening balance to positive 4215 (Debit)
  const hadidResult = await Party.updateOne(
    { name: /Al Hadid Noman/i },
    { $set: { openingBalance: 4215 } }
  );
  console.log("Al Hadid Noman opening balance migration result:", hadidResult);

  // 2. Migrate Max Customers' opening balance to 784195
  const maxResult = await Party.updateOne(
    { name: /Max Customers/i },
    { $set: { openingBalance: 784195 } }
  );
  console.log("Max Customers opening balance migration result:", maxResult);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

main().catch(console.error);
