import { ERPNavItem } from "@/types/erp";

import { 
  LayoutDashboard, 
  Settings, 
  Database, 
  ShoppingCart, 
  BadgeDollarSign, 
  Receipt, 
  CreditCard, 
  BookOpen, 
  BarChart3,
  Users,
  UserPlus,
  Building2,
  MapPin,
  Briefcase,
  Coins,
  FileSpreadsheet,
  Network,
  Warehouse,
  Scale,
  Sparkles
} from "lucide-react";

export const erpModules: ERPNavItem[] = [
  { 
    title: "Dashboard", 
    href: "/dashboard", 
    roles: ["admin", "salesman", "dataentry"],
    icon: LayoutDashboard 
  },
  { 
    title: "AI Studio", 
    href: "/ai-studio", 
    roles: ["admin", "salesman", "dataentry"],
    icon: Sparkles 
  },
  { 
    title: "Settings", 
    href: "/settings", 
    roles: ["admin"],
    icon: Settings,
    submenu: [
      { title: "My Company", href: "/settings/company", roles: ["admin"] },
      { title: "Users & Roles", href: "/settings/users", roles: ["admin"] },
      { title: "Financial Year", href: "/settings/financial-year", roles: ["admin"] },
      { title: "Document Settings", href: "/settings/documents", roles: ["admin"] },
      { title: "Print Formats", href: "/settings/print-formats", roles: ["admin"] },
      { title: "Inventory Movement", href: "/settings/inventory-movement", roles: ["admin"] },
      { title: "Backup & Export", href: "/settings/backup", roles: ["admin"] },
      { title: "Wipe All Data", href: "/settings/wipe-data", roles: ["admin"] },
    ]
  },
  { 
    title: "Maintain", 
    href: "/maintain", 
    roles: ["admin", "dataentry"],
    icon: Database,
    submenu: [
      { title: "Chart of Accounts", href: "/maintain/accounts", roles: ["admin", "dataentry"] },
      { title: "Expenses", href: "/maintain/expenses", roles: ["admin", "dataentry"] },
      { title: "Customer Balances", href: "/maintain/customer-balances", roles: ["admin", "dataentry"] },
      { title: "Vendors", href: "/maintain/vendors", roles: ["admin", "dataentry"] },
      { title: "Banks", href: "/maintain/banks", roles: ["admin", "dataentry"] },
      { title: "Items / Products", href: "/maintain/items", roles: ["admin", "dataentry"] },
      { title: "Chart of Inventory", href: "/inventory/chart", roles: ["admin", "dataentry"] },
      { title: "Inventory Locations", href: "/maintain/locations", roles: ["admin", "dataentry"] },
      { title: "Employees", href: "/maintain/employees", roles: ["admin", "dataentry"] },
      { title: "Regions", href: "/maintain/regions", roles: ["admin", "dataentry"] },
      { title: "Jobs / Projects", href: "/maintain/jobs", roles: ["admin", "dataentry"] },
      { title: "Opening Balances", href: "/maintain/opening-balances", roles: ["admin", "dataentry"] },
      { title: "Import Templates", href: "/maintain/import-templates", roles: ["admin", "dataentry"] },
      { title: "Units of Measure", href: "/maintain/units", roles: ["admin", "dataentry"] },
    ]
  },
  { 
    title: "Purchases", 
    href: "/purchases", 
    roles: ["admin", "dataentry"],
    icon: ShoppingCart,
    submenu: [
      { title: "Purchase Order", href: "/purchases/purchase-order", roles: ["admin", "dataentry"] },
      { title: "Purchase Invoice", href: "/purchases/purchase-invoice", roles: ["admin", "dataentry"] },
      { title: "Purchase Return", href: "/purchases/purchase-return", roles: ["admin", "dataentry"] },
    ]
  },
  { 
    title: "Sales", 
    href: "/sales", 
    roles: ["admin", "salesman", "dataentry"],
    icon: BadgeDollarSign,
    submenu: [
      { title: "Sale Order", href: "/sales/sale-order", roles: ["admin", "salesman", "dataentry"] },
      { title: "Sale Invoice", href: "/sales/sale-invoice", roles: ["admin", "salesman", "dataentry"] },
      { title: "Sale Return", href: "/sales/sale-return", roles: ["admin", "salesman", "dataentry"] },
      { title: "POS Counter Sale", href: "/sales/pos-counter-sale", roles: ["admin", "salesman", "dataentry"] },
    ]
  },
  { 
    title: "Store", 
    href: "/store", 
    roles: ["admin", "dataentry"],
    icon: Warehouse,
    submenu: [
      { title: "Production Order", href: "/store/production-order", roles: ["admin", "dataentry"] },
    ]
  },
  { 
    title: "Receipts", 
    href: "/receipts", 
    roles: ["admin", "salesman", "dataentry"],
    icon: Receipt,
    submenu: [
      { title: "Cash Receipt", href: "/receipts/cash-receipt", roles: ["admin", "salesman", "dataentry"] },
      { title: "Bank Receipt", href: "/receipts/bank-receipt", roles: ["admin", "salesman", "dataentry"] },
      { title: "Other Income", href: "/receipts/other-income", roles: ["admin", "salesman", "dataentry"] },
    ]
  },
  { 
    title: "Payments", 
    href: "/payments", 
    roles: ["admin", "dataentry"],
    icon: CreditCard,
    submenu: [
      { title: "Cash Payment", href: "/payments/cash-payment", roles: ["admin", "dataentry"] },
      { title: "Bank Payment", href: "/payments/bank-payment", roles: ["admin", "dataentry"] },
    ]
  },
  { 
    title: "Journal", 
    href: "/journal", 
    roles: ["admin", "dataentry"],
    icon: BookOpen 
  },
  { 
    title: "Salary", 
    href: "/salary", 
    roles: ["admin", "superadmin", "salesman", "dataentry"],
    icon: Network,
    submenu: [
      { title: "Salary Staff", href: "/salary/staff-salary", roles: ["admin", "superadmin", "salesman", "dataentry"] },
      { title: "Advance", href: "/salary/advance", roles: ["admin", "superadmin", "salesman", "dataentry"] },
      { title: "Loan", href: "/salary/loan", roles: ["admin", "superadmin", "salesman", "dataentry"] },
      { title: "Payroll Run", href: "/salary/payroll-run", roles: ["admin", "superadmin", "salesman", "dataentry"] },
      { title: "Final Settlement", href: "/salary/final-settlement", roles: ["admin", "superadmin", "salesman", "dataentry"] },
    ]
  },
  { 
    title: "Reports", 
    href: "/reports", 
    roles: ["admin", "salesman"],
    icon: BarChart3,
    submenu: [
      {
        title: "Main Reports",
        href: "/reports/main",
        roles: ["admin", "salesman"],
        submenu: [
          { title: "Journal Report", href: "/reports/main/journal", roles: ["admin", "salesman"] },
          { title: "Serial Tracking", href: "/reports/main/serial-tracking", roles: ["admin", "salesman"] },
          { title: "PO Tracking", href: "/reports/main/po-tracking", roles: ["admin", "salesman"] },
          { title: "SO Tracking", href: "/reports/main/so-tracking", roles: ["admin", "salesman"] },
        ]
      },
      {
        title: "Purchase Reports",
        href: "/reports/purchase",
        roles: ["admin", "salesman"],
        submenu: [
          { title: "Purchase Summary", href: "/reports/purchase/summary", roles: ["admin", "salesman"] },
          { title: "Purchase Register", href: "/reports/purchase/register", roles: ["admin", "salesman"] },
          { title: "Vendor Payments", href: "/reports/purchase/vendor-payments", roles: ["admin", "salesman"] },
          { title: "Vendor Balances", href: "/reports/purchase/vendor-balances", roles: ["admin", "salesman"] },
        ]
      },
      {
        title: "Sale Reports",
        href: "/reports/sales",
        roles: ["admin", "salesman"],
        submenu: [
          { title: "POS Sales", href: "/reports/sales/pos-sales", roles: ["admin", "salesman"] },
          { title: "Salesman Incentive", href: "/reports/sales/salesman-incentive", roles: ["admin", "salesman"] },
          { title: "Item-wise Profit & Loss", href: "/reports/sales/item-profit-loss", roles: ["admin", "salesman"] },
          { title: "Customer Balances", href: "/reports/sales/customer-balances", roles: ["admin", "salesman"] },
        ]
      },
      {
        title: "Inventory Reports",
        href: "/reports/inventory",
        roles: ["admin", "salesman"],
        submenu: [
          { title: "Inventory Ledger", href: "/reports/inventory/ledger", roles: ["admin", "salesman"] },
          { title: "Inventory Balances", href: "/reports/inventory/balances", roles: ["admin", "salesman"] },
          { title: "Low Stock Alert", href: "/reports/inventory/low-stock", roles: ["admin", "salesman"] },
          { title: "Inventory Intelligence", href: "/reports/inventory/intelligence", roles: ["admin", "salesman"] },
        ]
      },
      {
        title: "Financial Reports",
        href: "/reports/financial",
        roles: ["admin", "salesman"],
        submenu: [
          { title: "Ledger Report", href: "/reports/financial/ledger", roles: ["admin", "salesman"] },
          { title: "Trial Balance", href: "/reports/financial/trial-balance", roles: ["admin", "salesman"] },
          { title: "Profit & Loss", href: "/reports/financial/profit-loss", roles: ["admin", "salesman"] },
          { title: "Balance Sheet", href: "/reports/financial/balance-sheet", roles: ["admin", "salesman"] },
        ]
      },
      {
        title: "Salary Reports",
        href: "/reports/salary",
        roles: ["admin", "salesman"],
        submenu: [
          { title: "Salary Register", href: "/reports/salary/register", roles: ["admin", "salesman"] },
          { title: "Staff Loan & Advance", href: "/reports/salary/loan-advance", roles: ["admin", "salesman"] },
          { title: "Statutory Contributions", href: "/reports/salary/statutory", roles: ["admin", "salesman"] },
        ]
      },
    ]
  },
];
