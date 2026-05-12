import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import OpeningBalance from "@/models/OpeningBalance";
import Item from "@/models/Item";
import Account from "@/models/Account";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "Item" or "Account"
    const query = type ? { type } : {};
    
    // If we have no opening balance records yet, we might want to populate from Items/Accounts
    const rows = await OpeningBalance.find(query).sort({ createdAt: -1 }).lean();
    
    if (rows.length === 0) {
        if (type === "Item") {
            const items = await Item.find().lean();
            return ok(items.map(i => ({ 
                type: "Item", 
                itemId: i._id, 
                itemName: i.name, 
                unit: i.unit || "Ctn", 
                qty: i.stockQtyCartons || 0, 
                rate: i.purchaseRate || 0 
            })));
        }
        if (type === "Account") {
            const accounts = await Account.find().lean();
            return ok(accounts.map(a => ({ 
                type: "Account", 
                accountId: a._id, 
                accountName: a.title, 
                balanceType: "Debit", 
                amount: a.openingBalance || 0 
            })));
        }
    }
    
    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    
    if (Array.isArray(body)) {
      for (const entry of body) {
        await OpeningBalance.findOneAndUpdate(
          { type: entry.type, ...(entry.itemId ? { itemId: entry.itemId } : { accountId: entry.accountId }) },
          { ...entry, posted: true },
          { upsert: true }
        );
        
        // Sync with actual models
        if (entry.type === "Item" && entry.itemId) {
          await Item.findByIdAndUpdate(entry.itemId, { 
            stockQtyCartons: entry.qty,
            purchaseRate: entry.rate 
          });
        } else if (entry.type === "Account" && entry.accountId) {
          await Account.findByIdAndUpdate(entry.accountId, { 
            openingBalance: entry.amount 
          });
        }
      }
      return ok({ message: "Balances posted and synced successfully" });
    }
    
    const row = await OpeningBalance.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    await dbConnect();
    await OpeningBalance.deleteMany(type ? { type } : {});
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
