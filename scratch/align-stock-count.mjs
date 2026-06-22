import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");
  const db = mongoose.connection.db;

  const lowStockCount = await db.collection('items').countDocuments({
    $expr: { $lte: ["$stockQtyCartons", "$reorderLevel"] }
  });
  console.log(`Current low stock count: ${lowStockCount}`);

  await mongoose.disconnect();
}

main().catch(console.error);
