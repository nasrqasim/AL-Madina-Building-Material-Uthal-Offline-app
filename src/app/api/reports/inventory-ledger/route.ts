import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

const IN_TYPES = new Set([
  "purchase",
  "import_purchase",
  "non_tax_purchase",
  "sale_return",
  "non_tax_sale_return",
  "add_stock",
  "grn",
]);

const OUT_TYPES = new Set([
  "sale",
  "non_tax_sale",
  "pos",
  "pos_counter_sale",
  "purchase_return",
  "non_tax_purchase_return",
  "reduce_stock",
  "challan",
]);

function parseLocalDate(value: string, endOfDay = false): Date {
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (endOfDay) dt.setHours(23, 59, 59, 999);
  else dt.setHours(0, 0, 0, 0);
  return dt;
}

function resolveLineItemId(line: { itemId?: unknown }): string {
  const id = line.itemId;
  if (!id) return "";
  if (typeof id === "object" && id !== null) {
    if ("_id" in (id as object)) return String((id as { _id: unknown })._id);
    if ("id" in (id as object)) return String((id as { id: unknown }).id);
    if (typeof (id as any).toString === "function") return (id as any).toString();
  }
  return String(id);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return fail("itemId is required");

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const fromDate = from ? parseLocalDate(from) : null;
    const toDate = to ? parseLocalDate(to, true) : null;

    // Get all invoices and filter
    const allInvoices = await offlineDB.invoices.toArray();
    const invoices = allInvoices
      .filter((inv: any) => 
        inv.status && 
        !["cancelled", "Cancelled"].includes(inv.status) &&
        inv.lines &&
        inv.lines.some((line: any) => resolveLineItemId(line) === itemId)
      )
      .sort((a: any, b: any) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    // Get locations and parties for population
    const allLocations = await offlineDB.locations.toArray();
    const allParties = await offlineDB.parties.toArray();

    const rows: Array<{
      date: Date;
      refNo: string;
      type: string;
      location: string;
      partyName: string;
      in: number;
      out: number;
      rate: number;
      total: number;
    }> = [];

    for (const inv of invoices) {
      const invType = String(inv.type || "");
      const isIn = IN_TYPES.has(invType);
      const isOut = OUT_TYPES.has(invType);
      if (!isIn && !isOut) continue;

      // Populate location
      let locationName = "Main Warehouse";
      if (inv.locationId) {
        const location = allLocations.find((l: any) => l.id === inv.locationId);
        if (location) locationName = location.name;
      }

      // Populate party
      let partyName = invType.toLowerCase().includes("sale") ? "Walk-in (Cash) Customer" : "Cash Vendor";
      if (inv.partyId) {
        const party = allParties.find((p: any) => p.id === inv.partyId);
        if (party) partyName = party.name || party.companyName || partyName;
      }

      for (const line of inv.lines || []) {
        if (resolveLineItemId(line) !== itemId) continue;

        // Use dynamic quantity field
        let qty = Number((line as any).quantity) || 0;
        if (qty <= 0) {
          const liters = Number(line.liters) || 0;
          const gallons = Number(line.gallons) || 0;
          if (liters > 0) qty = liters;
          else if (gallons > 0) qty = gallons;
          else continue;
        }

        rows.push({
          date: new Date(inv.date),
          refNo: inv.invoiceNo || "",
          type: invType.replace(/_/g, " ").toUpperCase(),
          location: locationName,
          partyName,
          in: isIn ? qty : 0,
          out: isOut ? qty : 0,
          rate: Number(line.rate) || 0,
          total: Number(line.netAmount) || qty * (Number(line.rate) || 0),
        });
      }
    }

    let runningBalance = 0;
    const rowsWithBalance = (rows || []).map((row) => {
      runningBalance += row.in - row.out;
      if (runningBalance < 0) runningBalance = 0;
      return { ...row, balance: runningBalance };
    });

    let openingBalance = 0;
    const beforeRows = rowsWithBalance.filter(row => fromDate && new Date(row.date) < fromDate);
    if (beforeRows.length > 0) {
      openingBalance = beforeRows[beforeRows.length - 1].balance;
    }

    const periodRows = rowsWithBalance.filter(row => {
      const rowDate = new Date(row.date);
      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;
      return true;
    });

    const totalIn = periodRows.reduce((s, r) => s + r.in, 0);
    const totalOut = periodRows.reduce((s, r) => s + r.out, 0);
    const closingBalance =
      periodRows.length > 0 ? periodRows[periodRows.length - 1].balance : openingBalance;

    return ok({
      rows: periodRows,
      openingBalance,
      totalIn,
      totalOut,
      closingBalance,
    });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
