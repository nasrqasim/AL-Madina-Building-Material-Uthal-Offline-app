import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const party = await mongoose.connection.db.collection('parties').findOne({ name: /Walk-in/i });
        if (party) {
            console.log('Found Walk-in Customer:', party);
        } else {
            console.log('No Walk-in customer found by name regex.');
            // Let's print the first 20 customers
            const first20 = await mongoose.connection.db.collection('parties').find({type: 'Customer'}).limit(20).toArray();
            console.log('First 20 customers:');
            first20.forEach(c => console.log(c.name));
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
