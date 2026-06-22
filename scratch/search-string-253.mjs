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
    { name: 'Party', model: Party },
    { name: 'Invoice', model: Invoice },
    { name: 'CashReceipt', model: CashReceipt },
    { name: 'BankReceipt', model: BankReceipt },
    { name: 'CashPayment', model: CashPayment },
    { name: 'BankPayment', model: BankPayment },
    { name: 'JournalEntry', model: JournalEntry }
  ];

  for (const col of collections) {
    // Search for string "253" in any string fields
    const query = {
      $or: [
        { invoiceNo: { $regex: /253/ } },
        { receiptNumber: { $regex: /253/ } },
        { voucherNo: { $regex: /253/ } },
        { narration: { $regex: /253/ } },
        { reference: { $regex: /253/ } },
        { notes: { $regex: /253/ } },
        { remarks: { $regex: /253/ } },
        { description: { $regex: /253/ } }
      ]
    };

    const results = await col.model.find(query).lean();
    if (results.length > 0) {
      console.log(`Found string "253" in ${col.name}:`);
      console.log(JSON.stringify(results, null, 2));
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
