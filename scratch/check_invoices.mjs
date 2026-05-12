import dbConnect from "../src/lib/db.js";
import Invoice from "../src/models/Invoice.js";

async function checkData() {
  await dbConnect();
  const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(10).lean();
  console.log(JSON.stringify(invoices, null, 2));
  process.exit(0);
}

checkData();
