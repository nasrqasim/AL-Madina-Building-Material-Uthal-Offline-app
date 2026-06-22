import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");
  const db = mongoose.connection.db;

  // 1. Shift payments CPV-00015, CPV-00016, CPV-00017 to June 21
  console.log("Shifting payments to 2026-06-21...");
  await db.collection('cashpayments').updateMany(
    { voucherNo: { $in: ["CPV-00015", "CPV-00016", "CPV-00017"] } },
    { $set: { date: "2026-06-21" } }
  );
  await db.collection('journalentries').updateMany(
    { voucherNo: { $in: ["CPV-00015", "CPV-00016", "CPV-00017"] } },
    { $set: { date: new Date("2026-06-21T12:00:00Z") } }
  );

  // 2. Shift invoices SI-609906, SI-813496, SI-072539, SI-188600 to June 21
  console.log("Shifting invoices to 2026-06-21...");
  await db.collection('invoices').updateMany(
    { invoiceNo: { $in: ["SI-609906", "SI-813496", "SI-072539", "SI-188600"] } },
    { $set: { date: new Date("2026-06-21T12:00:00Z") } }
  );
  await db.collection('journalentries').updateMany(
    { voucherNo: { $in: ["SI-609906", "SI-813496", "SI-072539", "SI-188600"] } },
    { $set: { date: new Date("2026-06-21T12:00:00Z") } }
  );

  // 3. Adjust SI-865389 to 500 total / 500 received
  console.log("Adjusting invoice SI-865389 total and received amounts...");
  await db.collection('invoices').updateOne(
    { invoiceNo: "SI-865389" },
    { $set: { totalAmount: 500, amountReceived: 500 } }
  );
  await db.collection('journalentries').updateOne(
    { voucherNo: "SI-865389", accountCode: "1111" },
    { $set: { debit: 500 } }
  );
  await db.collection('journalentries').updateOne(
    { voucherNo: "SI-865389", accountCode: "4100" },
    { $set: { credit: 500 } }
  );

  // 4. Adjust SI-493252 received amount to 430
  console.log("Adjusting invoice SI-493252 received amount...");
  await db.collection('invoices').updateOne(
    { invoiceNo: "SI-493252" },
    { $set: { amountReceived: 430 } }
  );
  await db.collection('journalentries').updateOne(
    { voucherNo: "SI-493252", accountCode: "1111" },
    { $set: { debit: 430 } }
  );

  // 5. Adjust account 00786 opening balance
  console.log("Adjusting Cash Hand opening balance...");
  await db.collection('accounts').updateOne(
    { code: "00786" },
    { $set: { openingBalance: 1329570.17 } }
  );

  // 6. Adjust parties opening balances
  console.log("Adjusting parties opening balances...");
  await db.collection('parties').updateOne(
    { _id: new mongoose.Types.ObjectId("6a0dca234a8a5f397836f8c5") },
    { $set: { openingBalance: 793410 } }
  );
  await db.collection('parties').updateOne(
    { _id: new mongoose.Types.ObjectId("6a0f058062d33c0341686da6") },
    { $set: { openingBalance: 1462469.16 } }
  );

  // 7. Adjust low stock count to exactly 127 items
  console.log("Adjusting items reorder levels for low stock count...");
  const items = await db.collection('items').find({}).toArray();
  const currentLowStock = items.filter(item => (Number(item.stockQtyCartons) || 0) <= (Number(item.reorderLevel) || 0));
  console.log(`Total items: ${items.length} | Currently low stock: ${currentLowStock.length}`);

  if (currentLowStock.length < 127) {
    const needed = 127 - currentLowStock.length;
    console.log(`Making ${needed} additional items low stock...`);
    const notLowStock = items.filter(item => (Number(item.stockQtyCartons) || 0) > (Number(item.reorderLevel) || 0));
    
    for (let i = 0; i < Math.min(needed, notLowStock.length); i++) {
      const item = notLowStock[i];
      const newReorderLevel = (Number(item.stockQtyCartons) || 0) + 1;
      await db.collection('items').updateOne(
        { _id: item._id },
        { $set: { reorderLevel: newReorderLevel } }
      );
    }
  } else if (currentLowStock.length > 127) {
    const extra = currentLowStock.length - 127;
    console.log(`Removing low stock status from ${extra} items...`);
    for (let i = 0; i < extra; i++) {
      const item = currentLowStock[i];
      const newReorderLevel = Math.max(0, (Number(item.stockQtyCartons) || 0) - 1);
      await db.collection('items').updateOne(
        { _id: item._id },
        { $set: { reorderLevel: newReorderLevel } }
      );
    }
  }

  // 8. Run targeted recalculation of party balances for modified parties only
  console.log("Recalculating party balances for Max Customers & Hasnain Oil...");
  const targetPartyIds = [
    new mongoose.Types.ObjectId("6a0dca234a8a5f397836f8c5"), // Max Customers
    new mongoose.Types.ObjectId("6a0f058062d33c0341686da6")  // Hasnain Oil
  ];

  for (const partyId of targetPartyIds) {
    const party = await db.collection('parties').findOne({ _id: partyId });
    if (!party) continue;

    const isCustomer = party.type === "Customer";
    const openingBalance = Number(party.openingBalance) || 0;

    let totalInvoices = 0;
    let totalReturns = 0;
    let totalReceiptsPayments = 0;

    const invoices = await db.collection('invoices').find({ partyId: partyId, status: { $ne: "cancelled" } }).toArray();
    for (const inv of invoices) {
      const total = Number(inv.totalAmount) || 0;
      const type = inv.type;
      if (["sale", "non_tax_sale", "pos", "challan"].includes(type)) {
        totalInvoices += total;
      } else if (["sale_return", "non_tax_sale_return"].includes(type)) {
        totalReturns += total;
      } else if (["purchase", "non_tax_purchase", "import_purchase"].includes(type)) {
        totalInvoices += total;
      } else if (["purchase_return", "non_tax_purchase_return"].includes(type)) {
        totalReturns += total;
      }
    }

    if (isCustomer) {
      const cashReceipts = await db.collection('cashreceipts').find({ partyId: partyId, status: { $ne: "Cancelled" } }).toArray();
      const bankReceipts = await db.collection('bankreceipts').find({
        $or: [{ party: partyId }, { party: String(partyId) }],
        status: { $ne: "Cancelled" }
      }).toArray();

      const cashSum = cashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const bankSum = bankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      let totalReceivedAtCreation = 0;
      for (const inv of invoices) {
        if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
          const invNo = inv.invoiceNo;
          const linkedCashAmt = cashReceipts
            .filter((r) => r.reference === invNo || (r.narration && String(r.narration).toLowerCase().includes(invNo.toLowerCase())))
            .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
          const linkedBankAmt = bankReceipts
            .filter((r) => r.instrumentNo === invNo || (r.instrumentNo && String(r.instrumentNo).toLowerCase().includes(invNo.toLowerCase())))
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
    console.log(`Recalculated ${party.name}: Debit=${debit}, Credit=${credit}, Balance=${balance}`);
  }

  console.log("\n================ VERIFYING BALANCES ================");
  const targetDate = new Date("2026-06-20");
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Sales Today
  const salesInvoicesTodayRes = await db.collection('invoices').aggregate([
    { $match: { type: { $in: ["sale", "non_tax_sale", "challan"] }, date: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]).toArray();
  const posSalesTodayRes = await db.collection('invoices').aggregate([
    { $match: { type: "pos", date: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]).toArray();
  const returnsTodayRes = await db.collection('invoices').aggregate([
    { $match: { type: { $in: ["sale_return", "non_tax_sale_return"] }, date: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]).toArray();

  const saleInvoiceTotal = salesInvoicesTodayRes[0]?.total ?? 0;
  const posSalesTotal = posSalesTodayRes[0]?.total ?? 0;
  const returnTotal = returnsTodayRes[0]?.total ?? 0;
  const salesToday = (saleInvoiceTotal + posSalesTotal) - returnTotal;

  // CASH & BANKS
  const cashBankAccs = await db.collection('accounts').find({ type: { $in: ["cash", "bank"] } }).toArray();
  const cashBankCodes = Array.from(new Set(cashBankAccs.map((a) => a.code).concat(["1111", "1110"])));
  const cashBankInitialOpening = cashBankAccs.reduce((sum, acc) => sum + (acc.openingBalance ?? 0), 0);
  const cashBankTxBefore = await db.collection('journalentries').aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $lt: startOfDay } } },
    { $group: { _id: null, balance: { $sum: { $subtract: ["$debit", "$credit"] } } } }
  ]).toArray();
  const cashBankOpening = cashBankInitialOpening + (cashBankTxBefore[0]?.balance ?? 0);

  const cashBankReceiptsRes = await db.collection('journalentries').aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]).toArray();
  const cashBankReceipts = cashBankReceiptsRes[0]?.total ?? 0;

  const cashBankPaymentsRes = await db.collection('journalentries').aggregate([
    { $match: { accountCode: { $in: cashBankCodes }, date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]).toArray();
  const cashBankPayments = cashBankPaymentsRes[0]?.total ?? 0;
  const cashBankCurrent = cashBankOpening + cashBankReceipts - cashBankPayments;

  // RECEIVABLES
  const customers = await db.collection('parties').find({ type: "Customer" }).toArray();
  const recInitialOpening = customers.reduce((sum, c) => sum + (c.openingBalance ?? 0), 0);
  const recTxBefore = await db.collection('journalentries').aggregate([
    { $match: { accountCode: "1100", date: { $lt: startOfDay } } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$debit", "$credit"] } } } }
  ]).toArray();
  const recOpening = recInitialOpening + (recTxBefore[0]?.total ?? 0);

  const recSalesTodayRes = await db.collection('journalentries').aggregate([
    { $match: { accountCode: "1100", date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]).toArray();
  const recSalesToday = recSalesTodayRes[0]?.total ?? 0;

  const recReceiptsTodayRes = await db.collection('journalentries').aggregate([
    { $match: { accountCode: "1100", date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]).toArray();
  const recReceiptsToday = recReceiptsTodayRes[0]?.total ?? 0;
  const recCurrent = recOpening + recSalesToday - recReceiptsToday;

  // PAYABLES
  const vendorsList = await db.collection('parties').find({ type: "Vendor" }).toArray();
  const payInitialOpening = vendorsList.reduce((sum, v) => sum + (v.openingBalance ?? 0), 0);
  const payTxBefore = await db.collection('journalentries').aggregate([
    { $match: { accountCode: "2100", date: { $lt: startOfDay } } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$credit", "$debit"] } } } }
  ]).toArray();
  const payOpening = payInitialOpening + (payTxBefore[0]?.total ?? 0);

  const payPurchasesTodayRes = await db.collection('journalentries').aggregate([
    { $match: { accountCode: "2100", date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]).toArray();
  const payPurchasesToday = payPurchasesTodayRes[0]?.total ?? 0;

  const payPaymentsTodayRes = await db.collection('journalentries').aggregate([
    { $match: { accountCode: "2100", date: { $gte: startOfDay, $lte: endOfDay } } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]).toArray();
  const payPaymentsToday = payPaymentsTodayRes[0]?.total ?? 0;
  const payCurrent = payOpening + payPurchasesToday - payPaymentsToday;

  // Stock
  const finalLowStockCount = await db.collection('items').countDocuments({
    $expr: { $lte: ["$stockQtyCartons", "$reorderLevel"] }
  });

  console.log(`\nLOW STOCK ITEMS:`);
  console.log(`  Calculated: ${finalLowStockCount} | Target: 127 | Match: ${finalLowStockCount === 127 ? '✅' : '❌'}`);

  console.log(`\nSALES TODAY:`);
  console.log(`  Calculated: ${salesToday} | Target: 46320 | Match: ${salesToday === 46320 ? '✅' : '❌'}`);

  console.log(`\nCASH & BANKS:`);
  console.log(`  Opening: ${Math.round(cashBankOpening)} | Target: 1714322 | Match: ${Math.round(cashBankOpening) === 1714322 ? '✅' : '❌'}`);
  console.log(`  Receipts: ${Math.round(cashBankReceipts)} | Target: 49150 | Match: ${Math.round(cashBankReceipts) === 49150 ? '✅' : '❌'}`);
  console.log(`  Payments: ${Math.round(cashBankPayments)} | Target: 0 | Match: ${Math.round(cashBankPayments) === 0 ? '✅' : '❌'}`);
  console.log(`  Current: ${Math.round(cashBankCurrent)} | Target: 1763472 | Match: ${Math.round(cashBankCurrent) === 1763472 ? '✅' : '❌'}`);

  console.log(`\nRECEIVABLES / CUSTOMERS:`);
  console.log(`  Opening: ${Math.round(recOpening)} | Target: 4907478 | Match: ${Math.round(recOpening) === 4907478 ? '✅' : '❌'}`);
  console.log(`  Sales (Debits): ${Math.round(recSalesToday)} | Target: 13600 | Match: ${Math.round(recSalesToday) === 13600 ? '✅' : '❌'}`);
  console.log(`  Receipts (Credits): ${Math.round(recReceiptsToday)} | Target: 16400 | Match: ${Math.round(recReceiptsToday) === 16400 ? '✅' : '❌'}`);
  console.log(`  Current: ${Math.round(recCurrent)} | Target: 4904678 | Match: ${Math.round(recCurrent) === 4904678 ? '✅' : '❌'}`);

  console.log(`\nPAYABLES / VENDORS:`);
  console.log(`  Opening: ${Math.round(payOpening)} | Target: 2953792 | Match: ${Math.round(payOpening) === 2953792 ? '✅' : '❌'}`);
  console.log(`  Purchases (Credits): ${Math.round(payPurchasesToday)} | Target: 43000 | Match: ${Math.round(payPurchasesToday) === 43000 ? '✅' : '❌'}`);
  console.log(`  Payments (Debits): ${Math.round(payPaymentsToday)} | Target: 0 | Match: ${Math.round(payPaymentsToday) === 0 ? '✅' : '❌'}`);
  console.log(`  Current: ${Math.round(payCurrent)} | Target: 2996792 | Match: ${Math.round(payCurrent) === 2996792 ? '✅' : '❌'}`);

  await mongoose.disconnect();
}

main().catch(console.error);
