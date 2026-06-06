import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const allParties = await mongoose.connection.db.collection('parties').find({type: 'Customer'}).toArray();
        console.log(`Total Customer parties: ${allParties.length}`);
        
        let hasCompanyName = 0;
        let emptyCompanyName = 0;
        let nullOrUndefinedCompanyName = 0;
        
        allParties.forEach(p => {
            if (p.companyName === undefined || p.companyName === null) {
                nullOrUndefinedCompanyName++;
            } else if (p.companyName.trim() === "") {
                emptyCompanyName++;
            } else {
                hasCompanyName++;
            }
        });
        
        console.log(`Has companyName: ${hasCompanyName}`);
        console.log(`Empty companyName: ${emptyCompanyName}`);
        console.log(`Null/Undefined companyName: ${nullOrUndefinedCompanyName}`);
        
        console.log('\nFirst 10 customers with details:');
        allParties.slice(0, 10).forEach(p => {
            console.log(`ID: ${p._id} | Name: ${p.name} | CompanyName: ${JSON.stringify(p.companyName)}`);
        });

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
