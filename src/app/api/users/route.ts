import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({}).sort({ createdAt: -1 }).select("-password");
    return ok(users);
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

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return fail("Email or Username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      role,
      financialYear,
      isActive: true
    });

    const { password: _, ...userWithoutPassword } = newUser.toObject();
    return ok(userWithoutPassword);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
