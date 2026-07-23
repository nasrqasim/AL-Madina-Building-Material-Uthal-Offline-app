import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// TODO: Update these service functions to use IndexedDB
// import { recalculatePartyBalance, getCustomerAdvanceStats } from "@/services/posting/invoicePostingHelper";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    const url = new URL(req.url);
    const refresh = url.searchParams.get("refresh") === "1";

    if (refresh) {
      // TODO: await recalculatePartyBalance(params.id);
    }

    const row = await offlineDB.parties.get(params.id);
    if (!row) return fail("Party not found", 404);

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if ((row as any).type !== "Customer") {
        return fail("Permission denied", 403);
      }
    }

    // Calculate advance stats for customers
    let advanceStats = null;
    if ((row as any).type === "Customer") {
      // TODO: advanceStats = await getCustomerAdvanceStats(params.id);
    }

    return ok({ ...(row as any), advanceStats });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      const existing = await offlineDB.parties.get(params.id);
      if (!existing || (existing as any).type !== "Customer") {
        return fail("Permission denied", 403);
      }
    }

    const body = await req.json();

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if (body.type && body.type !== "Customer") {
        return fail("Permission denied (Restricted party type)", 403);
      }
    }

    const updatedParty = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    await offlineDB.parties.update(params.id, updatedParty);
    const row = await offlineDB.parties.get(params.id);
    if (!row) return fail("Party not found", 404);
    
    // TODO: Automatically recalculate the balance using the updated openingBalance
    // await recalculatePartyBalance(params.id);
    
    return ok(row);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      const existing = await offlineDB.parties.get(params.id);
      if (!existing || (existing as any).type !== "Customer") {
        return fail("Permission denied", 403);
      }
    }

    await offlineDB.parties.delete(params.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
