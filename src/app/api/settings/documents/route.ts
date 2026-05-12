import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { DocumentSetting } from "@/models/DocumentSetting";

export async function GET() {
  try {
    await dbConnect();
    const settings = await DocumentSetting.find({});
    
    // Default settings if none exist
    if (settings.length === 0) {
      const defaults = [
        { type: "Sale Invoice", prefix: "INV-", nextNo: 1, padding: 3 },
        { type: "Purchase Order", prefix: "PO-", nextNo: 1, padding: 4 },
        { type: "Quotation", prefix: "QT-", nextNo: 1, padding: 3 },
        { type: "Cash Receipt", prefix: "CR-", nextNo: 1, padding: 5 },
        { type: "GRN", prefix: "GRN-", nextNo: 1, padding: 4 },
      ];
      await DocumentSetting.insertMany(defaults);
      return ok(defaults);
    }
    
    return ok(settings);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { settings } = body;

    if (!Array.isArray(settings)) return fail("Invalid data format");

    await dbConnect();

    for (const s of settings) {
      await DocumentSetting.findOneAndUpdate(
        { type: s.type },
        { prefix: s.prefix, nextNo: s.nextNo, padding: s.padding },
        { upsert: true }
      );
    }

    return ok({ message: "Settings saved successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
