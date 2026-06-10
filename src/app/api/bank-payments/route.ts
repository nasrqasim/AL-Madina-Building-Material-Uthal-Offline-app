import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import BankPayment from "@/models/BankPayment";
import { postBankPayment } from "@/services/posting/transactionPosting";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function GET() {
  await dbConnect();
  // Using aggregate to join with Party and Bank for names
  const rows = await BankPayment.aggregate([
    {
      $lookup: {
        from: "parties",
        let: { vendorId: "$vendor" },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$vendorId"] } } }
        ],
        as: "vendorData"
      }
    },
    {
      $lookup: {
        from: "banks",
        let: { bankId: "$bankAccount" },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$bankId"] } } }
        ],
        as: "bankData"
      }
    },
    {
      $project: {
        voucherNo: 1,
        date: 1,
        mode: 1,
        amount: 1,
        status: 1,
        vendor: { $ifNull: [{ $arrayElemAt: ["$vendorData.name", 0] }, "$vendor"] },
        bankAccount: { $ifNull: [{ $arrayElemAt: ["$bankData.name", 0] }, "$bankAccount"] },
        createdAt: 1
      }
    },
    { $sort: { createdAt: -1 } }
  ]);
  
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    
    if (!body.voucherNo || body.voucherNo === "Auto-generated") {
      let isUnique = false;
      let attempt = await BankPayment.countDocuments() + 1;
      while (!isUnique) {
        const candidate = `BPV-${attempt.toString().padStart(5, "0")}`;
        const existing = await BankPayment.findOne({ voucherNo: candidate });
        if (!existing) {
          body.voucherNo = candidate;
          isUnique = true;
        } else {
          attempt++;
        }
      }
    }

    const row = await postBankPayment({
      voucherNo: body.voucherNo,
      date: body.date,
      partyId: body.vendorId,
      bankId: body.bankAccountId, // Assuming this is bankAccountId from form
      amount: body.totalAmount,
      wht: body.whtAmount,
      netAmount: body.totalAmount - (body.whtAmount || 0),
      narration: body.narration,
    });

    if (body.vendorId) await recalculatePartyBalance(String(body.vendorId));

    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}


export const dynamic = "force-dynamic";
