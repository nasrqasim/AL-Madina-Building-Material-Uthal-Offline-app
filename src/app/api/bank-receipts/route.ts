import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import BankReceipt from "@/models/BankReceipt";
import { postBankReceipt } from "@/services/posting/transactionPosting";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function GET() {
  await dbConnect();
  const rows = await BankReceipt.aggregate([
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
        receiptNumber: 1,
        date: 1,
        amount: 1,
        status: 1,
        party: { $ifNull: [{ $arrayElemAt: ["$partyData.name", 0] }, "$party"] },
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
      let attempt = await BankReceipt.countDocuments() + 1;
      while (!isUnique) {
        const candidate = `BRV-${attempt.toString().padStart(5, "0")}`;
        const existing = await BankReceipt.findOne({ receiptNumber: candidate });
        if (!existing) {
          body.voucherNo = candidate;
          isUnique = true;
        } else {
          attempt++;
        }
      }
    }

    const row = await postBankReceipt({
      voucherNo: body.voucherNo,
      date: body.date,
      partyId: body.customerId,
      bankId: body.bankAccountId,
      amount: body.totalAmount,
      netAmount: body.totalAmount,
      narration: body.narration,
    });

    if (body.customerId) await recalculatePartyBalance(String(body.customerId));

    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}


export const dynamic = "force-dynamic";
