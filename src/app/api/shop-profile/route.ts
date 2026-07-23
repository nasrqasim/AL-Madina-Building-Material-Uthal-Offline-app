import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { DEFAULT_COMPANY_FORM } from "@/lib/company";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  const profiles = await offlineDB.shopProfiles.toArray();
  const profile = profiles.length > 0 ? profiles[0] : null;
  return ok(profile ?? DEFAULT_COMPANY_FORM);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profiles = await offlineDB.shopProfiles.toArray();
    let profile;

    if (profiles.length === 0) {
      const id = generateUniqueId();
      profile = {
        id,
        _id: id,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await offlineDB.shopProfiles.add(profile);
    } else {
      const existingProfile = profiles[0];
      const updatedProfile = {
        ...body,
        updatedAt: new Date().toISOString()
      };
      await offlineDB.shopProfiles.update(existingProfile.id, updatedProfile);
      profile = await offlineDB.shopProfiles.get(existingProfile.id);
    }

    return ok(profile);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
