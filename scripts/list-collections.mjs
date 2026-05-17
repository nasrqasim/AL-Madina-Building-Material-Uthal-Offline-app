import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";
const DB_NAME = "pos_system_db";

async function main() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collections = await db.listCollections().toArray();
        console.log(collections.map(c => c.name));
    } finally {
        await client.close();
    }
}

main().catch(console.error);
