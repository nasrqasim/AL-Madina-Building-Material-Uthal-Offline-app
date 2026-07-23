import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const allSettings = await offlineDB.settings.toArray();
    const row = allSettings.find((s: any) => s.key === "otherIncome" && s.id === params.id);
    if (!row) {
      return fail("Record not found", 404);
    }
    return ok((row as any).value);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // 1. Update OtherIncome record
    const updatedIncome = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.settings.update(params.id, { value: updatedIncome });
    const row = await offlineDB.settings.get(params.id);
    if (!row) {
      return fail("Record not found", 404);
    }

    const incomeValue = (row as any).value;
    const voucherNo = `INC-${params.id}`;

    // 2. Refresh/update corresponding Journal Entries
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === voucherNo);
    for (const entry of entriesToDelete) {
      await offlineDB.journalEntries.delete(entry.id);
    }

    const isCash = incomeValue.paymentMethod === "Cash";
    const assetCode = isCash ? "1111" : "1110";
    const assetTitle = isCash ? "Cash" : "Bank";

    await offlineDB.journalEntries.bulkAdd([
      {
        date: incomeValue.date,
        voucherNo,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: incomeValue.amount,
        credit: 0,
        remarks: incomeValue.description || incomeValue.title,
        createdAt: new Date().toISOString()
      },
      {
        date: incomeValue.date,
        voucherNo,
        accountCode: "40002001",
        accountTitle: "Other Income",
        debit: 0,
        credit: incomeValue.amount,
        remarks: incomeValue.description || incomeValue.title,
        createdAt: new Date().toISOString()
      }
    ] as any);

    return ok(incomeValue);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Delete OtherIncome record
    const row = await offlineDB.settings.get(params.id);
    if (!row) {
      return fail("Record not found", 404);
    }
    await offlineDB.settings.delete(params.id);

    const voucherNo = `INC-${params.id}`;

    // 2. Delete corresponding Journal Entries
    const allJournalEntries = await offlineDB.journalEntries.toArray();
    const entriesToDelete = allJournalEntries.filter((je: any) => je.voucherNo === voucherNo);
    for (const entry of entriesToDelete) {
      await offlineDB.journalEntries.delete(entry.id);
    }

    return ok({ message: "Record deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}
