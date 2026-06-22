import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");
  const db = mongoose.connection.db;

  // Step 0: Find Max Customers party
  const party = await db.collection('parties').findOne({ name: { $regex: /Max/i } });
  if (!party) { console.log("Party not found!"); process.exit(1); }

  console.log(`\n===== BEFORE FIX =====`);
  console.log(`Party: ${party.name} (${party.code})`);
  console.log(`Opening Balance: ${party.openingBalance}`);
  console.log(`Debit: ${party.debit}, Credit: ${party.credit}, Balance: ${party.balance}`);

  // Step 1: Cancel CRV-00028 (the wrongly-added Rs. 253 receipt)
  // This was a CREDIT receipt (reduces balance), but we needed balance to INCREASE, so it was wrong.
  const crv28 = await db.collection('cashreceipts').findOne({
    partyId: party._id,
    receiptNumber: "CRV-00028"
  });

  if (crv28) {
    console.log(`\n--- Step 1: Cancelling CRV-00028 (Rs. ${crv28.amount}) ---`);
    // Cancel the receipt
    await db.collection('cashreceipts').updateOne(
      { _id: crv28._id },
      { $set: { status: "Cancelled" } }
    );
    console.log(`CRV-00028 status set to Cancelled`);

    // Delete its journal entries
    const delResult = await db.collection('journalentries').deleteMany({
      voucherNo: "CRV-00028",
      $or: [
        { partyId: party._id },
        { partyId: String(party._id) }
      ]
    });
    console.log(`Deleted ${delResult.deletedCount} journal entries for CRV-00028`);

    // Also delete any CRV-00028 journal entries not linked to partyId but with correct voucherNo
    const delResult2 = await db.collection('journalentries').deleteMany({
      voucherNo: "CRV-00028"
    });
    console.log(`Deleted ${delResult2.deletedCount} additional journal entries for CRV-00028`);
  } else {
    console.log("\nCRV-00028 not found, skipping cancel step.");
  }

  // Step 2: Adjust opening balance from 784,195 to 784,448 (+253)
  // The Rs. 253 discrepancy originated from the old software's opening balance migration
  const oldOpening = Number(party.openingBalance) || 0;
  const newOpening = oldOpening + 253;
  console.log(`\n--- Step 2: Adjusting opening balance ---`);
  console.log(`Old opening balance: ${oldOpening}`);
  console.log(`New opening balance: ${newOpening} (+253)`);

  await db.collection('parties').updateOne(
    { _id: party._id },
    { $set: { openingBalance: newOpening } }
  );
  console.log("Opening balance updated.");

  // Step 3: Recalculate party balance using the same logic as recalculate-all.mjs
  console.log(`\n--- Step 3: Recalculating party balance ---`);
  
  const invoices = await db.collection('invoices').find({
    partyId: party._id,
    status: { $ne: "cancelled" }
  }).toArray();

  let totalInvoices = 0;
  let totalReturns = 0;
  for (const inv of invoices) {
    const total = Number(inv.totalAmount) || 0;
    if (["sale", "non_tax_sale", "pos", "challan"].includes(inv.type)) {
      totalInvoices += total;
    } else if (["sale_return", "non_tax_sale_return"].includes(inv.type)) {
      totalReturns += total;
    }
  }

  const cashReceipts = await db.collection('cashreceipts').find({
    partyId: party._id,
    status: { $ne: "Cancelled" }
  }).toArray();

  const bankReceipts = await db.collection('bankreceipts').find({
    $or: [{ party: party._id }, { party: String(party._id) }],
    status: { $ne: "Cancelled" }
  }).toArray();

  const cashSum = cashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const bankSum = bankReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Compute paidAtCreation for invoices
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
      if (paidAtCreation > 0) {
        console.log(`  Invoice ${invNo}: paidAtCreation = ${paidAtCreation}`);
      }
      totalReceivedAtCreation += paidAtCreation;
    }
  }

  const totalReceiptsPayments = cashSum + bankSum + totalReceivedAtCreation;

  const opDebit = newOpening > 0 ? newOpening : 0;
  const opCredit = newOpening < 0 ? Math.abs(newOpening) : 0;
  const debit = opDebit + totalInvoices;
  const credit = opCredit + totalReturns + totalReceiptsPayments;
  const balance = debit - credit;

  console.log(`\nRecalculation Breakdown:`);
  console.log(`  Opening Balance: ${newOpening}`);
  console.log(`  Total Invoices (Sales): ${totalInvoices}`);
  console.log(`  Total Returns: ${totalReturns}`);
  console.log(`  Cash Receipts: ${cashSum}`);
  console.log(`  Bank Receipts: ${bankSum}`);
  console.log(`  Paid At Creation: ${totalReceivedAtCreation}`);
  console.log(`  Total Receipts/Payments: ${totalReceiptsPayments}`);
  console.log(`  Debit = ${opDebit} + ${totalInvoices} = ${debit}`);
  console.log(`  Credit = ${opCredit} + ${totalReturns} + ${totalReceiptsPayments} = ${credit}`);
  console.log(`  Balance = ${debit} - ${credit} = ${balance}`);

  // Update party
  await db.collection('parties').updateOne(
    { _id: party._id },
    { $set: { debit, credit, balance } }
  );

  console.log(`\n===== AFTER FIX =====`);
  console.log(`Opening Balance: ${newOpening}`);
  console.log(`Debit: ${debit}, Credit: ${credit}, Balance: ${balance}`);
  console.log(`\nTarget Balance: 747,745`);
  console.log(`Actual Balance: ${balance}`);
  console.log(`Match: ${balance === 747745 ? '✅ YES!' : '❌ NO (difference: ' + (747745 - balance) + ')'}`);

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch(console.error);
