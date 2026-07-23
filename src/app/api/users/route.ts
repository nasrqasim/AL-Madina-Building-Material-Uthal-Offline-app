import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await offlineDB.users.toArray();
    // Sort by createdAt descending
    users.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Remove password from response
    const usersWithoutPassword = users.map((u: any) => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    return ok(usersWithoutPassword);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, username, password, role, financialYear } = body;

    if (!name || !email || !username || !password || !role || !financialYear) {
      return fail("Missing required fields");
    }

    // Check if user already exists
    const existingUsers = await offlineDB.users.toArray();
    const existingUser = existingUsers.find(u => u.email === email || u.username === username);

    if (existingUser) {
      return fail("Email or Username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const id = generateUniqueId();
    const newUser = {
      id,
      _id: id,
      name,
      email,
      username,
      password: hashedPassword,
      role,
      financialYear,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.users.add(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    return ok(userWithoutPassword);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
