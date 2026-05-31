import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashReceipt from "@/models/CashReceipt";

export async function GET() {
  await dbConnect();
  const rows = await CashReceipt.find()
    .populate("partyId", "name companyName")
    .populate("cashAccountId", "title code")
    .populate("employeeId", "name")
    .populate("jobId", "title name")
    .sort({ createdAt: -1 })
    .lean();
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();

    // Auto-generate receipt number
    if (!body.receiptNumber || body.receiptNumber === "Auto-generated") {
      let attempt = (await CashReceipt.countDocuments()) + 1;
      let isUnique = false;
      while (!isUnique) {
        const candidate = `CRV-${attempt.toString().padStart(5, "0")}`;
        const existing = await CashReceipt.findOne({ receiptNumber: candidate });
        if (!existing) { body.receiptNumber = candidate; isUnique = true; }
        else attempt++;
      }
    }

    // Compute total amount from partyLines for multi-party
    if (body.receiptType === "multi" && Array.isArray(body.partyLines)) {
      body.amount = body.partyLines.reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);
      body.netAmount = body.amount;
    }
    // Compute total amount from contraLines for petty
    if (body.receiptType === "petty" && Array.isArray(body.contraLines)) {
      body.amount = body.contraLines.reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);
      body.netAmount = body.amount;
    }

    const row = await CashReceipt.create(body);
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
