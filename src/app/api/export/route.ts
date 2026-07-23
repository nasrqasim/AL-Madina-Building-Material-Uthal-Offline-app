import { NextResponse } from "next/server";
import { offlineDB } from "@/lib/dexie";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    console.log("Excel Export: Fetching from IndexedDB...");
    const workbook = XLSX.utils.book_new();

    const tables = [
      { name: "Accounts", table: "accounts" },
      { name: "Categories", table: "categories" },
      { name: "Employees", table: "employees" },
      { name: "Invoices", table: "invoices" },
      { name: "Items", table: "items" },
      { name: "Journal Entries", table: "journalEntries" },
      { name: "Cash Receipts", table: "cashReceipts" },
      { name: "Cash Payments", table: "cashPayments" },
      { name: "Bank Receipts", table: "bankReceipts" },
      { name: "Bank Payments", table: "bankPayments" },
      { name: "Shop Profile", table: "shopProfiles" },
      { name: "Users", table: "users" },
      { name: "Banks", table: "banks" },
      { name: "Locations", table: "locations" },
      { name: "Settings", table: "settings" },
    ];

    const cleanForExcel = (data: any[]) => {
      if (!data || !Array.isArray(data)) return [];
      return (data || []).map((doc: any) => {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(doc)) {
          if (key === "__v" || key === "password") continue;
          if (value && typeof value === 'object') {
            if (value instanceof Date) {
              cleaned[key] = value.toISOString();
            } else {
              try {
                cleaned[key] = JSON.stringify(value);
              } catch (e) {
                cleaned[key] = String(value);
              }
            }
          } else {
            cleaned[key] = value;
          }
        }
        return cleaned;
      });
    };

    console.log("Excel Export: Fetching data...");
    for (const { name, table } of tables) {
      try {
        const tableRef: any = (offlineDB as any)[table];
        if (!tableRef) continue;
        const data = await tableRef.toArray();
        const cleanData = cleanForExcel(data);
        const ws = XLSX.utils.json_to_sheet(cleanData.length > 0 ? cleanData : [{ Info: "No data" }]);
        XLSX.utils.book_append_sheet(workbook, ws, name.substring(0, 31));
      } catch (err) {
        console.error(`Error exporting ${name}:`, err);
      }
    }

    // Special handling for Parties
    try {
      const allParties = await offlineDB.parties.toArray();
      const customers = cleanForExcel(allParties.filter((p: any) => p.type === "Customer"));
      const vendors = cleanForExcel(allParties.filter((p: any) => p.type === "Vendor"));

      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet((customers || []).length > 0 ? customers : [{ Info: "No Customers" }]), "Customers");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet((vendors || []).length > 0 ? vendors : [{ Info: "No Vendors" }]), "Vendors");
    } catch (err) {
      console.error("Error exporting parties:", err);
    }

    console.log("Excel Export: Writing workbook...");
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="oilshop_export_${timestamp}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Critical Export Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
