import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const rows = await offlineDB.items.toArray();
  // Sort by createdAt descending
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Creating item with body:", body);
    
    const id = generateUniqueId();
    
    const itemRecord = {
      id,
      _id: id,
      code: body.code || `ITEM-${Date.now().toString().slice(-6)}`,
      name: body.name || "",
      mainCategoryId: body.mainCategoryId || null,
      subCategoryId: body.subCategoryId || null,
      brandId: body.brandId || null,
      unit: body.unit || "",
      purchaseRate: body.purchaseRate || 0,
      wholesaleRate: body.wholesaleRate || 0,
      retailRate: body.retailRate || 0,
      stockQtyCartons: body.stockQtyCartons || 0,
      stockQty: body.stockQty || 0,
      reorderLevel: body.reorderLevel || 10,
      status: body.status || "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.items.add(itemRecord);
    return ok(itemRecord, 201);
  } catch (e) {
    console.error("API Error [items POST]:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
