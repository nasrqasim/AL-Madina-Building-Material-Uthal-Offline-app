import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashPayment from "@/models/CashPayment";
import { postCashPayment } from "@/services/posting/transactionPosting";

export async function GET() {
  await dbConnect();
  const rows = await CashPayment.aggregate([
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
      $project: {
        voucherNo: 1,
        date: 1,
        mode: 1,
        amount: 1,
        status: 1,
        vendor: { $ifNull: [{ $arrayElemAt: ["$vendorData.name", 0] }, "$vendor"] },
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
    
    // Ensure voucherNo is generated if not provided
    if (!body.voucherNo || body.voucherNo === "Auto-generated") {
      let isUnique = false;
      let attempt = await CashPayment.countDocuments() + 1;
      while (!isUnique) {
        const candidate = `CPV-${attempt.toString().padStart(5, "0")}`;
        const existing = await CashPayment.findOne({ voucherNo: candidate });
        if (!existing) {
          body.voucherNo = candidate;
          isUnique = true;
        } else {
          attempt++;
        }
      }
    }

    const row = await postCashPayment({
      voucherNo: body.voucherNo,
      date: body.date,
      partyId: body.vendorId, // Using vendorId from form
      amount: body.totalAmount,
      wht: body.whtAmount,
      netAmount: body.totalAmount - (body.whtAmount || 0),
      narration: body.narration,
    });

    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}


export const dynamic = "force-dynamic";
