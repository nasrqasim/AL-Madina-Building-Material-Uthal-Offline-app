import mongoose from 'mongoose';
import fs from 'fs';

// Connection String from .env.local
const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function run() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const db = mongoose.connection.db;

    // 1. COMPLETE DATABASE CLEANUP
    const collectionsToDrop = [
        "invoices",
        "cashreceipts",
        "bankreceipts",
        "cashpayments",
        "bankpayments",
        "journalentries",
        "journals",
        "payrolls",
        "salaryadvances",
        "salaryloans",
        "salarysettlements",
        "parties",
        "employees",
        "banks",
        "jobs",
        "openingbalances",
        "vehiclelogs",
        "regions",
        "locations",
        "financialyears",
        "financialtransactions" // Just in case it exists
    ];

    console.log("Cleaning up transactional and master data...");
    for (const coll of collectionsToDrop) {
        try {
            const count = await db.collection(coll).countDocuments();
            if (count > 0) {
                await db.collection(coll).deleteMany({});
                console.log(`Deleted ${count} documents from ${coll}`);
            }
        } catch (e) {
            console.log(`Collection ${coll} might not exist, skipping.`);
        }
    }

    // Clear existing Items and Categories to start fresh with PDF data
    console.log("Clearing existing Items and Categories...");
    await db.collection("items").deleteMany({});
    await db.collection("categories").deleteMany({});

    console.log("Database reset complete.");

    // 2. IMPORT PRODUCT DATA FROM PDF ANALYSIS
    console.log("Starting import from PDF analysis...");
    const pdfAnalysis = JSON.parse(fs.readFileSync('d:/oilshop/oilshop/pdf_analysis.json', 'utf8'));

    const categoriesMap = new Map(); // code -> _id
    const mainCats = [];
    const subCats = [];
    const items = [];

    // First pass: Identify all entities and hierarchy
    pdfAnalysis.forEach(line => {
        if (!line.texts || line.texts.length < 2) return;
        
        const code = line.texts[0].t;
        const name = line.texts[1].t;

        if (!code || isNaN(code)) return;

        if (code.length <= 2) {
            mainCats.push({ code, name });
        } else if (code.length >= 3 && code.length <= 4) {
            subCats.push({ code, name });
        } else if (code.length >= 7) {
            items.push({ code, name });
        }
    });

    console.log(`Found ${mainCats.length} Main Categories, ${subCats.length} Sub Categories, and ${items.length} Items.`);

    // Insert Main Categories
    for (const cat of mainCats) {
        const res = await db.collection("categories").insertOne({
            name: cat.name,
            code: cat.code,
            type: "main",
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        categoriesMap.set(cat.code, res.insertedId);
    }
    console.log("Inserted Main Categories.");

    // Insert Sub Categories
    const mainCatsSorted = [...mainCats].sort((a, b) => b.code.length - a.code.length);
    for (const cat of subCats) {
        let parentId = null;
        for (const mCat of mainCatsSorted) {
            if (cat.code.startsWith(mCat.code)) {
                parentId = categoriesMap.get(mCat.code);
                break;
            }
        }

        const res = await db.collection("categories").insertOne({
            name: cat.name,
            code: cat.code,
            type: "sub",
            parentId: parentId,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        categoriesMap.set(cat.code, res.insertedId);
    }
    console.log("Inserted Sub Categories.");

    // Insert Items
    const itemsToInsert = [];
    for (const item of items) {
        let mainCatId = null;
        let subCatId = null;

        const subCode3 = item.code.substring(0, 3);
        const subCode4 = item.code.substring(0, 4);
        
        if (categoriesMap.has(subCode4)) {
            subCatId = categoriesMap.get(subCode4);
        } else if (categoriesMap.has(subCode3)) {
            subCatId = categoriesMap.get(subCode3);
        }

        if (subCatId) {
            const sub = subCats.find(c => categoriesMap.get(c.code).toString() === subCatId.toString());
            // We need the parent from the DB or our map
            // Since we inserted subcats already, we can look up their parent in categoriesMap
            // Wait, I didn't store subcat objects, just IDs.
            // Let's just find the main cat by prefix again for simplicity
            const mainCode1 = item.code.substring(0, 1);
            const mainCode2 = item.code.substring(0, 2);
            if (categoriesMap.has(mainCode2)) mainCatId = categoriesMap.get(mainCode2);
            else if (categoriesMap.has(mainCode1)) mainCatId = categoriesMap.get(mainCode1);
        } else {
            const mainCode1 = item.code.substring(0, 1);
            const mainCode2 = item.code.substring(0, 2);
            if (categoriesMap.has(mainCode2)) mainCatId = categoriesMap.get(mainCode2);
            else if (categoriesMap.has(mainCode1)) mainCatId = categoriesMap.get(mainCode1);
        }

        let liters = 0;
        let gallons = 0;
        const litersMatch = item.name.match(/(\d+)\s*L/i);
        if (litersMatch) liters = parseFloat(litersMatch[1]);
        const gallonsMatch = item.name.match(/(\d+)\s*G/i);
        if (gallonsMatch) gallons = parseFloat(gallonsMatch[1]);

        itemsToInsert.push({
            code: item.code,
            name: item.name,
            mainCategoryId: mainCatId,
            subCategoryId: subCatId,
            litersInCtn: liters,
            gallonsInCtn: gallons,
            purchaseRate: 0,
            wholesaleRate: 0,
            retailRate: 0,
            stockQtyCartons: 0,
            reorderLevel: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    
    if (itemsToInsert.length > 0) {
        await db.collection("items").insertMany(itemsToInsert);
    }
    console.log(`Inserted ${itemsToInsert.length} Items.`);

    console.log("All done! ERP is now reset and imported.");
    process.exit(0);
}

run().catch(console.error);
