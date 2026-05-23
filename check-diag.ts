import dbConnect from "./src/lib/db";
import Account from "./src/models/Account";
import Party from "./src/models/Party";
import JournalEntry from "./src/models/JournalEntry";

async function main() {
  await dbConnect();
  console.log("=== ACCOUNTS ===");
  const accounts = await Account.find({}).lean();
  for (const acc of accounts) {
    console.log(`Code: ${acc.code}, Title: ${acc.title}, Type: ${acc.type}, Opening: ${acc.openingBalance}`);
  }

  console.log("\n=== PARTIES ===");
  const customers = await Party.find({ type: "Customer" }).limit(5).lean();
  console.log(`Total Customers: ${await Party.countDocuments({ type: "Customer" })}`);
  for (const c of customers) {
    console.log(`Customer: ${c.name}, Code: ${c.code}, Balance: ${c.balance}, Opening: ${c.openingBalance}`);
  }

  const vendors = await Party.find({ type: "Vendor" }).limit(5).lean();
  console.log(`Total Vendors: ${await Party.countDocuments({ type: "Vendor" })}`);
  for (const v of vendors) {
    console.log(`Vendor: ${v.name}, Code: ${v.code}, Balance: ${v.balance}, Opening: ${v.openingBalance}`);
  }

  console.log("\n=== JOURNAL ENTRIES ===");
  const entryCounts = await JournalEntry.aggregate([
    { $group: { _id: "$accountCode", count: { $sum: 1 }, debitSum: { $sum: "$debit" }, creditSum: { $sum: "$credit" } } }
  ]);
  console.log("Journal Entries by Account Code:");
  for (const group of entryCounts) {
    console.log(`Account: ${group._id}, Count: ${group.count}, DebitSum: ${group.debitSum}, CreditSum: ${group.creditSum}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
