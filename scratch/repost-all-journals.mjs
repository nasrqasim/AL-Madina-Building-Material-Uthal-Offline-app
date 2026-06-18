import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const db = mongoose.connection.db;
        const invoices = await db.collection('invoices').find({ 
            type: { $in: ["sale", "non_tax_sale", "pos", "challan", "sale_return", "non_tax_sale_return"] } 
        }).toArray();
        console.log(`Regenerating journal entries for ${invoices.length} sales invoices...`);

        for (const inv of invoices) {
            // Delete old journal entries for this invoice
            await db.collection('journalentries').deleteMany({ invoiceId: inv._id });

            const total = Number(inv.totalAmount) || 0;
            if (total <= 0) continue;

            const voucherNo = inv.invoiceNo || `INV-${inv._id}`;
            const date = inv.date || inv.createdAt || new Date();
            const paymentMethod = inv.paymentMethod || inv.paymentTerms || "Credit";

            const isCash = paymentMethod === "Cash" || paymentMethod === "Card";
            const isBank = paymentMethod === "Bank" || paymentMethod === "Online";

            const assetCode = isCash ? "1111" : isBank ? "1110" : "1100";
            const assetTitle = isCash ? "Cash" : isBank ? "Bank" : "Accounts Receivable";

            if (inv.type === "sale" || inv.type === "pos" || inv.type === "non_tax_sale" || inv.type === "challan") {
                const entries = [
                    {
                        invoiceId: inv._id,
                        voucherNo,
                        date: new Date(date),
                        accountCode: assetCode,
                        accountTitle: assetTitle,
                        debit: total,
                        credit: 0,
                        remarks: `${inv.type === "non_tax_sale" ? "Non-Tax " : ""}Sales invoice posted (${paymentMethod})`,
                        partyId: inv.partyId || null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    {
                        invoiceId: inv._id,
                        voucherNo,
                        date: new Date(date),
                        accountCode: "4100",
                        accountTitle: "Sales",
                        debit: 0,
                        credit: total,
                        remarks: `${inv.type === "non_tax_sale" ? "Non-Tax " : ""}Sales invoice posted (${paymentMethod})`,
                        partyId: inv.partyId || null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ];

                // If it is a Credit invoice but has cash/bank received at the time of sale
                const amtRecv = Number(inv.amountReceived) || 0;
                if (assetCode === "1100" && amtRecv > 0) {
                    const recvMethod = inv.paymentMethod === "Bank" ? "1110" : "1111";
                    const recvTitle = inv.paymentMethod === "Bank" ? "Bank" : "Cash";
                    
                    entries.push({
                        invoiceId: inv._id,
                        voucherNo,
                        date: new Date(date),
                        accountCode: recvMethod,
                        accountTitle: recvTitle,
                        debit: amtRecv,
                        credit: 0,
                        remarks: `Down payment received at sale`,
                        partyId: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    entries.push({
                        invoiceId: inv._id,
                        voucherNo,
                        date: new Date(date),
                        accountCode: "1100",
                        accountTitle: "Accounts Receivable",
                        debit: 0,
                        credit: amtRecv,
                        remarks: `Down payment received at sale`,
                        partyId: inv.partyId || null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }

                await db.collection('journalentries').insertMany(entries);
            } else if (inv.type === "sale_return" || inv.type === "non_tax_sale_return") {
                const entries = [
                    {
                        invoiceId: inv._id,
                        voucherNo,
                        date: new Date(date),
                        accountCode: "4101",
                        accountTitle: "Sales Return",
                        debit: total,
                        credit: 0,
                        remarks: `${inv.type === "non_tax_sale_return" ? "Non-Tax " : ""}Sales return posted`,
                        partyId: inv.partyId || null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    {
                        invoiceId: inv._id,
                        voucherNo,
                        date: new Date(date),
                        accountCode: assetCode,
                        accountTitle: assetTitle,
                        debit: 0,
                        credit: total,
                        remarks: `${inv.type === "non_tax_sale_return" ? "Non-Tax " : ""}Sales return posted`,
                        partyId: inv.partyId || null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ];
                await db.collection('journalentries').insertMany(entries);
            }
        }

        console.log("Journal entries regeneration completed successfully!");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
