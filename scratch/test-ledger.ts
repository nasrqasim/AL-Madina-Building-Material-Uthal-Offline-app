import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dbConnect from "../src/lib/db";
import Invoice from "../src/models/Invoice";
import Item from "../src/models/Item";

async function test() {
  await dbConnect();
  console.log("Connected to database successfully");

  // 1. Let's find some items
  const items = await Item.find({ name: /Air/i }).limit(5).lean();
  console.log("Found Air items:", items.map(i => ({ id: i._id, name: i.name, code: i.code })));

  if (items.length === 0) {
    const anyItems = await Item.find({}).limit(5).lean();
    console.log("No air items. Any items:", anyItems.map(i => ({ id: i._id, name: i.name, code: i.code })));
  }

  // 2. Let's check how many total invoices exist
  const count = await Invoice.countDocuments({});
  console.log("Total Invoices in DB:", count);

  // 3. Let's look for invoices that have lines with itemId
  const invoices = await Invoice.find({ "lines.itemId": { $exists: true } }).limit(5).lean();
  console.log("Invoices with items:", invoices.length);
  for (const inv of invoices) {
    console.log(`Invoice: ${inv.invoiceNo}, Type: ${inv.type}, Date: ${inv.date}, Lines count: ${inv.lines?.length}`);
    for (const l of inv.lines || []) {
      console.log(`  - ItemId: ${l.itemId}, Qty: ${l.qty}, Cartons: ${l.cartons}, Rate: ${l.rate}`);
    }
  }

  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
