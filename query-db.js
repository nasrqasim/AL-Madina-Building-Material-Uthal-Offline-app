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

  const parties = await Party.find({ name: { $regex: /Al Hadid|Max/i } }).lean();
  console.log("--- PARTIES FOUND ---");
  for (const p of parties) {
    console.log(`ID: ${p._id}, Name: ${p.name}, Type: ${p.type}, Opening: ${p.openingBalance}, Debit: ${p.debit}, Credit: ${p.credit}, Balance: ${p.balance}`);
    
    console.log("  -- Invoices --");
    const invs = await Invoice.find({ partyId: p._id }).lean();
    for (const inv of invs) {
      console.log(`    InvNo: ${inv.invoiceNo}, Type: ${inv.type}, Total: ${inv.totalAmount}, Recv: ${inv.amountReceived}, Status: ${inv.status}, Date: ${inv.date}`);
    }

    if (p.type === 'Customer') {
      console.log("  -- Cash Receipts --");
      const crs = await CashReceipt.find({ partyId: p._id }).lean();
      for (const cr of crs) {
        console.log(`    CRNo: ${cr.receiptNumber}, Amt: ${cr.amount}, Status: ${cr.status}, Date: ${cr.date}, Ref: ${cr.reference}, Nar: ${cr.narration}`);
      }

      console.log("  -- Bank Receipts --");
      const brs = await BankReceipt.find({ $or: [{ party: p._id }, { party: String(p._id) }] }).lean();
      for (const br of brs) {
        console.log(`    BRNo: ${br.receiptNumber}, Amt: ${br.amount}, Status: ${br.status}, Date: ${br.date}, Inst: ${br.instrumentNo}`);
      }
    } else {
      console.log("  -- Cash Payments --");
      const cps = await CashPayment.find({ $or: [{ partyId: p._id }, { vendor: p._id }] }).lean();
      for (const cp of cps) {
        console.log(`    CPNo: ${cp.voucherNo}, Amt: ${cp.amount}, Status: ${cp.status}, Date: ${cp.date}`);
      }

      console.log("  -- Bank Payments --");
      const bps = await BankPayment.find({ vendor: p._id }).lean();
      for (const bp of bps) {
        console.log(`    BPNo: ${bp.voucherNo}, Amt: ${bp.amount}, Status: ${bp.status}, Date: ${bp.date}`);
      }
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
