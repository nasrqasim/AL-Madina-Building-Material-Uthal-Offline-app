import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const receipts = await mongoose.connection.db.collection('cashreceipts').find().toArray();
        console.log(`Total receipts in DB: ${receipts.length}`);
        
        receipts.forEach(r => {
            console.log(`No: ${r.receiptNumber} | Type: ${r.receiptType} | Date: ${r.date} | Amount: ${r.amount} | Status: ${r.status}`);
            console.log(`  PartyId: ${r.partyId} | CashAccountId: ${r.cashAccountId}`);
            if (r.contraLines && r.contraLines.length > 0) {
                console.log(`  ContraLines:`, r.contraLines);
            }
            if (r.partyLines && r.partyLines.length > 0) {
                console.log(`  PartyLines:`, r.partyLines);
            }
        });

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
