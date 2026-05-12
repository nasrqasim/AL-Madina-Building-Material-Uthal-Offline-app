import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { PrintFormat } from "@/models/PrintFormat";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const formatName = searchParams.get("formatName");

    await dbConnect();
    
    if (formatName) {
      let format = await PrintFormat.findOne({ formatName });
      if (!format) {
        // Create default if not found
        format = await PrintFormat.create({ formatName });
      }
      return ok(format);
    }

    const allFormats = await PrintFormat.find({});
    return ok(allFormats);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formatName, ...config } = body;

    if (!formatName) return fail("Format name is required");

    await dbConnect();
    
    const updatedFormat = await PrintFormat.findOneAndUpdate(
      { formatName },
      { ...config },
      { upsert: true, new: true }
    );

    return ok(updatedFormat);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
