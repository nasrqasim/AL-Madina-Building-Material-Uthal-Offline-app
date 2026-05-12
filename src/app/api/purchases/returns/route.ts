import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { postPurchaseReturn } from "@/services/posting/purchasePosting";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await postPurchaseReturn(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
