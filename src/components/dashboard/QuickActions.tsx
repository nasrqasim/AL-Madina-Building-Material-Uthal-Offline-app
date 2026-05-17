"use client";

import { 
  UserPlus, 
  Truck, 
  Package, 
  Users, 
  FileText, 
  Receipt, 
  ClipboardList, 
  ShoppingCart, 
  Banknote,
  Book,
  ChevronRight,
  Zap,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    { title: "Add Customer", href: "/maintain/customers", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Add Vendor", href: "/maintain/vendors", icon: Truck, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Add Item", href: "/maintain/items", icon: Package, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Add Employee", href: "/maintain/employees", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Purchase Invoice", href: "/purchases/purchase-invoice", icon: FileText, color: "text-rose-500", bg: "bg-rose-50" },
    { title: "Sale Invoice", href: "/sales/sale-invoice", icon: Receipt, color: "text-cyan-500", bg: "bg-cyan-50" },
    { title: "Quotation", href: "/sales/quotation", icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Purchase Order", href: "/purchases/purchase-order", icon: ShoppingCart, color: "text-violet-500", bg: "bg-violet-50" },
    { title: "Cash Receipt", href: "/receipts/cash-receipt", icon: Banknote, color: "text-green-500", bg: "bg-green-50" },
    { title: "Other Income", href: "/receipts/other-income", icon: Banknote, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Cash Payment", href: "/payments/cash-payment", icon: CreditCardIcon, color: "text-red-500", bg: "bg-red-50" },
    { title: "Journal Voucher", href: "/journal", icon: Book, color: "text-slate-500 dark:text-slate-400 dark:text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col transition-all duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
          <Zap size={20} fill="currentColor" />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 dark:text-white tracking-tight">Quick Actions</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="flex items-center justify-between group p-3 rounded-2xl border border-transparent hover:border-slate-100 dark:border-slate-800 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${action.bg} dark:bg-slate-800 dark:text-slate-200 ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon size={20} />
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:text-white dark:group-hover:text-white transition-colors">
                {action.title}
              </span>
            </div>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 dark:text-slate-300 group-hover:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:group-hover:text-slate-400 dark:text-slate-500 transition-colors" />
          </Link>
        ))}
      </div>

    </div>
  );
}

function CreditCardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
