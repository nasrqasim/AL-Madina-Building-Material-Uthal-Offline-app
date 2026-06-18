import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const db = mongoose.connection.db;
        const parties = await db.collection('parties').find({ type: "Customer" }).toArray();
        console.log(`Found ${parties.length} customers:`);
        for (const p of parties) {
            const invoices = await db.collection('invoices').find({ partyId: p._id, status: { $ne: "cancelled" } }).toArray();
            const cashReceipts = await db.collection('cashreceipts').find({ partyId: p._id, status: { $ne: "Cancelled" } }).toArray();
            const bankReceipts = await db.collection('bankreceipts').find({
                $or: [{ party: p._id }, { party: String(p._id) }],
                status: { $ne: "Cancelled" }
            }).toArray();

            const totalInvoices = invoices.reduce((sum, inv) => {
                const total = Number(inv.totalAmount) || 0;
                if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
                    return sum + total;
                } else if (["sale_return", "non_tax_sale_return"].includes(inv.type)) {
                    return sum - total; // return reduces
                }
                return sum;
            }, 0);

            const totalAmountReceivedAtSale = invoices.reduce((sum, inv) => {
                if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
                    return sum + (Number(inv.amountReceived) || 0);
                }
                return sum;
            }, 0);

            const totalCR = cashReceipts.reduce((sum, cr) => sum + (Number(cr.amount) || 0), 0);
            const totalBR = bankReceipts.reduce((sum, br) => sum + (Number(br.amount) || 0), 0);

            console.log(`Customer: ${p.name} (${p.code})`);
            console.log(`  DB Balance: ${p.balance}`);
            console.log(`  Opening Balance: ${p.openingBalance}`);
            console.log(`  Total Sales (less returns): ${totalInvoices}`);
            console.log(`  Amount Received at Sale: ${totalAmountReceivedAtSale}`);
            console.log(`  Cash Receipts (later): ${totalCR}`);
            console.log(`  Bank Receipts (later): ${totalBR}`);
            
            // Formula: Opening Balance + Total Sales - Total Receipts - Credit Notes
            // If opening balance is stored as: debit is negative, credit is positive?
            // Let's print out what the calculated balance should be if we use standard formula:
            // Let's assume opening balance is Debit (positive if customer owes us, i.e. standard Dr balance)
            // Let's compute: Dr Balance = (p.openingBalance or standard) + Total Sales - Total Receipts (both at sale and later)
            // Wait, how is opening balance stored? Let's check:
            // In recalculatePartyBalance:
            // const opCredit = openingBalance > 0 ? openingBalance : 0;
            // const opDebit = openingBalance < 0 ? Math.abs(openingBalance) : 0;
            // debit = opDebit + totalInvoices;
            // credit = opCredit + totalReturns + totalReceiptsPayments;
            // balance = credit - debit;
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
