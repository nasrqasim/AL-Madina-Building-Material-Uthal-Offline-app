import mongoose from 'mongoose';

const uri = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB!");

  const targetDate = new Date("2026-06-20");
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const Party = mongoose.model('Party', new mongoose.Schema({}, { strict: false }));
  const JournalEntry = mongoose.model('JournalEntry', new mongoose.Schema({}, { strict: false }));

  const customers = await Party.find({ type: "Customer" }).lean();
  console.log(`Total customers: ${customers.length}`);

  let totalRecOpening = 0;
  let totalRecSales = 0;
  let totalRecReceipts = 0;
  let totalRecCurrent = 0;

  const rows = [];

  for (const c of customers) {
    const initialOpening = Number(c.openingBalance) || 0;
    
    // Transactions before today
    const txBefore = await JournalEntry.aggregate([
      { 
        $match: { 
          partyId: c._id, 
          accountCode: "1100", 
          date: { $lt: startOfDay } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          balance: { $sum: { $subtract: ["$debit", "$credit"] } } 
        } 
      }
    ]);
    const opening = initialOpening + (txBefore[0]?.balance ?? 0);

    // Sales today
    const salesRes = await JournalEntry.aggregate([
      { 
        $match: { 
          partyId: c._id, 
          accountCode: "1100", 
          date: { $gte: startOfDay, $lte: endOfDay } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$debit" } 
        } 
      }
    ]);
    const sales = salesRes[0]?.total ?? 0;

    // Receipts today
    const receiptsRes = await JournalEntry.aggregate([
      { 
        $match: { 
          partyId: c._id, 
          accountCode: "1100", 
          date: { $gte: startOfDay, $lte: endOfDay } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$credit" } 
        } 
      }
    ]);
    const receipts = receiptsRes[0]?.total ?? 0;

    const current = opening + sales - receipts;

    if (opening !== 0 || sales !== 0 || receipts !== 0 || current !== 0) {
      rows.push({
        name: c.name,
        code: c.code,
        opening,
        sales,
        receipts,
        current
      });
      totalRecOpening += opening;
      totalRecSales += sales;
      totalRecReceipts += receipts;
      totalRecCurrent += current;
    }
  }

  // Sort rows by current balance descending
  rows.sort((a, b) => b.current - a.current);

  console.log("\n=== CUSTOMER BALANCES FOR JUN 20, 2026 ===");
  rows.forEach((r, idx) => {
    console.log(`${idx + 1}. Code: ${r.code} | Name: ${r.name.padEnd(30)} | Opening: ${r.opening.toString().padStart(8)} | Sales: ${r.sales.toString().padStart(6)} | Receipts: ${r.receipts.toString().padStart(6)} | Current: ${r.current.toString().padStart(8)}`);
  });

  console.log("\n=== SUM OF CUSTOMER LEDGERS ===");
  console.log(`Total Opening: ${totalRecOpening}`);
  console.log(`Total Sales (Debits): ${totalRecSales}`);
  console.log(`Total Receipts (Credits): ${totalRecReceipts}`);
  console.log(`Total Current Balance: ${totalRecCurrent}`);

  await mongoose.disconnect();
}

main().catch(console.error);
