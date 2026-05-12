import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const accounts = await mongoose.connection.db.collection('accounts').countDocuments();
        const journals = await mongoose.connection.db.collection('journalentries').countDocuments();
        console.log('Accounts:', accounts);
        console.log('Journal Entries:', journals);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
