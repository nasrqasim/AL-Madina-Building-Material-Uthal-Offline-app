import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Party from "@/models/Party";
import Employee from "@/models/Employee";
import Job from "@/models/Job";
import Location from "@/models/Location";
import { generateInvoiceJournalEntries } from "@/services/posting/invoicePostingHelper";
import { normalizeInvoicePayload } from "@/lib/invoicePayload";
import { getPopulatedInvoice } from "@/lib/invoiceQueries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const partyId = searchParams.get("partyId");

    const query: any = {};
    if (type) query.type = type;
    if (partyId) query.partyId = partyId;

    await dbConnect();
    const rows = await Invoice.find(query)
      .populate("partyId", "companyName name")
      .populate("employeeId", "name")
      .populate("jobId", "title name")
      .populate("locationId", "name")
      .populate("lines.itemId", "name code category unit")
      .sort({ createdAt: -1 })
      .lean();

    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    const body = await req.json();
    await dbConnect();

    const payload = normalizeInvoicePayload(body);

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if (payload.type !== "sale" && payload.type !== "sale_return" && payload.type !== "pos") {
        return fail("Permission denied (Restricted invoice type)", 403);
      }
    }

    if (payload.partyId) {
      const party = await Party.findById(payload.partyId).lean() as any;
      if (party && (party.name || party.companyName || "").toLowerCase().includes("walk-in")) {
        payload.amountReceived = payload.totalAmount;
        payload.balance = 0;
      }
    }

    const row = await Invoice.create(payload);

    await generateInvoiceJournalEntries(row);

    const populated = await getPopulatedInvoice(String(row._id));
    return ok(populated ?? row, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}
