import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const allParties = await mongoose.connection.db.collection('parties').find().toArray();
        console.log(`Total parties: ${allParties.length}`);
        
        const counts = {};
        allParties.forEach(p => {
            const key = `${p.type || 'no-type'}-${p.category || 'no-category'}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        console.log('Party counts by Type & Category:', counts);
        
        console.log('Sample of 10 parties:');
        allParties.slice(0, 15).forEach(p => {
            console.log(`Name: ${p.name} | Type: ${p.type} | Category: ${p.category}`);
        });

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
