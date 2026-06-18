import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import CashReceipt from "@/models/CashReceipt";
import BankReceipt from "@/models/BankReceipt";
import JournalEntry from "@/models/JournalEntry";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return fail("Invoice not found.", 404);
    }

    const invoiceNo = invoice.invoiceNo;
    const partyId = invoice.partyId ? invoice.partyId.toString() : "";

    // 1. Fetch Cash Receipts linked to this invoice
    const cashReceipts = await CashReceipt.find({
      partyId: invoice.partyId,
      $or: [
        { reference: invoiceNo },
        { narration: { $regex: invoiceNo, $options: "i" } }
      ],
      status: { $ne: "Cancelled" }
    }).lean();

    // 2. Fetch Bank Receipts linked to this invoice
    const bankReceipts = await BankReceipt.find({
      $and: [
        { $or: [{ party: partyId }, { party: String(partyId) }] },
        {
          $or: [
            { instrumentNo: invoiceNo },
            { instrumentNo: { $regex: invoiceNo, $options: "i" } }
          ]
        }
      ],
      status: { $ne: "Cancelled" }
    }).lean();

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

    await dbConnect();

    // 1. Fetch the invoice
    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return fail("Invoice not found.", 404);
    }

    const netTotal = Number(invoice.totalAmount) || 0;
    const prevReceived = Number(invoice.amountReceived) || 0;
    const remaining = netTotal - prevReceived;

    if (paymentAmount > remaining) {
      return fail(`Payment amount (${paymentAmount}) exceeds outstanding balance (${remaining}).`, 400);
    }

    // 2. Update Invoice
    invoice.amountReceived = prevReceived + paymentAmount;
    const newRemaining = netTotal - invoice.amountReceived;
    if (newRemaining <= 0) {
      invoice.status = "paid";
    }

    await invoice.save();

    // 3. Auto-generate receipt number
    let attempt = (await CashReceipt.countDocuments()) + (await BankReceipt.countDocuments()) + 1;
    const prefix = paymentMethod === "Bank" ? "BRV" : "CRV";
    let receiptNumber = `${prefix}-${attempt.toString().padStart(5, "0")}`;
    
    let isUnique = false;
    while (!isUnique) {
      const existingCash = await CashReceipt.findOne({ receiptNumber });
      const existingBank = await BankReceipt.findOne({ receiptNumber });
      if (!existingCash && !existingBank) {
        isUnique = true;
      } else {
        attempt++;
        receiptNumber = `${prefix}-${attempt.toString().padStart(5, "0")}`;
      }
    }

    const narration = remarks || `Payment received against ${invoice.invoiceNo}`;
    const paymentDate = date || new Date().toISOString().split("T")[0];

    // 4. Create Receipt & Journal Entries
    if (paymentMethod === "Bank") {
      await BankReceipt.create({
        receiptNumber,
        date: paymentDate,
        type: "Customer",
        party: invoice.partyId ? invoice.partyId.toString() : "",
        bankAccount: bankId || "",
        amount: paymentAmount,
        netAmount: paymentAmount,
        status: "Posted",
      });

      await JournalEntry.create([
        {
          invoiceId: invoice._id,
          voucherNo: receiptNumber,
          date: new Date(paymentDate),
          accountCode: "1110", // Bank
          accountTitle: "Bank",
          debit: paymentAmount,
          credit: 0,
          remarks: narration,
        },
        {
          invoiceId: invoice._id,
          voucherNo: receiptNumber,
          date: new Date(paymentDate),
          accountCode: "1100", // Accounts Receivable
          accountTitle: "Accounts Receivable",
          debit: 0,
          credit: paymentAmount,
          remarks: narration,
          partyId: invoice.partyId,
        }
      ]);
    } else {
      // Cash Receipt
      await CashReceipt.create({
        receiptNumber,
        receiptType: "party",
        date: paymentDate,
        partyId: invoice.partyId || null,
        amount: paymentAmount,
        netAmount: paymentAmount,
        narration,
        status: "Posted",
      });

      await JournalEntry.create([
        {
          invoiceId: invoice._id,
          voucherNo: receiptNumber,
          date: new Date(paymentDate),
          accountCode: "1111", // Cash
          accountTitle: "Cash",
          debit: paymentAmount,
          credit: 0,
          remarks: narration,
        },
        {
          invoiceId: invoice._id,
          voucherNo: receiptNumber,
          date: new Date(paymentDate),
          accountCode: "1100", // Accounts Receivable
          accountTitle: "Accounts Receivable",
          debit: 0,
          credit: paymentAmount,
          remarks: narration,
          partyId: invoice.partyId,
        }
      ]);
    }

    // 5. Recalculate customer balance
    if (invoice.partyId) {
      await recalculatePartyBalance(invoice.partyId.toString());
    }

    return ok({
      success: true,
      amountReceived: invoice.amountReceived,
      outstanding: newRemaining,
      status: invoice.status
    });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
