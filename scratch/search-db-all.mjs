import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(`Total collections: ${collections.length}`);

  for (const colInfo of collections) {
    const colName = colInfo.name;
    const col = db.collection(colName);
    
    // Find documents containing 253 in any way
    const docs = await col.find({}).toArray();
    const matches = [];
    
    for (const doc of docs) {
      const str = JSON.stringify(doc);
      if (str.includes(':253') || str.includes(',253') || str.includes('"253"') || str.includes(' 253') || str.includes('-253')) {
        matches.push(doc);
      }
    }

    if (matches.length > 0) {
      console.log(`\nFound ${matches.length} matches in collection: ${colName}`);
      console.log(JSON.stringify(matches, null, 2));
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
