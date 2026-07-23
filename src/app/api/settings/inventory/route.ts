import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  try {
    const allSettings = await offlineDB.settings.toArray();
    let setting = allSettings.find((s: any) => s.key === "inventorySettings");
    if (!setting) {
      const id = generateUniqueId();
      const newSetting = {
        id,
        key: "inventorySettings",
        value: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await offlineDB.settings.add(newSetting as any);
      setting = newSetting;
    }
    return ok((setting as any).value);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const allSettings = await offlineDB.settings.toArray();
    const existingSetting = allSettings.find((s: any) => s.key === "inventorySettings");

    if (existingSetting) {
      const updatedSetting = {
        ...body,
        updatedAt: new Date().toISOString()
      };
      await offlineDB.settings.update(existingSetting.id, { value: updatedSetting });
      const updated = await offlineDB.settings.get(existingSetting.id);
      return ok((updated as any).value);
    } else {
      const id = generateUniqueId();
      const newSetting = {
        id,
        key: "inventorySettings",
        value: body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await offlineDB.settings.add(newSetting as any);
      return ok(newSetting.value);
    }
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
