import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));

  const parties = await Party.find({ name: { $regex: /Al Hadid|Max/i } }).lean();
  for (const p of parties) {
    console.log(`\n=========================================`);
    console.log(`PARTY: ${p.name} (ID: ${p._id})`);
    console.log(`Opening: ${p.openingBalance}, Debit: ${p.debit}, Credit: ${p.credit}, Balance: ${p.balance}`);
    console.log(`=========================================`);

    // Fetch journal entries for this party
    const entries = await JournalEntry.find({ partyId: p._id }).sort({ date: 1 }).lean();
    console.log(`Found ${entries.length} Journal Entries:`);
    let balance = Number(p.openingBalance) || 0;
    for (const entry of entries) {
      const Dr = Number(entry.debit) || 0;
      const Cr = Number(entry.credit) || 0;
      balance += Dr - Cr;
      console.log(`  Date: ${new Date(entry.date).toISOString().split('T')[0]}, Voucher: ${entry.voucherNo}, Code: ${entry.accountCode}, Dr: ${Dr}, Cr: ${Cr}, Remarks: ${entry.remarks}, Running: ${balance}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
