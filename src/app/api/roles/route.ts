import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  try {
    const allSettings = await offlineDB.settings.toArray();
    const roles = allSettings.filter((s: any) => s.key === "role");
    // Sort by createdAt ascending
    roles.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return ok(roles.map((s: any) => s.value));
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name) return fail("Role name is required");

    const allSettings = await offlineDB.settings.toArray();
    const existingRoles = allSettings.filter((s: any) => s.key === "role");
    const existingRole = existingRoles.find((s: any) => s.value.name === name);
    if (existingRole) return fail("Role name already exists");

    const id = generateUniqueId();
    const newRole = {
      id,
      key: "role",
      value: {
        name,
        description: description || "",
        permissions: permissions || [],
        userCount: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.settings.add(newRole as any);
    return ok(newRole.value);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
