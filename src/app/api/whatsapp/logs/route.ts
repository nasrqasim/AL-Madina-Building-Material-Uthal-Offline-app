import { NextResponse } from "next/server";
import MessageLog from "@/models/MessageLog";
import connectDB from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    const logs = await MessageLog.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ ok: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
