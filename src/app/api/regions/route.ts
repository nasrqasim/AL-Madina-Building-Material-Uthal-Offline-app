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

    const id = generateUniqueId();
    const regionRecord = {
      id,
      _id: id,
      name: body.name || "",
      code: body.code || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.locations.add(regionRecord);
    return ok(regionRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
