import { fail, ok } from "@/lib/api";
import { offlineDB, generateUniqueId } from "@/lib/dexie";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, employeeName, amount, paymentMethod, bankId, date, remarks } = body;

    if (!employeeName || !amount || amount <= 0) {
      return fail("Employee name and valid amount are required");
    }

    const payDate = date || new Date().toISOString().split("T")[0];
    const salaryAmount = Number(amount) || 0;
    const voucherNo = `SAL-${generateUniqueId()}`;

    // 1. Save salary payment record
    const salaryRecord = {
      id: generateUniqueId(),
      key: "salary_payment",
      value: {
        id: voucherNo,
        voucherNo,
        employeeId,
        employeeName,
        amount: salaryAmount,
        paymentMethod: paymentMethod || "Cash",
        bankId: paymentMethod === "Bank" ? bankId : undefined,
        date: payDate,
        remarks: remarks || "Salary Payment",
        status: "Paid",
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await offlineDB.settings.add(salaryRecord as any);

    // 2. Create journal entries to decrease Cash & Banks
    // Debit: Salary Expense (5200)
    // Credit: Cash Hand (1111) or Bank Account (1110)

    let cashCode = "1111";
    let cashTitle = "Cash Hand";

    if (paymentMethod === "Bank") {
      cashCode = "1110";
      cashTitle = "Bank Account";
      if (bankId) {
        try {
          const bankAcc = await offlineDB.accounts.get(bankId);
          if (bankAcc) {
            cashCode = bankAcc.code || cashCode;
            cashTitle = bankAcc.title || cashTitle;
          }
        } catch (_) {}
      }
    }

    const journalEntries = [
      {
        id: generateUniqueId(),
        voucherNo,
        date: payDate,
        accountCode: "5200",
        accountTitle: "Salary Expense",
        debit: salaryAmount,
        credit: 0,
        remarks: `Salary paid to ${employeeName} - ${remarks || "Salary Payment"}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId(),
        voucherNo,
        date: payDate,
        accountCode: cashCode,
        accountTitle: cashTitle,
        debit: 0,
        credit: salaryAmount,
        remarks: `Salary paid to ${employeeName} - ${remarks || "Salary Payment"}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await offlineDB.journalEntries.bulkAdd(journalEntries as any);

    // 3. Also record as a cash/bank payment for tracking
    if (paymentMethod === "Bank") {
      const bankPayment = {
        id: generateUniqueId(),
        voucherNo,
        date: payDate,
        amount: salaryAmount,
        bankAccountId: bankId,
        narration: `Salary paid to ${employeeName}`,
        notes: remarks || "Salary Payment",
        status: "Posted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await offlineDB.bankPayments.add(bankPayment as any);
    } else {
      const cashPayment = {
        id: generateUniqueId(),
        voucherNo,
        date: payDate,
        amount: salaryAmount,
        narration: `Salary paid to ${employeeName}`,
        notes: remarks || "Salary Payment",
        status: "Posted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await offlineDB.cashPayments.add(cashPayment as any);
    }

    return ok({ voucherNo, amount: salaryAmount, employeeName, date: payDate }, 201);
  } catch (e) {
    console.error("Pay staff error:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
