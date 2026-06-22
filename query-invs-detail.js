import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));

  const invs = await Invoice.find({ partyId: "6a0dcb874a8a5f397836f8d7" }).lean();
  for (const inv of invs) {
    console.log(`\nInvoice: ${inv.invoiceNo}, Type: ${inv.type}, Total: ${inv.totalAmount}, Status: ${inv.status}, Date: ${inv.date}`);
    console.log("Lines:", JSON.stringify(inv.lines, null, 2));
  }

  await mongoose.disconnect();
}

main().catch(console.error);
