import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { postSaleReturn } from "@/services/posting/salesPosting";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await postSaleReturn(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
