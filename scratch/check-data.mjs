import mongoose from 'mongoose';

async function checkData() {
  const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";
  try {
    await mongoose.connect(uri);
    const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
    const count = await Invoice.countDocuments();
    console.log('Total Invoices:', count);
    
    if (count > 0) {
      const latest = await Invoice.findOne().sort({ createdAt: -1 });
      console.log('Latest Invoice:', JSON.stringify(latest, null, 2));
    }
    
    const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
    const partyCount = await Party.countDocuments();
    console.log('Total Parties:', partyCount);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
