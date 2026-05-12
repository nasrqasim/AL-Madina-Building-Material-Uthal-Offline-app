import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { InventorySetting } from "@/models/InventorySetting";

export async function GET() {
  try {
    await dbConnect();
    let setting = await InventorySetting.findOne({});
    if (!setting) {
      setting = await InventorySetting.create({});
    }
    return ok(setting);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    
    const updatedSetting = await InventorySetting.findOneAndUpdate(
      {},
      { ...body },
      { upsert: true, new: true }
    );

    return ok(updatedSetting);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
