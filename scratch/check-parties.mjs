import mongoose from 'mongoose';

async function checkParties() {
  const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";
  try {
    await mongoose.connect(uri);
    const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
    const parties = await Party.find();
    console.log('Parties:', JSON.stringify(parties, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkParties();
