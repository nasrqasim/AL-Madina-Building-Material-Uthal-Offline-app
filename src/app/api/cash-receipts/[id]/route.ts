import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashReceipt from "@/models/CashReceipt";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const oldDoc = await CashReceipt.findById(params.id).lean() as any;
    const row = await CashReceipt.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Not found", 404);
    if (oldDoc?.party) await recalculatePartyBalance(String(oldDoc.party));
    if (row.party && String(row.party) !== String(oldDoc?.party)) {
      await recalculatePartyBalance(String(row.party));
    }
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const oldDoc = await CashReceipt.findById(params.id).lean() as any;
    await CashReceipt.findByIdAndDelete(params.id);
    if (oldDoc?.party) await recalculatePartyBalance(String(oldDoc.party));
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
