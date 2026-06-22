import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));
  const BankReceipt = mongoose.model('BankReceipt', new mongoose.Schema({}, { strict: false }));
  const CashPayment = mongoose.model('CashPayment', new mongoose.Schema({}, { strict: false }));
  const BankPayment = mongoose.model('BankPayment', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));

  const collections = [
    { name: 'Invoice', model: Invoice },
    { name: 'CashReceipt', model: CashReceipt },
    { name: 'BankReceipt', model: BankReceipt },
    { name: 'CashPayment', model: CashPayment },
    { name: 'BankPayment', model: BankPayment },
    { name: 'JournalEntry', model: JournalEntry }
  ];

  for (const col of collections) {
    const results = await col.model.find({
      $or: [
        { amount: 253 },
        { totalAmount: 253 },
        { debit: 253 },
        { credit: 253 },
        { amountReceived: 253 },
        { total: 253 }
      ]
    }).lean();

    if (results.length > 0) {
      console.log(`Found in ${col.name}:`);
      console.log(JSON.stringify(results, null, 2));
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
