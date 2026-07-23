import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const formatName = searchParams.get("formatName");

    if (formatName) {
      const allSettings = await offlineDB.settings.toArray();
      let format = allSettings.find((s: any) => s.key === `printFormat_${formatName}`);
      if (!format) {
        // Create default if not found
        const id = generateUniqueId();
        const newFormat = {
          id,
          key: `printFormat_${formatName}`,
          value: { formatName },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await offlineDB.settings.add(newFormat as any);
        format = newFormat;
      }
      return ok((format as any).value);
    }

    const allSettings = await offlineDB.settings.toArray();
    const allFormats = allSettings.filter((s: any) => s.key.startsWith("printFormat_"));
    return ok(allFormats.map((s: any) => s.value));
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formatName, ...config } = body;

    if (!formatName) return fail("Format name is required");

    const allSettings = await offlineDB.settings.toArray();
    const existingFormat = allSettings.find((s: any) => s.key === `printFormat_${formatName}`);

    if (existingFormat) {
      const updatedFormat = {
        ...config,
        updatedAt: new Date().toISOString()
      };
      await offlineDB.settings.update(existingFormat.id, { value: updatedFormat });
      const updated = await offlineDB.settings.get(existingFormat.id);
      return ok((updated as any).value);
    } else {
      const id = generateUniqueId();
      const newFormat = {
        id,
        key: `printFormat_${formatName}`,
        value: { formatName, ...config },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await offlineDB.settings.add(newFormat as any);
      return ok(newFormat.value);
    }
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
