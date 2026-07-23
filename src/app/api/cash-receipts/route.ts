import { fail, ok } from "@/lib/api";
import { offlineDB, generateUniqueId } from "@/lib/dexie";
import { recalculatePartyBalance, postCashReceiptJournalEntries } from "@/lib/offline/postingService";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const rangeType = url.searchParams.get("rangeType") || "";
    const fromDate = url.searchParams.get("fromDate") || "";
    const toDate = url.searchParams.get("toDate") || "";

    let receipts = await offlineDB.cashReceipts.toArray();

    // Date filtering
    if (rangeType === "today") {
      const today = new Date().toISOString().split("T")[0];
      receipts = receipts.filter(r => r.date?.startsWith(today));
    } else if (rangeType === "week") {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6);
      receipts = receipts.filter(r => {
        const d = new Date(r.date);
        return d >= weekStart && d <= weekEnd;
      });
    } else if (rangeType === "month") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      receipts = receipts.filter(r => {
        const d = new Date(r.date);
        return d >= monthStart && d <= monthEnd;
      });
    } else if (rangeType === "custom" && fromDate && toDate) {
      receipts = receipts.filter(r => {
        const d = r.date?.split("T")[0] || "";
        return d >= fromDate && d <= toDate;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      receipts = receipts.filter(r => {
        const num = r.receiptNumber || "";
        const ref = r.reference || "";
        const narr = r.narration || "";
        const amt = String(r.amount || "");
        const rType = r.receiptType || "";
        
        return num.toLowerCase().includes(q) ||
               ref.toLowerCase().includes(q) ||
               narr.toLowerCase().includes(q) ||
               amt.includes(q) ||
               rType.toLowerCase().includes(q);
      });
    }

    // Sort by createdAt descending
    receipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ok(receipts);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = generateUniqueId();

    // Auto-generate receipt number
    if (!body.receiptNumber || body.receiptNumber === "Auto-generated") {
      let attempt = (await offlineDB.cashReceipts.count()) + 1;
      let isUnique = false;
      while (!isUnique) {
        const candidate = `CRV-${attempt.toString().padStart(5, "0")}`;
        const existing = await offlineDB.cashReceipts.where("receiptNumber").equals(candidate).first();
        if (!existing) {
          body.receiptNumber = candidate;
          isUnique = true;
        } else {
          attempt++;
        }
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

    const receiptRecord = {
      id,
      _id: id,
      receiptNumber: body.receiptNumber,
      receiptType: body.receiptType || "party",
      date: body.date || new Date().toISOString(),
      partyId: body.partyId || null,
      cashAccountId: body.cashAccountId || null,
      cashAccountTitle: body.cashAccountTitle || "",
      reference: body.reference || "",
      narration: body.narration || "",
      employeeId: body.employeeId || null,
      jobId: body.jobId || null,
      amount: Number(body.amount) || 0,
      whtAmount: Number(body.whtAmount) || 0,
      netAmount: Number(body.netAmount) || 0,
      notes: body.notes || "",
      status: body.status || "Posted",
      partyReceiptType: body.partyReceiptType || "Standard",
      contraLines: body.contraLines || [],
      partyLines: body.partyLines || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.cashReceipts.add(receiptRecord);

    const partyId = receiptRecord.partyId;
    if (receiptRecord.status === "Posted" || !receiptRecord.status) {
      await postCashReceiptJournalEntries(receiptRecord);
      if (partyId) {
        await recalculatePartyBalance(partyId);
      }
    }

    return ok(receiptRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
