import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import OtherIncome from "@/models/OtherIncome";
import JournalEntry from "@/models/JournalEntry";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const incomeType = searchParams.get("incomeType");
    const paymentMethod = searchParams.get("paymentMethod");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    await dbConnect();

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (incomeType) {
      query.incomeType = incomeType;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const rows = await OtherIncome.find(query)
      .sort({ date: -1, createdAt: -1 })
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

    // 1. Create OtherIncome record
    const row = await OtherIncome.create(body);

    const voucherNo = `INC-${row._id}`;

    // 2. Create corresponding Journal Entries to feed reports & dashboard automatically
    const isCash = row.paymentMethod === "Cash";
    const assetCode = isCash ? "1111" : "1110";
    const assetTitle = isCash ? "Cash" : "Bank";

    await JournalEntry.create([
      {
        date: row.date,
        voucherNo,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: row.amount,
        credit: 0,
        remarks: row.description || row.title
      },
      {
        date: row.date,
        voucherNo,
        accountCode: "40002001",
        accountTitle: "Other Income",
        debit: 0,
        credit: row.amount,
        remarks: row.description || row.title
      }
    ]);

    return ok(row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}
