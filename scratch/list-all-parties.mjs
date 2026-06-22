import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const parties = await mongoose.connection.db.collection('parties').find().toArray();
        console.log(`Total parties in database: ${parties.length}`);
        
        const customers = parties.filter(p => p.type === 'Customer');
        const vendors = parties.filter(p => p.type === 'Vendor');
        
        console.log(`Customers: ${customers.length}`);
        console.log(`Vendors: ${vendors.length}`);
        
        console.log("\n=== CUSTOMERS IN DB ===");
        customers.forEach((c, i) => {
            console.log(`${i + 1}. Code: ${c.code} | Name: ${c.name} | Opening: ${c.openingBalance}`);
        });
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
