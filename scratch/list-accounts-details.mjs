import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const allAccounts = await mongoose.connection.db.collection('accounts').find().toArray();
        allAccounts.forEach(acc => {
            console.log(`Code: ${acc.code} | name: ${acc.name} | title: ${acc.title}`);
        });
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
