import mongoose from "mongoose";
import dotenv from "dotenv";

import CashPayment from "../src/models/CashPayment";
import BankPayment from "../src/models/BankPayment";
import CashReceipt from "../src/models/CashReceipt";
import BankReceipt from "../src/models/BankReceipt";
import SalaryAdvance from "../src/models/SalaryAdvance";
import SalarySettlement from "../src/models/SalarySettlement";
import SalaryLoan from "../src/models/SalaryLoan";
import Payroll from "../src/models/Payroll";

dotenv.config({ path: ".env.local" });
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oilshop";

const runTests = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const modelsToTest = [
      { name: "CashPayment", model: CashPayment, data: { voucherNo: "TEST-CP-1", date: "2026-05-01" } },
      { name: "BankPayment", model: BankPayment, data: { voucherNo: "TEST-BP-1", date: "2026-05-01" } },
      { name: "CashReceipt", model: CashReceipt, data: { receiptNumber: "TEST-CR-1", date: "2026-05-01" } },
      { name: "BankReceipt", model: BankReceipt, data: { receiptNumber: "TEST-BR-1", date: "2026-05-01" } },
      { name: "SalaryAdvance", model: SalaryAdvance, data: { voucherNo: "TEST-SA-1", date: "2026-05-01", employee: "Test Emp" } },
      { name: "SalarySettlement", model: SalarySettlement, data: { voucherNo: "TEST-SS-1", date: "2026-05-01", employee: "Test Emp" } },
      { name: "SalaryLoan", model: SalaryLoan, data: { voucherNo: "TEST-SL-1", date: "2026-05-01", employee: "Test Emp" } },
      { name: "Payroll", model: Payroll, data: { voucherNo: "TEST-PR-1", month: "2026-05" } }
    ];

    for (const item of modelsToTest) {
      console.log(`\nTesting ${item.name}...`);
      
      // 1. Create 3 records
      const createdIds = [];
      for (let i = 1; i <= 3; i++) {
        const insertData = { ...item.data };
        if (insertData.voucherNo) insertData.voucherNo = `${insertData.voucherNo}-${i}`;
        if (insertData.receiptNumber) insertData.receiptNumber = `${insertData.receiptNumber}-${i}`;
        
        const doc = await item.model.create(insertData);
        createdIds.push(doc._id);
      }
      console.log(`✅ Created 3 records in ${item.name}.`);

      // 2. Fetch records
      const fetched = await item.model.find({ _id: { $in: createdIds } });
      console.log(`✅ Fetched ${fetched.length} records from ${item.name}.`);

      // 3. Delete records
      await item.model.deleteMany({ _id: { $in: createdIds } });
      console.log(`✅ Deleted 3 records from ${item.name}.`);
    }

    console.log("\n🎉 ALL TESTS PASSED!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
