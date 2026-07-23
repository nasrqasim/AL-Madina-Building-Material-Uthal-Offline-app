import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

// TODO: Update these service functions to use IndexedDB
// import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await offlineDB.invoices.get(params.id);
    if (!invoice) {
      return fail("Invoice not found.", 404);
    }

    const invoiceNo = (invoice as any).invoiceNo;
    const partyId = (invoice as any).partyId ? String((invoice as any).partyId) : "";

    // 1. Fetch Cash Receipts linked to this invoice
    const allCashReceipts = await offlineDB.cashReceipts.toArray();
    const cashReceipts = allCashReceipts.filter((cr: any) => {
      if (cr.partyId !== (invoice as any).partyId) return false;
      if (cr.status === "Cancelled") return false;
      if (cr.reference === invoiceNo) return true;
      if (cr.narration && cr.narration.toLowerCase().includes(invoiceNo.toLowerCase())) return true;
      return false;
    });

    // 2. Fetch Bank Receipts linked to this invoice
    const allBankReceipts = await offlineDB.bankReceipts.toArray();
    const bankReceipts = allBankReceipts.filter((br: any) => {
      if (br.party !== partyId && br.party !== (invoice as any).partyId) return false;
      if (br.status === "Cancelled") return false;
      if (br.instrumentNo === invoiceNo) return true;
      if (br.instrumentNo && br.instrumentNo.toLowerCase().includes(invoiceNo.toLowerCase())) return true;
      return false;
    });

    // 3. Map and merge into payment history format
    const history = [
      ...cashReceipts.map((r: any) => ({
        date: r.date,
        voucherNo: r.receiptNumber,
        amountReceived: r.amount,
        paymentMethod: "Cash",
        user: "Super Admin",
      })),
      ...bankReceipts.map((r: any) => ({
        date: r.date,
        voucherNo: r.receiptNumber,
        amountReceived: r.amount,
        paymentMethod: "Bank",
        user: "Super Admin",
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return ok(history);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { amount, paymentMethod, bankId, date, remarks } = body;

    const paymentAmount = Number(amount) || 0;
    if (paymentAmount <= 0) {
      return fail("Payment amount must be greater than zero.", 400);
    }

    // 1. Fetch the invoice
    const invoice = await offlineDB.invoices.get(params.id);
    if (!invoice) {
      return fail("Invoice not found.", 404);
    }

    const netTotal = Number((invoice as any).totalAmount) || 0;
    const prevReceived = Number((invoice as any).amountReceived) || 0;
    const remaining = netTotal - prevReceived;

    if (paymentAmount > remaining) {
      return fail(`Payment amount (${paymentAmount}) exceeds outstanding balance (${remaining}).`, 400);
    }

    // 2. Update Invoice
    const amountReceived = prevReceived + paymentAmount;
    const newRemaining = netTotal - amountReceived;
    const status = newRemaining <= 0 ? "paid" : (invoice as any).status;

    await offlineDB.invoices.update(params.id, {
      amountReceived,
      status,
      updatedAt: new Date().toISOString()
    });

    // 3. Auto-generate receipt number
    const allCashReceipts = await offlineDB.cashReceipts.toArray();
    const allBankReceipts = await offlineDB.bankReceipts.toArray();
    let attempt = allCashReceipts.length + allBankReceipts.length + 1;
    const prefix = paymentMethod === "Bank" ? "BRV" : "CRV";
    let receiptNumber = `${prefix}-${attempt.toString().padStart(5, "0")}`;
    
    let isUnique = false;
    while (!isUnique) {
      const existingCash = allCashReceipts.find((cr: any) => cr.receiptNumber === receiptNumber);
      const existingBank = allBankReceipts.find((br: any) => br.receiptNumber === receiptNumber);
      if (!existingCash && !existingBank) {
        isUnique = true;
      } else {
        attempt++;
        receiptNumber = `${prefix}-${attempt.toString().padStart(5, "0")}`;
      }
    }

    const narration = remarks || `Payment received against ${(invoice as any).invoiceNo}`;
    const paymentDate = date || new Date().toISOString().split("T")[0];

    // 4. Create Receipt & Journal Entries
    if (paymentMethod === "Bank") {
      const receiptId = generateUniqueId();
      await offlineDB.bankReceipts.add({
        id: receiptId,
        receiptNumber,
        date: paymentDate,
        type: "Customer",
        party: (invoice as any).partyId ? String((invoice as any).partyId) : "",
        bankAccount: bankId || "",
        amount: paymentAmount,
        netAmount: paymentAmount,
        status: "Posted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);

      await offlineDB.journalEntries.bulkAdd([
        {
          id: generateUniqueId(),
          invoiceId: params.id,
          voucherNo: receiptNumber,
          date: new Date(paymentDate),
          accountCode: "1110", // Bank
          accountTitle: "Bank",
          debit: paymentAmount,
          credit: 0,
          remarks: narration,
          createdAt: new Date().toISOString()
        },
        {
          id: generateUniqueId(),
          invoiceId: params.id,
          voucherNo: receiptNumber,
          date: new Date(paymentDate),
          accountCode: "1100", // Accounts Receivable
          accountTitle: "Accounts Receivable",
          debit: 0,
          credit: paymentAmount,
          remarks: narration,
          partyId: (invoice as any).partyId,
          createdAt: new Date().toISOString()
        }
      ] as any);
    } else {
      // Cash Receipt
      const receiptId = generateUniqueId();
      await offlineDB.cashReceipts.add({
        id: receiptId,
        receiptNumber,
        receiptType: "party",
        date: paymentDate,
        partyId: (invoice as any).partyId || null,
        amount: paymentAmount,
        netAmount: paymentAmount,
        narration,
        status: "Posted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);

      await offlineDB.journalEntries.bulkAdd([
        {
          id: generateUniqueId(),
          invoiceId: params.id,
          voucherNo: receiptNumber,
          date: new Date(paymentDate),
          accountCode: "1111", // Cash
          accountTitle: "Cash",
          debit: paymentAmount,
          credit: 0,
          remarks: narration,
          createdAt: new Date().toISOString()
        },
        {
          id: generateUniqueId(),
          invoiceId: params.id,
          voucherNo: receiptNumber,
          date: new Date(paymentDate),
          accountCode: "1100", // Accounts Receivable
          accountTitle: "Accounts Receivable",
          debit: 0,
          credit: paymentAmount,
          remarks: narration,
          partyId: (invoice as any).partyId,
          createdAt: new Date().toISOString()
        }
      ] as any);
    }

    // 5. Recalculate customer balance
    if ((invoice as any).partyId) {
      // TODO: await recalculatePartyBalance((invoice as any).partyId.toString());
    }

    return ok({
      success: true,
      amountReceived,
      outstanding: newRemaining,
      status
    });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
