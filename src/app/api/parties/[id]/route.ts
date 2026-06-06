import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Party from "@/models/Party";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const refresh = url.searchParams.get("refresh") === "1";

    if (refresh) {
      await recalculatePartyBalance(params.id);
    }

    const row = await Party.findById(params.id).lean();
    if (!row) return fail("Party not found", 404);
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
