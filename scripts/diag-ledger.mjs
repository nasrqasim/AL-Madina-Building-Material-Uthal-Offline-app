import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Item = mongoose.connection.collection("items");
  const Invoice = mongoose.connection.collection("invoices");
  const item = await Item.findOne({ code: "2030008" });
  if (!item) {
    console.log("Item not found");
    process.exit(0);
  }
  console.log("Item:", item._id.toString(), item.code, item.name, "stock:", item.stockQtyCartons);
  const invs = await Invoice.find({
    "lines.itemId": item._id,
    status: { $ne: "cancelled" },
  }).toArray();
  console.log("Invoice count:", invs.length);
  for (const inv of invs.slice(0, 10)) {
    const lines = (inv.lines || []).filter((l) => String(l.itemId) === String(item._id));
    console.log(
      inv.invoiceNo,
      inv.type,
      inv.date,
      "lines:",
      lines.map((l) => ({ cartons: l.cartons, qty: l.qty, gallons: l.gallons }))
    );
  }
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
