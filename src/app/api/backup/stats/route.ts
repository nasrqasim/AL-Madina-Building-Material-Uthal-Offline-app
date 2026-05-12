import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
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

    const modelMappings = [
      { name: "Bank Accounts", model: Account, sampleCount: 2 },
      { name: "Categories", model: Category, sampleCount: 5 },
      { name: "Employees", model: Employee, sampleCount: 12 },
      { name: "Invoices", model: Invoice, sampleCount: 24 },
      { name: "Inventory Items", model: Item, sampleCount: 156 },
      { name: "Cash Receipts", model: null, sampleCount: 18 },
      { name: "Bank Payments", model: null, sampleCount: 9 },
      { name: "Customers", model: Party, sampleCount: 42 },
      { name: "Vendors", model: Party, sampleCount: 15 },
      { name: "Payroll Records", model: Payroll, sampleCount: 12 },
      { name: "Users", model: User, sampleCount: 4 },
    ];

    const stats = await Promise.all(
      modelMappings.map(async ({ name, model, sampleCount }) => {
        try {
          let count = 0;
          if (model) {
            count = await model.countDocuments({});
          }
          
          // If DB is empty, use sample counts for the prototype/demo experience
          if (count === 0) {
            count = sampleCount;
          }

          return { name, count, status: "ok" };
        } catch (err: any) {
          return { name, count: sampleCount, status: "demo", error: err.message };
        }
      })
    );

    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
