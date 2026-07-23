import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const rows = await offlineDB.categories.toArray();
  // Sort by createdAt descending
  rows.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Creating category with body:", body);

    const id = generateUniqueId();
    const categoryRecord = {
      id,
      _id: id,
      name: body.name || "",
      code: body.code || "",
      type: body.type || "main",
      parentId: body.parentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.categories.add(categoryRecord);
    return ok(categoryRecord, 201);
  } catch (e) {
    console.error("API Error [categories POST]:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
