import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { recalculatePartyBalance, getCustomerAdvanceStats } from "@/lib/offline/postingService";
import { generateUniqueId } from "@/lib/dexie";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");

  let parties = await offlineDB.parties.toArray();
  
  if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
    parties = parties.filter(p => p.type === "Customer");
  } else if (typeParam === "customer") {
    parties = parties.filter(p => p.type === "Customer");
  } else if (typeParam === "vendor") {
    parties = parties.filter(p => p.type === "Vendor");
  }
  
  // Sort by createdAt descending
  parties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const rowsWithStats = await Promise.all(parties.map(async (r: any) => {
    if (r.type === "Customer") {
      try {
        // Recalculate balance to ensure it's up-to-date
        await recalculatePartyBalance(r.id);
        const updatedParty = await offlineDB.parties.get(r.id);
        const stats = await getCustomerAdvanceStats(r.id);
        return { ...updatedParty, advanceStats: stats };
      } catch (err) {
        return r;
      }
    }
    return r;
  }));

  return ok(rowsWithStats);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");

    const body = await req.json();

    if (normalizedRole === "sales_user" || normalizedRole === "salesuser") {
      if (body.type !== "Customer") {
        return fail("Permission denied (Restricted party type)", 403);
      }
    }

    const id = generateUniqueId();
    
    if (body.openingBalance && (!body.balance || body.balance === 0)) {
      body.balance = body.openingBalance;
    }
    
    const partyRecord = {
      id,
      _id: id,
      code: body.code || `PARTY-${Date.now().toString().slice(-6)}`,
      name: body.name || "",
      companyName: body.companyName || body.name || "",
      type: body.type || "Customer",
      address: body.address || "",
      city: body.city || "",
      phone: body.phone || "",
      mobile: body.mobile || "",
      email: body.email || "",
      ntn: body.ntn || "",
      gst: body.gst || "",
      creditLimit: body.creditLimit || 0,
      balance: body.balance || 0,
      openingBalance: body.openingBalance || 0,
      debit: 0,
      credit: 0,
      isActive: body.isActive !== false,
      status: body.status || "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.parties.add(partyRecord);
    await recalculatePartyBalance(id);
    
    const finalRow = await offlineDB.parties.get(id);
    return ok(finalRow || partyRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
