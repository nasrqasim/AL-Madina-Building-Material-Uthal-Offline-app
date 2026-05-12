import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import ShopProfile from "@/models/ShopProfile";

export async function GET() {
  await dbConnect();
  const profile = await ShopProfile.findOne().lean();
  return ok(profile);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    let profile = await ShopProfile.findOne();
    if (!profile) profile = await ShopProfile.create(body);
    else {
      profile.set(body);
      await profile.save();
    }
    return ok(profile);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
