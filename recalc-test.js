import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));

  const parties = await Party.find({ name: { $regex: /Al Hadid|Max/i } }).lean();
  for (const p of parties) {
    const isCustomer = p.type === 'Customer';
    const accountCode = isCustomer ? "1100" : "2100";
    const openingBalance = Number(p.openingBalance) || 0;

    const entries = await JournalEntry.find({ partyId: p._id, accountCode }).lean();
    const debit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
    const credit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);

    let balance = 0;
    if (isCustomer) {
      balance = openingBalance + debit - credit;
    } else {
      balance = openingBalance + credit - debit;
    }

    console.log(`\nParty: ${p.name}`);
    console.log(`  Opening: ${openingBalance}`);
    console.log(`  Calculated Debit: ${debit}, Credit: ${credit}, Balance: ${balance}`);
    console.log(`  Current DB Debit: ${p.debit}, Credit: ${p.credit}, Balance: ${p.balance}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
