import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    const allSettings = await offlineDB.settings.toArray();
    let filtered = allSettings;
    if (key) {
      filtered = allSettings.filter((s: any) => s.key === key);
    }
    filtered.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return ok(filtered);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;
    if (!key) return fail("Key is required");

    const record = {
      id: body.id || String(Date.now()),
      key,
      value: value || body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await offlineDB.settings.add(record as any);
    return ok(record, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
