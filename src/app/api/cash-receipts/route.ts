import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import CashReceipt from "@/models/CashReceipt";
import { recalculatePartyBalance, postCashReceiptJournalEntries } from "@/services/posting/invoicePostingHelper";
import Party from "@/models/Party";
import Account from "@/models/Account";
import Employee from "@/models/Employee";
import Job from "@/models/Job";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const rangeType = url.searchParams.get("rangeType") || ""; // "today", "week", "month", "custom"
    const fromDate = url.searchParams.get("fromDate") || "";
    const toDate = url.searchParams.get("toDate") || "";

    const matchQuery: any = {};

    // Date filtering
    let start: Date | null = null;
    let end: Date | null = null;
    const now = new Date();

    if (rangeType === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (rangeType === "week") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59, 999);
    } else if (rangeType === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (rangeType === "custom" && fromDate && toDate) {
      start = new Date(fromDate);
      end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
    }

    if (start && end) {
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      matchQuery.date = { $gte: startStr, $lte: endStr };
    }

    let rows = await CashReceipt.find(matchQuery)
      .populate("partyId", "name companyName type code")
      .populate("cashAccountId", "title code")
      .populate("employeeId", "name")
      .populate("jobId", "title name")
      .sort({ createdAt: -1 })
      .lean();

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r: any) => {
        const num = r.receiptNumber || "";
        const ref = r.reference || "";
        const narr = r.narration || "";
        const amt = String(r.amount || "");
        const rType = r.receiptType || "";
        const partyName = r.partyId ? (r.partyId.companyName || r.partyId.name || "") : "";
        const cashAcc = r.cashAccountId ? r.cashAccountId.title || "" : "";
        
        return num.toLowerCase().includes(q) ||
               ref.toLowerCase().includes(q) ||
               narr.toLowerCase().includes(q) ||
               amt.includes(q) ||
               rType.toLowerCase().includes(q) ||
               cashAcc.toLowerCase().includes(q) ||
               partyName.toLowerCase().includes(q);
      });
    }

    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
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

    const payload = {
      ...body,
      partyReceiptType: body.partyReceiptType || "Standard"
    };

    const row = await CashReceipt.create(payload);
    const partyId = row.partyId?.toString?.() || row.partyId;
    if (row.status === "Posted" || !row.status) {
      await postCashReceiptJournalEntries(row);
      if (partyId) {
        await recalculatePartyBalance(String(partyId));
      }
    }
    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
