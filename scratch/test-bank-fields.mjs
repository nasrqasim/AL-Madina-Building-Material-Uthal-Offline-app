import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const banks = await mongoose.connection.db.collection('banks').find().toArray();
        for (const b of banks) {
          console.log(`Bank: ${b.name} | Code: ${b.code} | Balance: ${b.balance} | OpeningBalance: ${b.openingBalance ?? 'undefined'}`);
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
