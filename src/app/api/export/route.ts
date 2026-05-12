import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import * as XLSX from "xlsx";
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
    console.log("Excel Export: Connecting to DB...");
    await dbConnect();

    const workbook = XLSX.utils.book_new();

    const models = [
      { name: "Accounts", model: Account },
      { name: "Categories", model: Category },
      { name: "Doc Settings", model: DocumentSetting },
      { name: "Employees", model: Employee },
      { name: "Financial Years", model: FinancialYear },
      { name: "Inv Settings", model: InventorySetting },
      { name: "Invoices", model: Invoice },
      { name: "Items", model: Item },
      { name: "Journals", model: Journal },
      { name: "Journal Entries", model: JournalEntry },
      { name: "Payroll", model: Payroll },
      { name: "Print Formats", model: PrintFormat },
      { name: "Roles", model: Role },
      { name: "Shop Profile", model: ShopProfile },
      { name: "Users", model: User },
      { name: "Vehicle Logs", model: VehicleLog },
    ];

    const cleanForExcel = (data: any[]) => {
      if (!data || !Array.isArray(data)) return [];
      return data.map((doc: any) => {
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
    for (const { name, model } of models) {
      try {
        if (!model) continue;
        const data = await model.find({}).lean();
        const cleanData = cleanForExcel(data);
        const ws = XLSX.utils.json_to_sheet(cleanData.length > 0 ? cleanData : [{ Info: "No data" }]);
        XLSX.utils.book_append_sheet(workbook, ws, name.substring(0, 31));
      } catch (err) {
        console.error(`Error exporting ${name}:`, err);
      }
    }

    // Special handling for Parties
    try {
      const allParties = await Party.find({}).lean();
      const customers = cleanForExcel(allParties.filter((p: any) => p.type === "Customer"));
      const vendors = cleanForExcel(allParties.filter((p: any) => p.type === "Vendor"));
      
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(customers.length > 0 ? customers : [{ Info: "No Customers" }]), "Customers");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(vendors.length > 0 ? vendors : [{ Info: "No Vendors" }]), "Vendors");
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
