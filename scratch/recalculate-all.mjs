import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const db = mongoose.connection.db;
        const parties = await db.collection('parties').find().toArray();
        console.log(`Recalculating balances for ${parties.length} parties...`);
        
        for (const party of parties) {
            const partyId = party._id;
            const isCustomer = party.type === "Customer";
            const openingBalance = Number(party.openingBalance) || 0;

            let totalInvoices = 0;
            let totalReturns = 0;
            let totalReceiptsPayments = 0;

            // 1. Sum up all invoices for this party
            const invoices = await db.collection('invoices').find({ partyId: partyId, status: { $ne: "cancelled" } }).toArray();
            for (const inv of invoices) {
                const total = Number(inv.totalAmount) || 0;
                const type = inv.type;
                if (type === "sale" || type === "non_tax_sale" || type === "pos" || type === "challan") {
                    totalInvoices += total;
                } else if (type === "sale_return" || type === "non_tax_sale_return") {
                    totalReturns += total;
                } else if (type === "purchase" || type === "non_tax_purchase" || type === "import_purchase") {
                    totalInvoices += total;
                } else if (type === "purchase_return" || type === "non_tax_purchase_return") {
                    totalReturns += total;
                }
            }

            // 2. Sum up all receipts / payments for this party
            if (isCustomer) {
                const cashReceipts = await db.collection('cashreceipts').find({ partyId: partyId, status: { $ne: "Cancelled" } }).toArray();
                const bankReceipts = await db.collection('bankreceipts').find({
                    $or: [{ party: partyId }, { party: String(partyId) }],
                    status: { $ne: "Cancelled" }
                }).toArray();

                const cashSum = cashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                const bankSum = bankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

                // Compute total received at creation time for invoices (which does not have a CashReceipt/BankReceipt document)
                let totalReceivedAtCreation = 0;
                for (const inv of invoices) {
                    if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
                        const invNo = inv.invoiceNo;
                        const linkedCashAmt = cashReceipts
                            .filter((r) => r.reference === invNo || (r.narration && r.narration.toLowerCase().includes(invNo.toLowerCase())))
                            .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                        const linkedBankAmt = bankReceipts
                            .filter((r) => r.instrumentNo === invNo || (r.instrumentNo && r.instrumentNo.toLowerCase().includes(invNo.toLowerCase())))
                            .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

                        const paidAtCreation = Math.max(0, (Number(inv.amountReceived) || 0) - (linkedCashAmt + linkedBankAmt));
                        totalReceivedAtCreation += paidAtCreation;
                    }
                }

                totalReceiptsPayments = cashSum + bankSum + totalReceivedAtCreation;
            } else {
                const cashPayments = await db.collection('cashpayments').find({
                    $or: [{ partyId: partyId }, { vendor: partyId }, { vendor: String(partyId) }],
                    status: { $ne: "Cancelled" }
                }).toArray();
                const bankPayments = await db.collection('bankpayments').find({ vendor: partyId, status: { $ne: "Cancelled" } }).toArray();
                totalReceiptsPayments += cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                totalReceiptsPayments += bankPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            }

            let debit = 0;
            let credit = 0;
            let balance = 0;

            if (isCustomer) {
                const opDebit = openingBalance > 0 ? openingBalance : 0;
                const opCredit = openingBalance < 0 ? Math.abs(openingBalance) : 0;
                debit = opDebit + totalInvoices;
                credit = opCredit + totalReturns + totalReceiptsPayments;
                balance = debit - credit;
            } else {
                const opCredit = openingBalance > 0 ? openingBalance : 0;
                const opDebit = openingBalance < 0 ? Math.abs(openingBalance) : 0;
                credit = opCredit + totalInvoices;
                debit = opDebit + totalReturns + totalReceiptsPayments;
                balance = credit - debit;
            }

            await db.collection('parties').updateOne(
                { _id: partyId },
                { $set: { debit, credit, balance } }
            );
        }

        console.log("Recalculation completed successfully!");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
