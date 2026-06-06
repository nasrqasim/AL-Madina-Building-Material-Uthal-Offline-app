import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import JournalEntry from "@/models/JournalEntry";
import CashPayment from "@/models/CashPayment";
import CashReceipt from "@/models/CashReceipt";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountCode = searchParams.get("accountCode");
  const voucherNo = searchParams.get("voucherNo");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  await dbConnect();
  try {
    const query: any = {};
    if (accountCode) query.accountCode = accountCode;
    if (voucherNo) query.voucherNo = voucherNo;
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const rows = await JournalEntry.find(query)
      .populate("partyId", "name companyName type code")
      .sort({ date: 1, createdAt: 1 })
      .lean();
    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    
    let created;
    if (body.entries && Array.isArray(body.entries)) {
      created = await JournalEntry.create(body.entries);
    } else {
      created = await JournalEntry.create(body);
    }

    // Create CashPayment or CashReceipt if party is selected
    const partyId = body.partyId;
    const partyType = body.partyType; // "customer" or "vendor"

    if (partyId && partyType) {
      const amount = Number(body.amount) || 0;
      const date = body.date || new Date().toISOString().split("T")[0];
      const remarks = body.remarks || "";
      const voucherNo = body.voucherNo || `JV-${Date.now()}`;

      if (partyType === "vendor") {
        await CashPayment.create({
          voucherNo,
          paymentType: "party",
          date,
          partyId,
          vendor: String(partyId),
          amount,
          narration: remarks,
          status: "Posted",
        });
        await recalculatePartyBalance(String(partyId));
      } else if (partyType === "customer") {
        await CashReceipt.create({
          receiptNumber: voucherNo,
          receiptType: "party",
          date,
          partyId,
          amount,
          narration: remarks,
          status: "Posted",
        });
        await recalculatePartyBalance(String(partyId));
      }
    }

    return ok(created, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
