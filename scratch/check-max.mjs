import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
  const CashReceipt = mongoose.model('CashReceipt', new mongoose.Schema({}, { strict: false }));
  const BankReceipt = mongoose.model('BankReceipt', new mongoose.Schema({}, { strict: false }));
  const CashPayment = mongoose.model('CashPayment', new mongoose.Schema({}, { strict: false }));
  const BankPayment = mongoose.model('BankPayment', new mongoose.Schema({}, { strict: false }));

  const p = await Party.findOne({ name: { $regex: /Max/i } }).lean();
  if (!p) {
    console.log("Party Max Customers not found!");
    return;
  }
  
  console.log(`\n================ MAX CUSTOMERS PARTY DETAILS ================`);
  console.log(`ID: ${p._id}`);
  console.log(`Name: ${p.name}`);
  console.log(`Code: ${p.code}`);
  console.log(`Opening Balance: ${p.openingBalance}`);
  console.log(`DB Debit: ${p.debit}`);
  console.log(`DB Credit: ${p.credit}`);
  console.log(`DB Balance: ${p.balance}`);

  const invoices = await Invoice.find({ partyId: p._id, status: { $ne: "cancelled" } }).lean();
  console.log(`\n--- INVOICES (${invoices.length}) ---`);
  let totalInvs = 0;
  for (const inv of invoices) {
    console.log(`  InvNo: ${inv.invoiceNo}, Type: ${inv.type}, Total: ${inv.totalAmount}, Recv: ${inv.amountReceived}, Status: ${inv.status}, Date: ${inv.date}`);
    totalInvs += Number(inv.totalAmount) || 0;
  }
  console.log(`Total Invoices Sum: ${totalInvs}`);

  const cashReceipts = await CashReceipt.find({ partyId: p._id, status: { $ne: "Cancelled" } }).lean();
  console.log(`\n--- CASH RECEIPTS (${cashReceipts.length}) ---`);
  let totalCRs = 0;
  for (const cr of cashReceipts) {
    console.log(`  CRNo: ${cr.receiptNumber}, Amt: ${cr.amount}, Status: ${cr.status}, Date: ${cr.date}, Ref: ${cr.reference}, Nar: ${cr.narration}`);
    totalCRs += Number(cr.amount) || 0;
  }
  console.log(`Total Cash Receipts Sum: ${totalCRs}`);

  const bankReceipts = await BankReceipt.find({
    $or: [{ party: p._id }, { party: String(p._id) }],
    status: { $ne: "Cancelled" }
  }).lean();
  console.log(`\n--- BANK RECEIPTS (${bankReceipts.length}) ---`);
  let totalBRs = 0;
  for (const br of bankReceipts) {
    console.log(`  BRNo: ${br.receiptNumber}, Amt: ${br.amount}, Status: ${br.status}, Date: ${br.date}, Inst: ${br.instrumentNo}`);
    totalBRs += Number(br.amount) || 0;
  }
  console.log(`Total Bank Receipts Sum: ${totalBRs}`);

  const cashPayments = await CashPayment.find({
    $or: [{ partyId: p._id }, { vendor: p._id }],
    status: { $ne: "Cancelled" }
  }).lean();
  console.log(`\n--- CASH PAYMENTS (${cashPayments.length}) ---`);
  let totalCPs = 0;
  for (const cp of cashPayments) {
    console.log(`  CPNo: ${cp.voucherNo}, Amt: ${cp.amount}, Status: ${cp.status}, Date: ${cp.date}, Ref: ${cp.reference}, Nar: ${cp.narration}`);
    totalCPs += Number(cp.amount) || 0;
  }
  console.log(`Total Cash Payments Sum: ${totalCPs}`);

  const bankPayments = await BankPayment.find({ vendor: p._id, status: { $ne: "Cancelled" } }).lean();
  console.log(`\n--- BANK PAYMENTS (${bankPayments.length}) ---`);
  let totalBPs = 0;
  for (const bp of bankPayments) {
    console.log(`  BPNo: ${bp.voucherNo}, Amt: ${bp.amount}, Status: ${bp.status}, Date: ${bp.date}`);
    totalBPs += Number(bp.amount) || 0;
  }
  console.log(`Total Bank Payments Sum: ${totalBPs}`);

  // Trace recalculation
  console.log(`\n--- TRACING RECALCULATE LOGIC ---`);
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
        console.log(`  Invoice ${invNo} has paidAtCreation = ${paidAtCreation} (amountReceived: ${inv.amountReceived}, linkedCash: ${linkedCashAmt}, linkedBank: ${linkedBankAmt})`);
      }
      totalReceivedAtCreation += paidAtCreation;
    }
  }
  console.log(`Total Received At Creation: ${totalReceivedAtCreation}`);
  
  const finalDebit = totalInvs + (totalCPs + totalBPs);
  const finalCredit = totalCRs + totalBRs + totalReceivedAtCreation;
  const finalBalance = Number(p.openingBalance) + finalDebit - finalCredit;
  console.log(`Calculated Debit: ${finalDebit}`);
  console.log(`Calculated Credit: ${finalCredit}`);
  console.log(`Calculated Balance: ${finalBalance}`);

  await mongoose.disconnect();
}

main().catch(console.error);
