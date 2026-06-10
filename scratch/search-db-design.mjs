import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const docs = await db.collection(col.name).find().toArray();
            const docsStr = JSON.stringify(docs);
            if (docsStr.toLowerCase().includes("black copper") || docsStr.toLowerCase().includes("s4c") || docsStr.toLowerCase().includes("bc-")) {
                console.log(`FOUND in collection ${col.name}!`);
                docs.forEach(d => {
                    const str = JSON.stringify(d);
                    if (str.toLowerCase().includes("black") || str.toLowerCase().includes("s4c")) {
                        console.log("Document:", d);
                    }
                });
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
});
