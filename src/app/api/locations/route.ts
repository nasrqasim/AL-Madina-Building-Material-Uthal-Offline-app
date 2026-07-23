import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const rows = await offlineDB.locations.toArray();
  // Sort by createdAt descending
  rows.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.isDefault) {
      const allLocations = await offlineDB.locations.toArray();
      for (const loc of allLocations) {
        await offlineDB.locations.update(loc.id, { isDefault: false });
      }
    }
    
    const id = generateUniqueId();
    const locationRecord = {
      id,
      _id: id,
      name: body.name || "",
      address: body.address || "",
      isDefault: body.isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await offlineDB.locations.add(locationRecord);
    return ok(locationRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
