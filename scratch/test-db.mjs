import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        console.log("Connected to database!");
        const db = mongoose.connection.db;
        const parties = await db.collection('parties').find().toArray();
        console.log(`Found ${parties.length} parties. Starting recalculation test...`);
        
        let count = 0;
        for (const party of parties) {
            const partyId = party._id;
            const isCustomer = party.type === "Customer";
            const name = party.name;
            console.log(`Processing party [${count + 1}/${parties.length}]: ${name} (${partyId}) - isCustomer: ${isCustomer}`);
            
            const invoices = await db.collection('invoices').find({ partyId: partyId, status: { $ne: "cancelled" } }).toArray();
            console.log(`  Invoices: ${invoices.length}`);
            
            if (isCustomer) {
                const cashReceipts = await db.collection('cashreceipts').find({ partyId: partyId, status: { $ne: "Cancelled" } }).toArray();
                console.log(`  CashReceipts: ${cashReceipts.length}`);
                
                const bankReceipts = await db.collection('bankreceipts').find({
                    $or: [{ party: partyId }, { party: String(partyId) }],
                    status: { $ne: "Cancelled" }
                }).toArray();
                console.log(`  BankReceipts: ${bankReceipts.length}`);
            } else {
                const cashPayments = await db.collection('cashpayments').find({
                    $or: [{ partyId: partyId }, { vendor: partyId }, { vendor: String(partyId) }],
                    status: { $ne: "Cancelled" }
                }).toArray();
                console.log(`  CashPayments: ${cashPayments.length}`);
                
                const bankPayments = await db.collection('bankpayments').find({ vendor: partyId, status: { $ne: "Cancelled" } }).toArray();
                console.log(`  BankPayments: ${bankPayments.length}`);
            }
            count++;
            if (count >= 5) {
                console.log("Test first 5 parties completed!");
                break;
            }
        }
        process.exit(0);
    } catch (e) {
        console.error("Error in test:", e);
        process.exit(1);
    }
});
