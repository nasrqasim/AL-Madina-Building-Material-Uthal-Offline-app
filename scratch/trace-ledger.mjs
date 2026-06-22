import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));

  const p = await Party.findOne({ name: { $regex: /Max/i } }).lean();
  if (!p) {
    console.log("Max Customers party not found!");
    return;
  }

  console.log(`Party ID: ${p._id}, Code: ${p.code}, Name: ${p.name}`);

  // Query all journal entries for Max Customers
  const entries = await JournalEntry.find({
    $or: [
      { partyId: p._id },
      { partyId: String(p._id) },
      { accountCode: "12004001" }, // Max Customers account code in old software?
      { accountCode: p.code }
    ]
  }).sort({ date: 1, createdAt: 1 }).lean();

  console.log(`\n--- JOURNAL ENTRIES FOUND (${entries.length}) ---`);
  let runningBalance = Number(p.openingBalance) || 0;
  console.log(`Starting Opening Balance: ${runningBalance}`);
  
  for (const entry of entries) {
    const debit = Number(entry.debit) || 0;
    const credit = Number(entry.credit) || 0;
    runningBalance += debit - credit;
    console.log(`Date: ${entry.date ? new Date(entry.date).toISOString().split("T")[0] : 'N/A'}, VNo: ${entry.voucherNo}, Acc: ${entry.accountCode} (${entry.accountTitle}), Dr: ${debit}, Cr: ${credit}, Bal: ${runningBalance}, Rem: ${entry.remarks}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
