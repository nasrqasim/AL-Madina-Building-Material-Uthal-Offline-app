"use client";

import { 
  FileText, 
  BookOpen, 
  Scale, 
  TrendingUp, 
  FileBarChart, 
  ShoppingCart, 
  Receipt, 
  History, 
  Box, 
  AlertTriangle, 
  Clock, 
  Users, 
  Truck 
} from "lucide-react";
import Link from "next/link";

export default function QuickReports() {
  const reports = [
    { title: "Account Ledger", href: "/reports/financial/ledger", icon: FileText, color: "text-rose-500", bg: "bg-rose-50" },
    { title: "Journal Report", href: "/journal", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Trial Balance", href: "/reports/financial/trial-balance", icon: Scale, color: "text-cyan-500", bg: "bg-cyan-50" },
    { title: "Profit & Loss", href: "/reports/financial/profit-loss", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Balance Sheet", href: "/reports/financial/balance-sheet", icon: FileBarChart, color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Purchase Register", href: "/reports/purchase/register", icon: ShoppingCart, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Sale Register", href: "/reports/sales/register", icon: Receipt, color: "text-pink-500", bg: "bg-pink-50" },
    { title: "Item History", href: "/reports/inventory/ledger", icon: History, color: "text-teal-500", bg: "bg-teal-50" },
    { title: "Stock Summary", href: "/reports/inventory/balances", icon: Box, color: "text-slate-500 dark:text-slate-400 dark:text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50" },
    { title: "Low Stock Alert", href: "/reports/inventory/low-stock", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
    { title: "AP Aging", href: "/reports/purchase/payable-aging", icon: Clock, color: "text-violet-500", bg: "bg-violet-50" },
    { title: "AR Aging", href: "/reports/sales/ar-aging", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Customer Balances", href: "/reports/sales/customer-balances", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Vendor Balances", href: "/reports/purchase/vendor-balances", icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-400 dark:text-slate-500 rounded-lg">
          <FileBarChart size={20} />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 dark:text-white tracking-tight">Quick Reports</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {reports.map((report) => (
          <Link
            key={report.title}
            href={report.href}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border border-transparent hover:border-slate-100 dark:border-slate-800 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-all group"
          >
            <div className={`p-4 rounded-xl ${report.bg} dark:bg-slate-800 dark:text-slate-200 ${report.color} mb-3 group-hover:scale-110 transition-transform`}>
              <report.icon size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 text-center uppercase tracking-wider group-hover:text-slate-900 dark:text-white dark:group-hover:text-white transition-colors">
              {report.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
