import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const hashed = await bcrypt.hash(body.password, 10);
    const id = generateUniqueId();
    const user = {
      id,
      _id: id,
      name: body.username,
      email: body.email || `${body.username}@local`,
      username: body.username,
      password: hashed,
      role: body.role ?? "admin",
      financialYear: body.financialYear ?? "2025-2026",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await offlineDB.users.add(user as any);
    const { password, ...userWithoutPassword } = user;
    return ok(userWithoutPassword, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}
