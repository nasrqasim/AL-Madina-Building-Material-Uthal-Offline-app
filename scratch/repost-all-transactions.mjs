import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    try {
        const db = mongoose.connection.db;

        // Clean up any old entries for CRV, BRV, CPV, BPV to prevent duplicates
        console.log("Cleaning up old transaction journal entries...");
        const delCr = await db.collection('journalentries').deleteMany({ voucherNo: /^CRV-/i });
        const delBr = await db.collection('journalentries').deleteMany({ voucherNo: /^BRV-/i });
        const delCp = await db.collection('journalentries').deleteMany({ voucherNo: /^CPV-/i });
        const delBp = await db.collection('journalentries').deleteMany({ voucherNo: /^BPV-/i });
        console.log(`Deleted: CRV: ${delCr.deletedCount}, BRV: ${delBr.deletedCount}, CPV: ${delCp.deletedCount}, BPV: ${delBp.deletedCount}`);

        const accounts = await db.collection('accounts').find().toArray();
        const banks = await db.collection('banks').find().toArray();

        // 1. Repost Cash Receipts
        console.log("Reposting Cash Receipts...");
        const cashReceipts = await db.collection('cashreceipts').find({ status: "Posted" }).toArray();
        const crEntries = [];
        for (const cr of cashReceipts) {
            const date = cr.date ? new Date(cr.date) : new Date();
            const voucherNo = cr.receiptNumber;
            const amount = Number(cr.amount) || 0;
            const remarks = cr.narration || cr.notes || "Cash Receipt";

            let cashCode = "1111";
            let cashTitle = "Cash Hand";
            if (cr.cashAccountId) {
                const acc = accounts.find(a => String(a._id) === String(cr.cashAccountId));
                if (acc) {
                    cashCode = acc.code || cashCode;
                    cashTitle = acc.title || cashTitle;
                }
            }

            const receiptType = cr.receiptType || "party";
            if (receiptType === "party" && cr.partyId) {
                crEntries.push({
                    date,
                    voucherNo,
                    accountCode: cashCode,
                    accountTitle: cashTitle,
                    debit: amount,
                    credit: 0,
                    remarks,
                    partyId: cr.partyId,
                    partyType: ""
                });
                crEntries.push({
                    date,
                    voucherNo,
                    accountCode: "1100",
                    accountTitle: "Accounts Receivable",
                    debit: 0,
                    credit: amount,
                    remarks,
                    partyId: cr.partyId,
                    partyType: "customer"
                });
            } else if (receiptType === "petty" && Array.isArray(cr.contraLines)) {
                crEntries.push({
                    date,
                    voucherNo,
                    accountCode: cashCode,
                    accountTitle: cashTitle,
                    debit: amount,
                    credit: 0,
                    remarks,
                    partyId: null,
                    partyType: ""
                });
                for (const line of cr.contraLines) {
                    let code = "40002001";
                    let title = "Other Income";
                    if (line.accountId) {
                        const acc = accounts.find(a => String(a._id) === String(line.accountId));
                        if (acc) {
                            code = acc.code || code;
                            title = acc.title || title;
                        }
                    }
                    crEntries.push({
                        date,
                        voucherNo,
                        accountCode: code,
                        accountTitle: title,
                        debit: 0,
                        credit: Number(line.amount) || 0,
                        remarks: line.description || remarks,
                        partyId: null,
                        partyType: ""
                    });
                }
            } else if (receiptType === "multi" && Array.isArray(cr.partyLines)) {
                crEntries.push({
                    date,
                    voucherNo,
                    accountCode: cashCode,
                    accountTitle: cashTitle,
                    debit: amount,
                    credit: 0,
                    remarks,
                    partyId: null,
                    partyType: ""
                });
                for (const line of cr.partyLines) {
                    crEntries.push({
                        date,
                        voucherNo,
                        accountCode: "1100",
                        accountTitle: "Accounts Receivable",
                        debit: 0,
                        credit: Number(line.amount) || 0,
                        remarks,
                        partyId: line.partyId || null,
                        partyType: "customer"
                    });
                }
            }
        }
        if (crEntries.length > 0) {
            await db.collection('journalentries').insertMany(crEntries);
            console.log(`Inserted ${crEntries.length} entries for Cash Receipts`);
        }

        // 2. Repost Cash Payments
        console.log("Reposting Cash Payments...");
        const cashPayments = await db.collection('cashpayments').find({ status: "Posted" }).toArray();
        const cpEntries = [];
        for (const cp of cashPayments) {
            const date = cp.date ? new Date(cp.date) : new Date();
            const voucherNo = cp.voucherNo;
            const amount = Number(cp.amount) || 0;
            const remarks = cp.narration || cp.notes || "Cash Payment";

            let cashCode = "1111";
            let cashTitle = "Cash Hand";
            if (cp.cashAccountId) {
                const acc = accounts.find(a => String(a._id) === String(cp.cashAccountId));
                if (acc) {
                    cashCode = acc.code || cashCode;
                    cashTitle = acc.title || cashTitle;
                }
            }

            const paymentType = cp.paymentType || "party";
            if (paymentType === "party" && cp.partyId) {
                cpEntries.push({
                    date,
                    voucherNo,
                    accountCode: "2100",
                    accountTitle: "Accounts Payable",
                    debit: amount,
                    credit: 0,
                    remarks,
                    partyId: cp.partyId,
                    partyType: "vendor"
                });
                cpEntries.push({
                    date,
                    voucherNo,
                    accountCode: cashCode,
                    accountTitle: cashTitle,
                    debit: 0,
                    credit: amount,
                    remarks,
                    partyId: null,
                    partyType: ""
                });
            } else if (paymentType === "petty" && Array.isArray(cp.contraLines)) {
                cpEntries.push({
                    date,
                    voucherNo,
                    accountCode: cashCode,
                    accountTitle: cashTitle,
                    debit: 0,
                    credit: amount,
                    remarks,
                    partyId: null,
                    partyType: ""
                });
                for (const line of cp.contraLines) {
                    let code = "5100";
                    let title = "Purchases";
                    if (line.accountId) {
                        const acc = accounts.find(a => String(a._id) === String(line.accountId));
                        if (acc) {
                            code = acc.code || code;
                            title = acc.title || title;
                        }
                    }
                    cpEntries.push({
                        date,
                        voucherNo,
                        accountCode: code,
                        accountTitle: title,
                        debit: Number(line.amount) || 0,
                        credit: 0,
                        remarks: line.description || remarks,
                        partyId: null,
                        partyType: ""
                    });
                }
            }
        }
        if (cpEntries.length > 0) {
            await db.collection('journalentries').insertMany(cpEntries);
            console.log(`Inserted ${cpEntries.length} entries for Cash Payments`);
        }

        // 3. Repost Bank Receipts
        console.log("Reposting Bank Receipts...");
        const bankReceipts = await db.collection('bankreceipts').find({ status: "Posted" }).toArray();
        const brEntries = [];
        for (const br of bankReceipts) {
            const date = br.date ? new Date(br.date) : new Date();
            const voucherNo = br.receiptNumber;
            const amount = Number(br.amount) || 0;
            const remarks = br.narration || br.notes || "Bank Receipt";
            const partyId = br.party;

            let bankCode = "1110";
            let bankTitle = "Bank";
            if (br.bankAccount) {
                const b = banks.find(x => String(x._id) === String(br.bankAccount));
                if (b) {
                    bankCode = b.code || bankCode;
                    bankTitle = b.name || b.title || bankTitle;
                }
            }

            if (partyId) {
                brEntries.push({
                    date,
                    voucherNo,
                    accountCode: bankCode,
                    accountTitle: bankTitle,
                    debit: amount,
                    credit: 0,
                    remarks,
                    partyId: null,
                    partyType: ""
                });
                brEntries.push({
                    date,
                    voucherNo,
                    accountCode: "1100",
                    accountTitle: "Accounts Receivable",
                    debit: 0,
                    credit: amount,
                    remarks,
                    partyId: partyId,
                    partyType: "customer"
                });
            }
        }
        if (brEntries.length > 0) {
            await db.collection('journalentries').insertMany(brEntries);
            console.log(`Inserted ${brEntries.length} entries for Bank Receipts`);
        }

        // 4. Repost Bank Payments
        console.log("Reposting Bank Payments...");
        const bankPayments = await db.collection('bankpayments').find({ status: "Posted" }).toArray();
        const bpEntries = [];
        for (const bp of bankPayments) {
            const date = bp.date ? new Date(bp.date) : new Date();
            const voucherNo = bp.voucherNo;
            const amount = Number(bp.amount) || 0;
            const remarks = bp.narration || bp.notes || "Bank Payment";
            const partyId = bp.vendor;

            let bankCode = "1110";
            let bankTitle = "Bank";
            if (bp.bankAccount) {
                const b = banks.find(x => String(x._id) === String(bp.bankAccount));
                if (b) {
                    bankCode = b.code || bankCode;
                    bankTitle = b.name || b.title || bankTitle;
                }
            }

            if (partyId) {
                bpEntries.push({
                    date,
                    voucherNo,
                    accountCode: "2100",
                    accountTitle: "Accounts Payable",
                    debit: amount,
                    credit: 0,
                    remarks,
                    partyId: partyId,
                    partyType: "vendor"
                });
                bpEntries.push({
                    date,
                    voucherNo,
                    accountCode: bankCode,
                    accountTitle: bankTitle,
                    debit: 0,
                    credit: amount,
                    remarks,
                    partyId: null,
                    partyType: ""
                });
            }
        }
        if (bpEntries.length > 0) {
            await db.collection('journalentries').insertMany(bpEntries);
            console.log(`Inserted ${bpEntries.length} entries for Bank Payments`);
        }

        console.log("All transactions reposted successfully!");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
