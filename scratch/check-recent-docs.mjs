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

  // Search for documents created on or after 2026-06-20
  const cutoff = new Date("2026-06-20T00:00:00.000Z");

  for (const col of collections) {
    const results = await col.model.find({
      createdAt: { $gte: cutoff }
    }).lean();

    if (results.length > 0) {
      console.log(`\n=== Found ${results.length} recent documents in ${col.name} ===`);
      for (const res of results) {
        let partyName = 'N/A';
        const pId = res.partyId || res.party || res.vendor;
        if (pId && mongoose.Types.ObjectId.isValid(pId)) {
          const party = await Party.findById(pId).lean();
          partyName = party ? party.name : 'Unknown';
        }
        console.log(`ID: ${res._id}, Num/Name: ${res.invoiceNo || res.receiptNumber || res.voucherNo || res.name || 'N/A'}, Party: ${partyName}, Amt/Total: ${res.amount || res.totalAmount || res.debit || 'N/A'}, CreatedAt: ${res.createdAt}`);
      }
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
