import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const db = mongoose.connection.db;
        
        console.log("--- Journal Entries ---");
        const jeCount = await db.collection('journalentries').countDocuments();
        console.log(`Total Journal Entries: ${jeCount}`);
        const sampleJe = await db.collection('journalentries').find().limit(5).toArray();
        console.log("Sample Journal Entries:", JSON.stringify(sampleJe, null, 2));

        console.log("--- Cash Receipts ---");
        const crCount = await db.collection('cashreceipts').countDocuments();
        console.log(`Total Cash Receipts: ${crCount}`);
        const sampleCr = await db.collection('cashreceipts').find().limit(5).toArray();
        console.log("Sample Cash Receipts:", JSON.stringify(sampleCr, null, 2));

        console.log("--- Bank Receipts ---");
        const brCount = await db.collection('bankreceipts').countDocuments();
        console.log(`Total Bank Receipts: ${brCount}`);
        const sampleBr = await db.collection('bankreceipts').find().limit(5).toArray();
        console.log("Sample Bank Receipts:", JSON.stringify(sampleBr, null, 2));

        console.log("--- Cash Payments ---");
        const cpCount = await db.collection('cashpayments').countDocuments();
        console.log(`Total Cash Payments: ${cpCount}`);
        const sampleCp = await db.collection('cashpayments').find().limit(5).toArray();
        console.log("Sample Cash Payments:", JSON.stringify(sampleCp, null, 2));

        console.log("--- Bank Payments ---");
        const bpCount = await db.collection('bankpayments').countDocuments();
        console.log(`Total Bank Payments: ${bpCount}`);
        const sampleBp = await db.collection('bankpayments').find().limit(5).toArray();
        console.log("Sample Bank Payments:", JSON.stringify(sampleBp, null, 2));

        console.log("--- Invoices ---");
        const invCount = await db.collection('invoices').countDocuments();
        console.log(`Total Invoices: ${invCount}`);
        const sampleInv = await db.collection('invoices').find().limit(5).toArray();
        console.log("Sample Invoices:", JSON.stringify(sampleInv, null, 2));

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
