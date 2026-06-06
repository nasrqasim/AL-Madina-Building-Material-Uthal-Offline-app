import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dbConnect from "../src/lib/db";
import Account from "../src/models/Account";
import JournalEntry from "../src/models/JournalEntry";

async function test() {
  await dbConnect();
  console.log("Connected to database successfully");

  const accounts = await Account.find({}).lean();
  console.log("Accounts in DB:");
  for (const acc of accounts) {
    // calculate balance from JournalEntries
    const journalEntries = await JournalEntry.find({ accountCode: acc.code }).lean();
    let balance = acc.openingBalance || 0;
    const debits = journalEntries.reduce((s, r) => s + (r.debit || 0), 0);
    const credits = journalEntries.reduce((s, r) => s + (r.credit || 0), 0);
    
    const isAssetOrExpense = ["cash", "bank", "expense", "receivable", "asset"].includes(acc.type);
    if (isAssetOrExpense) {
      balance += debits - credits;
    } else {
      balance += credits - debits;
    }
    
    console.log(`Code: ${acc.code}, Title: ${acc.title}, Type: ${acc.type}, DB OpeningBalance: ${acc.openingBalance}, Computed CurrentBalance: ${balance}, Journal entries count: ${journalEntries.length}`);
  }

  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
