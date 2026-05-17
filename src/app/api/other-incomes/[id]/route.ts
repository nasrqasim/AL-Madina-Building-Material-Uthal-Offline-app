import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import OtherIncome from "@/models/OtherIncome";
import JournalEntry from "@/models/JournalEntry";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const row = await OtherIncome.findById(params.id).lean();
    if (!row) {
      return fail("Record not found", 404);
    }
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await dbConnect();

    // 1. Update OtherIncome record
    const row = await OtherIncome.findByIdAndUpdate(params.id, body, { new: true });
    if (!row) {
      return fail("Record not found", 404);
    }

    const voucherNo = `INC-${row._id}`;

    // 2. Refresh/update corresponding Journal Entries
    await JournalEntry.deleteMany({ voucherNo });

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

    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    // 1. Delete OtherIncome record
    const row = await OtherIncome.findByIdAndDelete(params.id);
    if (!row) {
      return fail("Record not found", 404);
    }

    const voucherNo = `INC-${row._id}`;

    // 2. Delete corresponding Journal Entries
    await JournalEntry.deleteMany({ voucherNo });

    return ok({ message: "Record deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}
