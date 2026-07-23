import { NextResponse } from "next/server";
import { offlineDB } from "@/lib/dexie";

export async function GET() {
  try {
    const allSettings = await offlineDB.settings.toArray();
    const logs = allSettings.filter((s: any) => s.key === "messageLog");
    // Sort by createdAt descending and limit to 100
    logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limitedLogs = logs.slice(0, 100);
    return NextResponse.json({ ok: true, data: limitedLogs.map((s: any) => s.value) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
