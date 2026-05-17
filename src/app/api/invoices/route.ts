import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Party from "@/models/Party";
import Employee from "@/models/Employee";
import Job from "@/models/Job";
import Location from "@/models/Location";
import JournalEntry from "@/models/JournalEntry";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const partyId = searchParams.get("partyId");

    const query: any = {};
    if (type) query.type = type;
    if (partyId) query.partyId = partyId;

    await dbConnect();
    const rows = await Invoice.find(query)
      .populate("partyId", "companyName name")
      .populate("employeeId", "name")
      .populate("jobId", "title name")
      .populate("locationId", "name")
      .populate("lines.itemId", "name code category unit")
      .sort({ createdAt: -1 })
      .lean();

    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

// Helper to generate Journal Entries dynamically for all Sales, Purchases, and Returns
export async function generateInvoiceJournalEntries(invoice: any) {
  await JournalEntry.deleteMany({ invoiceId: invoice._id });

  const total = Number(invoice.totalAmount) || 0;
  if (total <= 0) return;

  const voucherNo = invoice.invoiceNo || `INV-${invoice._id}`;
  const date = invoice.date || invoice.createdAt || new Date();
  const paymentMethod = invoice.paymentMethod || invoice.paymentTerms || "Credit";

  const isCash = paymentMethod === "Cash" || paymentMethod === "Card";
  const isBank = paymentMethod === "Bank" || paymentMethod === "Online";

  // Determine Asset / Balance Sheet Accounts
  const assetCode = isCash ? "1111" : isBank ? "1110" : "1100";
  const assetTitle = isCash ? "Cash" : isBank ? "Bank" : "Accounts Receivable";

  const liabilityCode = isCash ? "1111" : isBank ? "1110" : "2100";
  const liabilityTitle = isCash ? "Cash" : isBank ? "Bank" : "Accounts Payable";

  if (invoice.type === "sale" || invoice.type === "pos") {
    await JournalEntry.create([
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: total,
        credit: 0,
        remarks: `Sales invoice posted (${paymentMethod})`
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "4100",
        accountTitle: "Sales",
        debit: 0,
        credit: total,
        remarks: `Sales invoice posted (${paymentMethod})`
      }
    ]);
  } else if (invoice.type === "sale_return") {
    await JournalEntry.create([
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "4101",
        accountTitle: "Sales Return",
        debit: total,
        credit: 0,
        remarks: "Sales return posted"
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: 0,
        credit: total,
        remarks: "Sales return posted"
      }
    ]);
  } else if (invoice.type === "purchase") {
    await JournalEntry.create([
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "5100",
        accountTitle: "Purchases",
        debit: total,
        credit: 0,
        remarks: `Purchase invoice posted (${paymentMethod})`
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: liabilityCode,
        accountTitle: liabilityTitle,
        debit: 0,
        credit: total,
        remarks: `Purchase invoice posted (${paymentMethod})`
      }
    ]);
  } else if (invoice.type === "purchase_return") {
    await JournalEntry.create([
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: liabilityCode,
        accountTitle: liabilityTitle,
        debit: total,
        credit: 0,
        remarks: "Purchase return posted"
      },
      {
        invoiceId: invoice._id,
        voucherNo,
        date,
        accountCode: "5101",
        accountTitle: "Purchase Return",
        debit: 0,
        credit: total,
        remarks: "Purchase return posted"
      }
    ]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    
    const row = await Invoice.create(body);
    
    // Automatically generate ledgers/journals
    await generateInvoiceJournalEntries(row);

    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}
