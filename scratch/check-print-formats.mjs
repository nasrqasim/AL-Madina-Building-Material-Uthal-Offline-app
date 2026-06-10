import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:");
        console.log(collections.map(c => c.name));
        
        const pf = await mongoose.connection.db.collection('printformats').find().toArray();
        console.log("printformats count:", pf.length);
        console.log(JSON.stringify(pf.slice(0, 5), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
});
