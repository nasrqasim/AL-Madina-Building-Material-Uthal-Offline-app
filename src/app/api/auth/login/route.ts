import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sqliteDB } from "@/lib/sqlite";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "Please enter username and password" }, { status: 400 });
    }

    const inputLower = String(username).trim().toLowerCase();
    let user = await sqliteDB.users.where("username").equalsIgnoreCase(inputLower).first();
    if (!user) {
      user = await sqliteDB.users.where("email").equalsIgnoreCase(inputLower).first();
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid username or password" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ ok: false, error: "User account is suspended" }, { status: 403 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ ok: false, error: "Invalid username or password" }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      financialYear: user.financialYear,
    };

    return NextResponse.json({ ok: true, user: sessionUser });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
