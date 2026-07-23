import { fail, ok } from "@/lib/api";
import { offlineDB, generateUniqueId } from "@/lib/dexie";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const incomeType = searchParams.get("incomeType");
    const paymentMethod = searchParams.get("paymentMethod");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    let incomes = await offlineDB.otherIncomes.toArray();

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      incomes = incomes.filter(inc => 
        (inc.title || "").toLowerCase().includes(searchLower) ||
        (inc.description || "").toLowerCase().includes(searchLower)
      );
    }

    if (incomeType) {
      incomes = incomes.filter(inc => inc.incomeType === incomeType);
    }

    if (paymentMethod) {
      incomes = incomes.filter(inc => inc.paymentMethod === paymentMethod);
    }

    if (fromDate || toDate) {
      incomes = incomes.filter(inc => {
        const incDate = new Date(inc.date);
        if (fromDate && incDate < new Date(fromDate)) return false;
        if (toDate && incDate > new Date(toDate)) return false;
        return true;
      });
    }

    // Sort by date descending
    incomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return ok(incomes);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Generate unique ID
    const id = generateUniqueId();
    
    // Create other income record
    const incomeRecord = {
      id,
      _id: id,
      title: body.title,
      description: body.description || "",
      amount: Number(body.amount) || 0,
      incomeType: body.incomeType || "One Time",
      paymentMethod: body.paymentMethod || "Cash",
      reference: body.reference || "",
      date: body.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to IndexedDB
    await offlineDB.otherIncomes.add(incomeRecord);

    // Create corresponding Journal Entries to feed reports & dashboard automatically
    const voucherNo = `INC-${id}`;
    const isCash = incomeRecord.paymentMethod === "Cash";
    const assetCode = isCash ? "1111" : "1110";
    const assetTitle = isCash ? "Cash Hand" : "Bank Account";

    const journalEntries = [
      {
        id: generateUniqueId(),
        voucherNo,
        date: incomeRecord.date,
        accountCode: assetCode,
        accountTitle: assetTitle,
        debit: incomeRecord.amount,
        credit: 0,
        remarks: incomeRecord.description || incomeRecord.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: generateUniqueId(),
        voucherNo,
        date: incomeRecord.date,
        accountCode: "40002001",
        accountTitle: "Other Income",
        debit: 0,
        credit: incomeRecord.amount,
        remarks: incomeRecord.description || incomeRecord.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    await offlineDB.journalEntries.bulkAdd(journalEntries);

    return ok(incomeRecord, 201);
  } catch (e) {
    console.error("Error creating other income:", e);
    return fail((e as Error).message);
  }
}
