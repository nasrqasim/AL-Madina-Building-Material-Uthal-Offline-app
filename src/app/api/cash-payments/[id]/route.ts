import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashPayment from "@/models/CashPayment";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();

    const amount = Number(body.amount ?? body.totalAmount) || 0;
    const whtAmount = Number(body.whtAmount) || 0;
    const partyId = body.partyId || body.vendorId || null;

    const payload = {
      ...body,
      partyId,
      vendor: partyId ? String(partyId) : "",
      amount,
      whtAmount,
      netPaid: amount - whtAmount,
    };

    const row = await CashPayment.findByIdAndUpdate(params.id, { $set: payload }, { new: true });
    if (!row) return fail("Not found", 404);

    if (partyId) await recalculatePartyBalance(String(partyId));

    const populated = await CashPayment.findById(params.id)
      .populate("partyId", "name companyName type")
      .populate("cashAccountId", "title code")
      .lean();

    return ok(populated ?? row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const row = await CashPayment.findById(params.id);
    const partyId = row?.partyId?.toString() || row?.vendor;
    await CashPayment.findByIdAndDelete(params.id);
    if (partyId) await recalculatePartyBalance(partyId);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
