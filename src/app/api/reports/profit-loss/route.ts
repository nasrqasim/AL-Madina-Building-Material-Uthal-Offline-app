import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

function getLineQty(line: any): number {
  const cartons = Number(line.cartons) || 0;
  const qty = Number(line.qty) || 0;
  if (cartons > 0) return cartons;
  if (qty > 0) return qty;
  const liters = Number(line.liters) || 0;
  const gallons = Number(line.gallons) || 0;
  if (liters > 0) return liters;
  if (gallons > 0) return gallons;
  return 0;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const journalEntries = await offlineDB.journalEntries.toArray();
    const accounts = await offlineDB.accounts.toArray();
    const items = await offlineDB.items.toArray();
    const invoices = await offlineDB.invoices.toArray();

    // Filter journal entries by date range
    const filteredEntries = journalEntries.filter(entry => {
      const entryDate = entry.date.split("T")[0];
      if (fromDate && entryDate < fromDate) return false;
      if (toDate && entryDate > toDate) return false;
      return true;
    });

    // Filter invoices by date range and status
    const filteredInvoices = invoices.filter(inv => {
      if (inv.status === "cancelled" || inv.status === "Cancelled") return false;
      const invDate = inv.date.split("T")[0];
      if (fromDate && invDate < fromDate) return false;
      if (toDate && invDate > toDate) return false;
      return true;
    });

    // Group balances by code
    const groupBalances: Record<string, { debit: number; credit: number; title: string }> = {};
    filteredEntries.forEach(entry => {
      if (!groupBalances[entry.accountCode]) {
        groupBalances[entry.accountCode] = { debit: 0, credit: 0, title: entry.accountTitle };
      }
      groupBalances[entry.accountCode].debit += (entry.debit || 0);
      groupBalances[entry.accountCode].credit += (entry.credit || 0);
    });

    const accountMap = new Map(accounts.map(a => [a.code, a]));

    // Dynamic COGS calculation
    const OUT_TYPES = new Set([
      "sale", "non_tax_sale", "pos", "pos_counter_sale", "reduce_stock", "challan"
    ]);
    const OUT_RETURN_TYPES = new Set([
      "purchase_return", "non_tax_purchase_return"
    ]);

    let totalCogs = 0;
    items.forEach(item => {
      let qtyOut = 0;
      filteredInvoices.forEach(inv => {
        const invType = String(inv.type || "");
        const isOut = OUT_TYPES.has(invType);
        const isOutReturn = OUT_RETURN_TYPES.has(invType);
        if (!isOut && !isOutReturn) return;

        (inv.lines || []).forEach((line: any) => {
          const lineItemId = line.itemId?._id || line.itemId;
          if (String(lineItemId) !== String(item.id)) return;

          const qty = getLineQty(line);
          if (qty > 0) {
            if (isOut) qtyOut += qty;
            if (isOutReturn) qtyOut -= qty;
          }
        });
      });
      totalCogs += qtyOut * (item.purchaseRate || 0);
    });

    const report = {
      revenue: [] as any[],
      expenses: [] as any[],
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0
    };

    Object.entries(groupBalances).forEach(([code, bal]) => {
      // Skip Purchases (code 5100) since we replace it with COGS
      if (code === "5100") return;

      const acc = accountMap.get(code);
      let type = acc ? acc.type.toLowerCase() : "";

      // Infer type if missing
      if (!type) {
        if (code.startsWith("4")) type = "income";
        else if (code.startsWith("5")) type = "expense";
        else return; // Ignore assets/liabilities
      } else if (type === "revenue") {
        type = "income";
      }

      const title = acc ? acc.title : bal.title;

      if (type === "income" || type === "revenue") {
        const netAmount = bal.credit - bal.debit;
        if (netAmount !== 0) {
          report.revenue.push({ title, amount: netAmount });
          report.totalRevenue += netAmount;
        }
      } else if (type === "expense") {
        const netAmount = bal.debit - bal.credit;
        if (netAmount !== 0) {
          report.expenses.push({ title, amount: netAmount });
          report.totalExpenses += netAmount;
        }
      }
    });

    // Add COGS to expenses if it is non-zero
    if (totalCogs > 0) {
      report.expenses.push({ title: "Cost of Goods Sold (COGS)", amount: totalCogs });
      report.totalExpenses += totalCogs;
    }

    report.netProfit = report.totalRevenue - report.totalExpenses;

    return ok(report);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
