import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const banks = await mongoose.connection.db.collection('banks').find().toArray();
        console.log(`Total banks: ${banks.length}`);
        banks.forEach(b => {
            console.log(JSON.stringify(b, null, 2));
        });
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
