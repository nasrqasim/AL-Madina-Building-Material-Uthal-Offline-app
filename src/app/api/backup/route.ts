import { NextResponse } from "next/server";
import { offlineDB } from "@/lib/dexie";
import JSZip from "jszip";

export async function GET() {
  try {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const folderName = `oilshop_backup_${timestamp}`;
    const backupFolder = zip.folder(folderName);

    const tables = [
      "accounts",
      "categories",
      "brands",
      "units",
      "items",
      "parties",
      "invoices",
      "journalEntries",
      "cashReceipts",
      "cashPayments",
      "bankReceipts",
      "bankPayments",
      "shopProfiles",
      "deliveryOrders",
      "activityLogs",
      "backupHistories",
      "settings",
      "locations",
      "employees",
      "banks",
      "otherIncomes",
      "users",
      "drafts",
      "syncQueue"
    ];

    console.log("Starting backup fetch for all tables...");
    const tableResults = await Promise.all(
      tables.map(async (tableName) => {
        try {
          const table: any = (offlineDB as any)[tableName];
          if (!table) {
            console.warn(`Table ${tableName} not found`);
            return { name: tableName, data: [] };
          }
          const data = await table.toArray();
          console.log(`Fetched ${data.length} records for ${tableName}`);
          return { name: tableName, data };
        } catch (err) {
          console.error(`Error fetching ${tableName}:`, err);
          return { name: tableName, data: [] };
        }
      })
    );

    for (const { name, data } of tableResults) {
      backupFolder?.file(`${name}.json`, JSON.stringify(data, null, 2));
    }

    // Special handling for Party (Customers and Vendors)
    try {
      const allParties = await offlineDB.parties.toArray();
      const customers = allParties.filter((p: any) => p.type === "Customer");
      const vendors = allParties.filter((p: any) => p.type === "Vendor");

      backupFolder?.file(`customers.json`, JSON.stringify(customers, null, 2));
      backupFolder?.file(`vendors.json`, JSON.stringify(vendors, null, 2));
      backupFolder?.file(`all_parties.json`, JSON.stringify(allParties, null, 2));

      console.log(`Fetched ${customers.length} customers and ${vendors.length} vendors`);
    } catch (err) {
      console.error("Error fetching parties:", err);
      backupFolder?.file(`customers.json`, "[]");
      backupFolder?.file(`vendors.json`, "[]");
    }

    console.log("Zipping contents...");
    const content = await zip.generateAsync({ type: "uint8array" });
    console.log("Zip generation complete, size:", content.length);

    return new NextResponse(content as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=oilshop_backup_${timestamp}.zip`,
      },
    });
  } catch (error: any) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: "Failed to create backup", details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
