import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const allAccounts = await mongoose.connection.db.collection('accounts').find().toArray();
        console.log(`Total accounts: ${allAccounts.length}`);
        
        allAccounts.forEach(acc => {
            console.log(`ID: ${acc._id} | Code: ${acc.code} | Title: ${acc.title || acc.name || '(NO TITLE)'} | Type: ${acc.type}`);
        });

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
