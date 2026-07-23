import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate") || new Date().toISOString();
    const toDate = searchParams.get("toDate") || new Date().toISOString();

    const accounts = await offlineDB.accounts.toArray();
    const journalEntries = await offlineDB.journalEntries.toArray();
    const invoices = await offlineDB.invoices.toArray();
    const parties = await offlineDB.parties.toArray();

    // Get cash/bank accounts
    const cbAccounts = accounts.filter(a => a.type === "cash" || a.type === "bank");
    const cbCodes = cbAccounts.map(a => a.code);

    // Opening Balance
    const openingEntries = journalEntries.filter(entry => {
      const isCashBank = cbCodes.includes(entry.accountCode);
      if (!isCashBank) return false;
      const entryDate = entry.date.split("T")[0];
      return entryDate < fromDate.split("T")[0];
    });

    const openingBalance = openingEntries.reduce((sum, entry) => {
      return sum + (entry.debit || 0) - (entry.credit || 0);
    }, 0);

    // Movements during period
    const periodEntries = journalEntries.filter(entry => {
      const isCashBank = cbCodes.includes(entry.accountCode);
      if (!isCashBank) return false;
      const entryDate = entry.date.split("T")[0];
      const fromD = fromDate.split("T")[0];
      const toD = toDate.split("T")[0];
      return entryDate >= fromD && entryDate <= toD;
    });

    const totalInflow = periodEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalOutflow = periodEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    const closingBalance = openingBalance + totalInflow - totalOutflow;

    // Upcoming Payables
    const today = new Date().toISOString().split("T")[0];
    const payables = invoices.filter(inv => {
      if (inv.type !== "purchase") return false;
      if (!inv.status || !["posted", "received"].includes(inv.status)) return false;
      if (!inv.dueDate) return false;
      return inv.dueDate.split("T")[0] >= today;
    }).sort((a, b) => new Date(a.dueDate || "").getTime() - new Date(b.dueDate || "").getTime()).slice(0, 10);

    const partyMap = new Map(parties.map(p => [p.id, p]));

    // Expected Receivables
    const receivables = invoices.filter(inv => {
      if (inv.type !== "sale") return false;
      if (!inv.status || !["posted", "delivered"].includes(inv.status)) return false;
      if (!inv.dueDate) return false;
      return inv.dueDate.split("T")[0] >= today;
    }).sort((a, b) => new Date(a.dueDate || "").getTime() - new Date(b.dueDate || "").getTime()).slice(0, 10);

    return ok({
      openingBalance,
      totalInflow,
      totalOutflow,
      closingBalance,
      payables: payables.map(p => {
        const party = p.partyId ? partyMap.get(p.partyId) : undefined;
        return {
          vendor: party?.name || "Unknown",
          invoiceNo: p.invoiceNo || "",
          amount: p.totalAmount || 0,
          dueDate: p.dueDate || ""
        };
      }),
      receivables: receivables.map(r => {
        const party = r.partyId ? partyMap.get(r.partyId) : undefined;
        return {
          customer: party?.name || "Unknown",
          invoiceNo: r.invoiceNo || "",
          amount: r.totalAmount || 0,
          dueDate: r.dueDate || ""
        };
      }),
      waterfall: [
        { name: 'Opening', value: openingBalance, type: 'total' },
        { name: 'Total Inflow', value: totalInflow, type: 'inflow' },
        { name: 'Total Outflow', value: -totalOutflow, type: 'outflow' },
        { name: 'Closing', value: closingBalance, type: 'total' },
      ]
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
