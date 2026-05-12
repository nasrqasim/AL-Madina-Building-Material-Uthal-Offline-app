import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashReceipt from "@/models/CashReceipt";
import { postCashReceipt } from "@/services/posting/transactionPosting";

export async function GET() {
  await dbConnect();
  const rows = await CashReceipt.aggregate([
    {
      $lookup: {
        from: "parties",
        let: { partyId: "$party" },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$partyId"] } } }
        ],
        as: "partyData"
      }
    },
    {
      $project: {
        receiptNumber: 1,
        date: 1,
        amount: 1,
        status: 1,
        party: { $ifNull: [{ $arrayElemAt: ["$partyData.name", 0] }, "$party"] },
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
      let attempt = await CashReceipt.countDocuments() + 1;
      while (!isUnique) {
        const candidate = `CRV-${attempt.toString().padStart(5, "0")}`;
        const existing = await CashReceipt.findOne({ receiptNumber: candidate });
        if (!existing) {
          body.voucherNo = candidate;
          isUnique = true;
        } else {
          attempt++;
        }
      }
    }

    const row = await postCashReceipt({
      voucherNo: body.voucherNo,
      date: body.date,
      partyId: body.customerId,
      amount: body.totalAmount,
      netAmount: body.totalAmount,
      narration: body.narration,
    });

    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}


export const dynamic = "force-dynamic";
