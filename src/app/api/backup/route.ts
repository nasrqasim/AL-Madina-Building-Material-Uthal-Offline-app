import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import JSZip from "jszip";
import Account from "@/models/Account";
import Category from "@/models/Category";
import { DocumentSetting } from "@/models/DocumentSetting";
import Employee from "@/models/Employee";
import { FinancialYear } from "@/models/FinancialYear";
import { InventorySetting } from "@/models/InventorySetting";
import Invoice from "@/models/Invoice";
import Item from "@/models/Item";
import Journal from "@/models/Journal";
import JournalEntry from "@/models/JournalEntry";
import Party from "@/models/Party";
import Payroll from "@/models/Payroll";
import { PrintFormat } from "@/models/PrintFormat";
import { Role } from "@/models/Role";
import ShopProfile from "@/models/ShopProfile";
import { User } from "@/models/User";
import VehicleLog from "@/models/VehicleLog";

export async function GET() {
  try {
    await dbConnect();

    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const folderName = `oilshop_backup_${timestamp}`;
    const backupFolder = zip.folder(folderName);

    const models = [
      { name: "accounts", model: Account },
      { name: "categories", model: Category },
      { name: "document_settings", model: DocumentSetting },
      { name: "employees", model: Employee },
      { name: "financial_years", model: FinancialYear },
      { name: "inventory_settings", model: InventorySetting },
      { name: "invoices", model: Invoice },
      { name: "items", model: Item },
      { name: "journals", model: Journal },
      { name: "journal_entries", model: JournalEntry },
      { name: "payroll", model: Payroll },
      { name: "print_formats", model: PrintFormat },
      { name: "roles", model: Role },
      { name: "shop_profile", model: ShopProfile },
      { name: "users", model: User },
      { name: "vehicle_logs", model: VehicleLog },
    ];

    console.log("Starting backup fetch for all models...");
    const modelResults = await Promise.all(
      models.map(async ({ name, model }) => {
        try {
          if (!model) throw new Error(`Model ${name} is undefined`);
          const data = await model.find({}).lean();
          console.log(`Fetched ${data.length} records for ${name}`);
          return { name, data };
        } catch (err) {
          console.error(`Error fetching ${name}:`, err);
          return { name, data: [] };
        }
      })
    );

    for (const { name, data } of modelResults) {
      backupFolder?.file(`${name}.json`, JSON.stringify(data, null, 2));
    }

    // Special handling for Party (Customers and Vendors)
    try {
      const allParties = await Party.find({}).lean();
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
