import { NextResponse } from "next/server";
import { createDatabaseBackup, checkDatabaseHealth, optimizeDatabase } from "@/lib/backupService";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type === "auto" ? "auto" : "manual";
    const result = await createDatabaseBackup(type);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const health = checkDatabaseHealth();
    return NextResponse.json({ ok: true, data: health });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
