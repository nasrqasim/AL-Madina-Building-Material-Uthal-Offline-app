import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  try {
    const allSettings = await offlineDB.settings.toArray();
    const settings = allSettings.filter((s: any) => s.key === "documentSettings");

    // Default settings if none exist
    if (settings.length === 0) {
      const defaults = [
        { type: "Sale Invoice", prefix: "INV-", nextNo: 1, padding: 3 },
        { type: "Purchase Order", prefix: "PO-", nextNo: 1, padding: 4 },
        { type: "Quotation", prefix: "QT-", nextNo: 1, padding: 3 },
        { type: "Cash Receipt", prefix: "CR-", nextNo: 1, padding: 5 },
        { type: "GRN", prefix: "GRN-", nextNo: 1, padding: 4 },
      ];
      for (const def of defaults) {
        const id = generateUniqueId();
        const newSetting = {
          id,
          key: "documentSettings",
          value: def,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await offlineDB.settings.add(newSetting as any);
      }
      return ok(defaults);
    }

    return ok(settings.map((s: any) => s.value));
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { settings } = body;

    if (!Array.isArray(settings)) return fail("Invalid data format");

    const allSettings = await offlineDB.settings.toArray();
    const existingSettings = allSettings.filter((s: any) => s.key === "documentSettings");

    // Delete existing document settings
    for (const es of existingSettings) {
      await offlineDB.settings.delete(es.id);
    }

    // Add new settings
    for (const s of settings) {
      const id = generateUniqueId();
      const newSetting = {
        id,
        key: "documentSettings",
        value: s,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await offlineDB.settings.add(newSetting as any);
    }

    return ok({ message: "Settings saved successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
