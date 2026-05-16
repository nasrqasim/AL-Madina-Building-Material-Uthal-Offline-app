import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";
const DB_NAME = "pos_system_db";

async function main() {
    console.log("Starting ERP Handover Reset Process...");
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        console.log("✓ Connected to MongoDB Atlas");
        const db = client.db(DB_NAME);

        // 1. COLLECTIONS TO COMPLETELY CLEAR (Transactional and Demo Data)
        const collectionsToClear = [
            'invoices',
            'sales',
            'purchases',
            'purchaseorders',
            'saleorders',
            'cashreceipts',
            'bankreceipts',
            'cashpayments',
            'bankpayments',
            'journalentries',
            'journals',
            'payrolls',
            'salaryadvances',
            'salaryloans',
            'salarysettlements',
            'parties',
            'customers',
            'vendors',
            'employees',
            'banks',
            'jobs',
            'ledgers',
            'transactions',
            'stocklogs',
            'systemlogs',
            'productserials',
            'barcodes',
            'expenses',
            'openingbalances',
            'vehiclelogs',
            'inventorytransactions',
            'stocktransfers',
            'products', // Extra/Old
        ];

        console.log("Cleaning database collections...");
        for (const colName of collectionsToClear) {
            try {
                const count = await db.collection(colName).countDocuments();
                if (count > 0) {
                    await db.collection(colName).deleteMany({});
                    console.log(`  - Cleared ${colName}: ${count} records removed`);
                }
            } catch (err) {
                // Skip if collection doesn't exist
            }
        }

        // 2. RESET ACCOUNT BALANCES (Chart of Accounts remains, but balances go to zero)
        const accResult = await db.collection('accounts').updateMany({}, { $set: { openingBalance: 0 } });
        console.log(`✓ Reset ${accResult.modifiedCount} account opening balances to 0`);

        // 3. CLEAR CATEGORIES AND ITEMS (To ensure fresh import from PDF)
        await db.collection('categories').deleteMany({});
        await db.collection('items').deleteMany({});
        console.log("✓ Cleared categories and items for fresh import");

        // 4. PARSE PDF ANALYSIS JSON AND IMPORT
        if (!fs.existsSync('d:/oilshop/oilshop/pdf_analysis.json')) {
            throw new Error("pdf_analysis.json not found! Please run analyze-pdf.js first.");
        }

        const pdfData = JSON.parse(fs.readFileSync('d:/oilshop/oilshop/pdf_analysis.json', 'utf8'));
        
        let mainCategories = [];
        let subCategories = [];
        let items = [];

        let currentMainCat = null;
        let currentSubCat = null;

        // Sort by page and y to preserve hierarchy
        pdfData.sort((a, b) => {
            if (a.page !== b.page) return a.page - b.page;
            return a.y - b.y;
        });

        console.log("Parsing inventory data from PDF analysis...");
        for (const line of pdfData) {
            const texts = line.texts;
            if (texts.length < 2) continue;

            const code = texts[0].t.trim();
            const name = texts[1].t.trim();

            // Filter out noise
            if (name === "AL HADEED TRADERS" || name === "Chart of Inventory Items" || name.includes("Total Number of Items")) continue;
            if (code === "Date" || code === "Page" || isNaN(parseInt(code))) continue;

            if (code.length <= 2) {
                // Main Category (e.g., 1, 2, 10)
                currentMainCat = {
                    _id: new ObjectId(),
                    name: name,
                    code: code,
                    type: 'main',
                    parentId: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                mainCategories.push(currentMainCat);
                currentSubCat = null;
            } else if (code.length === 3 || code.length === 4) {
                // Sub Category (e.g., 101, 1001)
                currentSubCat = {
                    _id: new ObjectId(),
                    name: name,
                    code: code,
                    type: 'sub',
                    parentId: currentMainCat ? currentMainCat._id : null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                subCategories.push(currentSubCat);
            } else if (code.length >= 7) {
                // Item (e.g., 1010001, 10010001)
                items.push({
                    code: code,
                    name: name,
                    mainCategoryId: currentMainCat ? currentMainCat._id : null,
                    subCategoryId: currentSubCat ? currentSubCat._id : null,
                    litersInCtn: 16, 
                    gallonsInCtn: 4,  
                    purchaseRate: 0,
                    wholesaleRate: 0,
                    retailRate: 0,
                    stockQtyCartons: 0,
                    reorderLevel: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        if (mainCategories.length > 0) {
            await db.collection('categories').insertMany(mainCategories);
            console.log(`✓ Imported ${mainCategories.length} main categories`);
        }
        if (subCategories.length > 0) {
            await db.collection('categories').insertMany(subCategories);
            console.log(`✓ Imported ${subCategories.length} sub categories`);
        }
        if (items.length > 0) {
            await db.collection('items').insertMany(items);
            console.log(`✓ Imported ${items.length} items`);
        }

        console.log("\n====================================================");
        console.log("ERP HANDOVER PREPARATION COMPLETED SUCCESSFULLY!");
        console.log("====================================================");
        console.log("Database is now clean and ready for client handover.");
        console.log("Only the Product Catalog from the PDF has been preserved.");

    } catch (error) {
        console.error("CRITICAL ERROR during handover preparation:", error);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
