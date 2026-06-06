import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const allParties = await mongoose.connection.db.collection('parties').find({type: 'Customer'}).toArray();
        const statusCounts = {};
        allParties.forEach(p => {
            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });
        console.log('Customer status counts:', statusCounts);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
