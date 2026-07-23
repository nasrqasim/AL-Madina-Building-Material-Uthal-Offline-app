import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const qLower = q.toLowerCase();

    // 1. Query parties matching name, companyName, code, phone, mobile
    const allParties = await offlineDB.parties.toArray();
    let parties = allParties.filter((p: any) => 
      p.type === "Customer" && p.status === "Active"
    );

    if (q) {
      parties = parties.filter((p: any) =>
        (p.name && p.name.toLowerCase().includes(qLower)) ||
        (p.companyName && p.companyName.toLowerCase().includes(qLower)) ||
        (p.code && p.code.toLowerCase().includes(qLower)) ||
        (p.phone && p.phone.toLowerCase().includes(qLower)) ||
        (p.mobile && p.mobile.toLowerCase().includes(qLower))
      );
    }

    parties = parties.slice(0, 100);

    // 2. Query invoices by vehicle registration number (regNo)
    if (q && q.length >= 2) {
      const allInvoices = await offlineDB.invoices.toArray();
      const invoiceParties = allInvoices
        .filter((inv: any) => 
          inv.regNo && inv.regNo.toLowerCase().includes(qLower) && inv.partyId
        )
        .map((inv: any) => inv.partyId);

      // Get unique party IDs
      const uniquePartyIds = invoiceParties.filter((value, index, self) => self.indexOf(value) === index);

      if (uniquePartyIds.length > 0) {
        const vehicleParties = allParties.filter((p: any) =>
          uniquePartyIds.includes(p.id) &&
          p.type === "Customer" &&
          p.status === "Active"
        );

        // Merge without duplicates
        const existingIds = new Set((parties || []).map((p: any) => p.id));
        for (const vp of vehicleParties) {
          if (!existingIds.has(vp.id)) {
            parties.push(vp);
          }
        }
      }
    }

    return ok(parties);
  } catch (error: any) {
    console.error("Parties search error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
