import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Account from "../src/models/Account";
import Party from "../src/models/Party";
import JournalEntry from "../src/models/JournalEntry";
import Invoice from "../src/models/Invoice";
import OtherIncome from "../src/models/OtherIncome";

async function inspect() {
  // Load .env.local manually
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^"|"$/g, "");
        process.env[key] = value;
      }
    });
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI not found in .env.local");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB!");

  console.log("=== ACCOUNTS ===");
  const accounts = await Account.find().lean();
  console.log(JSON.stringify(accounts, null, 2));

  console.log("=== PARTIES SAMPLE ===");
  const parties = await Party.find().lean();
  console.log(`Total parties: ${parties.length}`);
  console.log(JSON.stringify(parties.slice(0, 3), null, 2));

  console.log("=== JOURNAL ENTRIES UNIQUE CODES ===");
  const uniqueCodes = await JournalEntry.distinct("accountCode");
  console.log("Account codes in JournalEntry:", uniqueCodes);

  console.log("=== INVOICES CODES ===");
  const invoicesTypes = await Invoice.distinct("type");
  console.log("Invoice types:", invoicesTypes);

  const invoicesCount = await Invoice.countDocuments();
  console.log(`Total invoices: ${invoicesCount}`);

  console.log("=== OTHER INCOMES ===");
  const incomes = await OtherIncome.find().lean();
  console.log(`Total other incomes: ${incomes.length}`);

  process.exit(0);
}

inspect().catch(e => {
  console.error(e);
  process.exit(1);
});
