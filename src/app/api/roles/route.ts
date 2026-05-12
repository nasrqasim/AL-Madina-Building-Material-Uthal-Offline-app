import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { Role } from "@/models/Role";

export async function GET() {
  try {
    await dbConnect();
    const roles = await Role.find({}).sort({ createdAt: 1 });
    return ok(roles);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name) return fail("Role name is required");

    await dbConnect();
    
    const existingRole = await Role.findOne({ name });
    if (existingRole) return fail("Role name already exists");

    const newRole = await Role.create({
      name,
      description: description || "",
      permissions: permissions || [],
      userCount: 0
    });

    return ok(newRole);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
