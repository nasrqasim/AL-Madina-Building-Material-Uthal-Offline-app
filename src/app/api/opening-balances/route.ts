import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "Item" or "Account"

    // Get opening balances from settings
    const allSettings = await offlineDB.settings.toArray();
    const openingBalances = allSettings.filter((s: any) => s.key === "openingBalance");
    const rows = openingBalances.map((s: any) => s.value);

    // Filter by type if specified
    const filteredRows = type ? rows.filter((r: any) => r.type === type) : rows;

    // If we have no opening balance records yet, populate from Items/Accounts
    if (filteredRows.length === 0) {
        if (type === "Item") {
            const items = await offlineDB.items.toArray();
            return ok((items || []).map((i: any) => ({
                type: "Item",
                itemId: i.id,
                itemName: i.name,
                unit: i.unit || "Ctn",
                qty: i.stockQtyCartons || 0,
                rate: i.purchaseRate || 0
            })));
        }
        if (type === "Account") {
            const accounts = await offlineDB.accounts.toArray();
            return ok((accounts || []).map((a: any) => ({
                type: "Account",
                accountId: a.id,
                accountName: a.title,
                balanceType: "Debit",
                amount: a.openingBalance || 0
            })));
        }
    }

    return ok(filteredRows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      for (const entry of body) {
        // Store in settings
        const id = generateUniqueId();
        await offlineDB.settings.add({
          id,
          key: "openingBalance",
          value: { ...entry, posted: true },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);

        // Sync with actual models
        if (entry.type === "Item" && entry.itemId) {
          await offlineDB.items.update(entry.itemId, {
            stockQtyCartons: entry.qty,
            purchaseRate: entry.rate
          });
        } else if (entry.type === "Account" && entry.accountId) {
          await offlineDB.accounts.update(entry.accountId, {
            openingBalance: entry.amount
          });
        }
      }
      return ok({ message: "Balances posted and synced successfully" });
    }

    const id = generateUniqueId();
    const row = {
      id,
      key: "openingBalance",
      value: body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await offlineDB.settings.add(row as any);
    return ok(row.value, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const allSettings = await offlineDB.settings.toArray();
    const openingBalances = allSettings.filter((s: any) => s.key === "openingBalance");

    for (const ob of openingBalances) {
      if (!type || (ob.value as any).type === type) {
        await offlineDB.settings.delete(ob.id);
      }
    }

    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
