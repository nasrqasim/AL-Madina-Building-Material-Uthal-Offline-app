import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch both Purchase Orders and regular Purchases
    const invoices = await offlineDB.invoices.toArray();
    const rows = invoices.filter(inv => 
      ["purchase", "purchase_order", "grn", "non_tax_purchase", "import_purchase", "purchase_return", "non_tax_purchase_return"].includes(inv.type)
    );

    // Sort by date descending
    rows.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Populate party data
    const parties = await offlineDB.parties.toArray();
    const partyMap = new Map(parties.map(p => [p.id, p]));

    const populatedRows = rows.map(inv => ({
      ...inv,
      partyId: inv.partyId ? partyMap.get(inv.partyId) : null
    }));

    return ok(populatedRows);
  } catch (e) {
    return fail((e as Error).message);
  }
}
