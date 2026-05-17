import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    try {
        await db.collection("categories").dropIndex("name_1");
        console.log("Dropped unique index on name in categories.");
    } catch (e) {
        console.log("Index name_1 not found or could not be dropped.");
    }
    process.exit(0);
}

run().catch(console.error);
