import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));

  const startOfDay = new Date("2026-06-18T00:00:00.000Z");
  const endOfDay = new Date("2026-06-18T23:59:59.999Z");

  const invs = await Invoice.find({ date: { $gte: startOfDay, $lte: endOfDay } }).lean();
  console.log(`Found ${invs.length} invoices on 2026-06-18:`);
  let totalSales = 0;
  let totalRecv = 0;
  for (const inv of invs) {
    console.log(`Invoice: ${inv.invoiceNo}, Type: ${inv.type}, Total: ${inv.totalAmount}, Recv: ${inv.amountReceived}, Status: ${inv.status}`);
    if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
      totalSales += inv.totalAmount || 0;
      totalRecv += inv.amountReceived || 0;
    } else if (["sale_return", "non_tax_sale_return"].includes(inv.type)) {
      totalSales -= inv.totalAmount || 0;
    }
  }
  console.log(`Total Sales: ${totalSales}, Total Received: ${totalRecv}`);
  await mongoose.disconnect();
}

main().catch(console.error);
