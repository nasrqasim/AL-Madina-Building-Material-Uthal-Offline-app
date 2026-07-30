import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  try {
    const rows = await offlineDB.banks.toArray();
    // Sort by createdAt descending
    rows.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return ok(rows);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.isDefault) {
      const allBanks = await offlineDB.banks.toArray();
      for (const bank of allBanks) {
        await offlineDB.banks.update(bank.id, { isDefault: false });
      }
    }
    
    const id = generateUniqueId();
    const openingBal = Number(body.openingBalance ?? body.balance ?? 0);
    const currentBal = Number(body.currentBalance ?? body.balance ?? openingBal);
    
    const bankRecord = {
      id,
      _id: id,
      code: body.code || `BANK-${Date.now()}`,
      name: body.name || "",
      accountNo: body.accountNo || "",
      accountTitle: body.accountTitle || "",
      iban: body.iban || "",
      swift: body.swift || "",
      type: body.type || "Current Account",
      branch: body.branch || "",
      branchCode: body.branchCode || "",
      openingBalance: openingBal,
      currentBalance: currentBal,
      availableBalance: Number(body.availableBalance ?? currentBal),
      balance: currentBal,
      status: body.status || "Active",
      isDefault: body.isDefault || false,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await offlineDB.banks.add(bankRecord);
    return ok(bankRecord, 201);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body._id || body.id;
    
    if (!id) {
      return fail("Bank ID is required");
    }
    
    if (body.isDefault) {
      const allBanks = await offlineDB.banks.toArray();
      for (const bank of allBanks) {
        if (bank.id !== id) {
          await offlineDB.banks.update(bank.id, { isDefault: false });
        }
      }
    }
    
    const currentBal = Number(body.currentBalance ?? body.balance ?? 0);
    const updatedBank = {
      code: body.code,
      name: body.name,
      accountNo: body.accountNo,
      accountTitle: body.accountTitle,
      iban: body.iban,
      swift: body.swift,
      type: body.type,
      branch: body.branch,
      branchCode: body.branchCode,
      openingBalance: Number(body.openingBalance ?? 0),
      currentBalance: currentBal,
      availableBalance: Number(body.availableBalance ?? currentBal),
      balance: currentBal,
      status: body.status,
      isDefault: body.isDefault,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await offlineDB.banks.update(id, updatedBank);
    const updated = await offlineDB.banks.get(id);
    return ok(updated);
  } catch (e) {
    console.error("Error updating bank:", e);
    return fail((e as Error).message);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return fail("Bank ID is required");
    }
    
    await offlineDB.banks.delete(id);
    return ok({ message: "Bank deleted successfully" });
  } catch (e) {
    console.error("Error deleting bank:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
