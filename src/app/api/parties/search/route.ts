import { ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Party from "@/models/Party";
import Invoice from "@/models/Invoice";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    await dbConnect();

    // 1. Query parties matching name, companyName, code, phone, mobile
    const partyQuery: any = {
      type: "Customer",
      status: "Active",
    };

    if (q) {
      partyQuery.$or = [
        { name: { $regex: q, $options: "i" } },
        { companyName: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { mobile: { $regex: q, $options: "i" } }
      ];
    }

    let parties: any[] = await Party.find(partyQuery).limit(100).lean();

    // 2. Query invoices by vehicle registration number (regNo)
    if (q && q.length >= 2) {
      const invoiceParties = await Invoice.find({
        regNo: { $regex: q, $options: "i" },
        partyId: { $ne: null }
      }).distinct("partyId");

      if (invoiceParties.length > 0) {
        const vehicleParties = await Party.find({
          _id: { $in: invoiceParties },
          type: "Customer",
          status: "Active"
        }).lean();

        // Merge without duplicates
        const existingIds = new Set(parties.map((p: any) => p._id.toString()));
        for (const vp of vehicleParties) {
          if (!existingIds.has((vp as any)._id.toString())) {
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
