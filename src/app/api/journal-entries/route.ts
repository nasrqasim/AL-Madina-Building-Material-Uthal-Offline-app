import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

// TODO: Update these service functions to use IndexedDB
// import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountCode = searchParams.get("accountCode");
  const voucherNo = searchParams.get("voucherNo");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  try {
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    
    // Filter by query parameters
    let rows = allJournalEntries.filter((je: any) => {
      if (accountCode && je.accountCode !== accountCode) return false;
      if (voucherNo && je.voucherNo !== voucherNo) return false;
      if (fromDate || toDate) {
        const jeDate = new Date(je.date);
        if (fromDate && jeDate < new Date(fromDate)) return false;
        if (toDate && jeDate > new Date(toDate)) return false;
      }
      return true;
    });

    // Sort by date and createdAt
    rows.sort((a: any, b: any) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Populate partyId if present
    const allParties = await offlineDB.parties.toArray();
    rows = rows.map((je: any) => {
      if (je.partyId) {
        const party = allParties.find((p: any) => p.id === je.partyId);
        if (party) {
          return {
            ...je,
            partyId: { name: party.name, companyName: party.companyName, type: party.type, code: party.code }
          };
        }
      }
      return je;
    });

    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    let created;
    if (body.entries && Array.isArray(body.entries)) {
      const entriesWithIds = body.entries.map((entry: any) => ({
        ...entry,
        id: generateUniqueId(),
        createdAt: new Date().toISOString()
      }));
      await offlineDB.journalEntries.bulkAdd(entriesWithIds as any);
      created = entriesWithIds;
    } else {
      const id = generateUniqueId();
      const entry = {
        ...body,
        id,
        createdAt: new Date().toISOString()
      };
      await offlineDB.journalEntries.add(entry as any);
      created = entry;
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
        const paymentId = generateUniqueId();
        await offlineDB.cashPayments.add({
          id: paymentId,
          voucherNo,
          paymentType: "party",
          date,
          partyId,
          vendor: String(partyId),
          amount,
          narration: remarks,
          status: "Posted",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
        // TODO: await recalculatePartyBalance(String(partyId));
      } else if (partyType === "customer") {
        const receiptId = generateUniqueId();
        await offlineDB.cashReceipts.add({
          id: receiptId,
          receiptNumber: voucherNo,
          receiptType: "party",
          date,
          partyId,
          amount,
          narration: remarks,
          status: "Posted",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
        // TODO: await recalculatePartyBalance(String(partyId));
      }
    }

    return ok(created, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
