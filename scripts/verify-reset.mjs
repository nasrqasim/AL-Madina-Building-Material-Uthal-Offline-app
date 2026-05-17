import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    const invoices = await db.collection("invoices").countDocuments();
    const categories = await db.collection("categories").countDocuments();
    const items = await db.collection("items").countDocuments();
    const parties = await db.collection("parties").countDocuments();

    console.log(`Invoices: ${invoices}`);
    console.log(`Categories: ${categories}`);
    console.log(`Items: ${items}`);
    console.log(`Parties: ${parties}`);

    const sampleItem = await db.collection("items").findOne({});
    console.log("Sample Item:", sampleItem);

    const sampleCat = await db.collection("categories").findOne({ type: "sub" });
    console.log("Sample SubCategory:", sampleCat);

    process.exit(0);
}

run().catch(console.error);
