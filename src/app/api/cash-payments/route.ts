import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashPayment from "@/models/CashPayment";
import { recalculatePartyBalance, postCashPaymentJournalEntries } from "@/services/posting/invoicePostingHelper";

export async function GET() {
  await dbConnect();
  const rows = await CashPayment.find()
    .populate("partyId", "name companyName type code phone address city balance debit credit")
    .populate("cashAccountId", "title code type openingBalance")
    .populate("jobId", "title name")
    .sort({ createdAt: -1 })
    .lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();

    if (!body.voucherNo || body.voucherNo === "Auto-generated") {
      let attempt = (await CashPayment.countDocuments()) + 1;
      let isUnique = false;
      while (!isUnique) {
        const candidate = `CPV-${attempt.toString().padStart(5, "0")}`;
        const existing = await CashPayment.findOne({ voucherNo: candidate });
        if (!existing) {
          body.voucherNo = candidate;
          isUnique = true;
        } else attempt++;
      }
    }

    const paymentType = body.paymentType === "petty" ? "petty" : "party";
    let amount = Number(body.amount ?? body.totalAmount) || 0;
    const whtRate = Number(body.whtRate) || 0;
    let whtAmount = Number(body.whtAmount) || 0;

    if (paymentType === "petty" && Array.isArray(body.contraLines) && body.contraLines.length) {
      amount = body.contraLines.reduce((s: number, l: { amount?: number }) => s + (Number(l.amount) || 0), 0);
      whtAmount = (amount * whtRate) / 100;
    }

    const netPaid = amount - whtAmount;
    const partyId = body.partyId || body.vendorId || null;

    const payload = {
      voucherNo: body.voucherNo,
      paymentType,
      date: body.date,
      partyId: partyId || null,
      vendor: partyId ? String(partyId) : "",
      cashAccountId: body.cashAccountId || null,
      cashAccountTitle: body.cashAccountTitle || "",
      reference: body.reference || "",
      narration: body.narration || body.internalNotes || "",
      jobId: body.jobId || null,
      amount,
      whtRate,
      whtAmount,
      netPaid,
      notes: body.notes || body.internalNotes || "",
      status: body.status || "Posted",
      mode: paymentType === "petty" ? "Petty" : "Party",
      contraLines: body.contraLines || [],
    };

    const row = await CashPayment.create(payload);

    if (row.status === "Posted") {
      await postCashPaymentJournalEntries(row);
      if (partyId) {
        await recalculatePartyBalance(String(partyId));
      }
    }

    const populated = await CashPayment.findById(row._id)
      .populate("partyId", "name companyName type")
      .populate("cashAccountId", "title code")
      .lean();

    return ok(populated ?? row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
