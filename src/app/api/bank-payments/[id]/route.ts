import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import BankPayment from "@/models/BankPayment";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();
    const oldDoc = await BankPayment.findById(params.id).lean() as any;
    const row = await BankPayment.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) return fail("Not found", 404);
    if (oldDoc?.vendor) await recalculatePartyBalance(String(oldDoc.vendor));
    if (row.vendor && String(row.vendor) !== String(oldDoc?.vendor)) {
      await recalculatePartyBalance(String(row.vendor));
    }
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const oldDoc = await BankPayment.findById(params.id).lean() as any;
    await BankPayment.findByIdAndDelete(params.id);
    if (oldDoc?.vendor) await recalculatePartyBalance(String(oldDoc.vendor));
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
