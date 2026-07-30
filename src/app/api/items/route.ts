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
    
    // Pass all fields from body, add defaults for id, code, timestamps
    const itemRecord = {
      ...body,
      id,
      code: body.code || `ITEM-${Date.now().toString().slice(-6)}`,
      name: body.name || "",
      status: body.status || "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Remove _id if present (MongoDB artifact, not needed in SQLite)
    delete itemRecord._id;

    await offlineDB.items.add(itemRecord);
    return ok({ ...itemRecord, _id: id }, 201);
  } catch (e) {
    console.error("API Error [items POST]:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
