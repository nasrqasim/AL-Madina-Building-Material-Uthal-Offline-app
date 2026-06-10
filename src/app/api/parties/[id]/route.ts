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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const row = await Party.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Party not found", 404);
    
    // Automatically recalculate the balance using the updated openingBalance
    await recalculatePartyBalance(params.id);
    
    // Fetch the updated row to return it
    const updatedRow = await Party.findById(params.id).lean();
    return ok(updatedRow);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const row = await Party.findByIdAndDelete(params.id);
    if (!row) return fail("Party not found", 404);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
