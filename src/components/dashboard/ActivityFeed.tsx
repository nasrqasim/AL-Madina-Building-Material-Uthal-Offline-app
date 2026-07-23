"use client";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

import { useState, useEffect } from "react";
import { Activity, ExternalLink, Package, ShoppingCart, User, Shield, Info, CheckCircle2, Clock, LogIn, Database } from "lucide-react";
import Link from "next/link";
import { offlineDB } from "@/lib/dexie";

export default function ActivityFeed() {
  const [activeTab, setActiveTab] = useState("Transactions");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tabs = ["Transactions", "Activities", "Active Users"];

  useEffect(() => {
    if (activeTab === "Transactions") {
      const fetchTransactions = async () => {
        setIsLoading(true);
        try {
          const targetDate = new Date();
          const startOfDay = new Date(targetDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(targetDate);
          endOfDay.setHours(23, 59, 59, 999);

          const activities: any[] = [];

          // Recent Sales Invoices
          const recentSales = await offlineDB.invoices
            .filter(inv => 
              ["sale", "non_tax_sale", "pos", "challan"].includes(inv.type) && 
              inv.status !== "cancelled" &&
              new Date(inv.date) >= startOfDay && 
              new Date(inv.date) <= endOfDay
            )
            .reverse()
            .limit(10)
            .toArray();
          
          for (const sale of recentSales) {
            const party = sale.partyId ? await offlineDB.parties.get(sale.partyId) : null;
            activities.push({
              type: "sale",
              description: `Sale Invoice #${sale.invoiceNo} created`,
              amount: sale.totalAmount,
              party: party?.name || "Unknown",
              date: sale.date
            });
          }
          
          // Recent Sale Returns
          const recentSaleReturns = await offlineDB.invoices
            .filter(inv => 
              ["sale_return", "non_tax_sale_return"].includes(inv.type) && 
              inv.status !== "cancelled" &&
              new Date(inv.date) >= startOfDay && 
              new Date(inv.date) <= endOfDay
            )
            .reverse()
            .limit(5)
            .toArray();
          
          for (const ret of recentSaleReturns) {
            const party = ret.partyId ? await offlineDB.parties.get(ret.partyId) : null;
            activities.push({
              type: "sale_return",
              description: `Sale Return #${ret.invoiceNo} posted`,
              amount: ret.totalAmount,
              party: party?.name || "Unknown",
              date: ret.date
            });
          }
          
          // Recent Purchase Invoices
          const recentPurchases = await offlineDB.invoices
            .filter(inv => 
              ["purchase", "non_tax_purchase", "import_purchase"].includes(inv.type) && 
              inv.status !== "cancelled" &&
              new Date(inv.date) >= startOfDay && 
              new Date(inv.date) <= endOfDay
            )
            .reverse()
            .limit(5)
            .toArray();
          
          for (const purchase of recentPurchases) {
            const party = purchase.partyId ? await offlineDB.parties.get(purchase.partyId) : null;
            activities.push({
              type: "purchase",
              description: `Purchase Invoice #${purchase.invoiceNo} posted`,
              amount: purchase.totalAmount,
              party: party?.name || "Unknown",
              date: purchase.date
            });
          }
          
          // Sort by date descending
          activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Format activities for display
          const formattedTransactions = activities.map((activity: any) => {
              let iconBg, amountColor, Icon, typeColor;
              
              switch(activity.type) {
                case 'sale':
                  iconBg = "bg-emerald-50 text-emerald-500";
                  amountColor = "text-emerald-500";
                  Icon = ShoppingCart;
                  typeColor = "text-emerald-500";
                  break;
                case 'sale_return':
                  iconBg = "bg-rose-50 text-rose-500";
                  amountColor = "text-rose-500";
                  Icon = ShoppingCart;
                  typeColor = "text-rose-500";
                  break;
                case 'purchase':
                  iconBg = "bg-rose-50 text-rose-500";
                  amountColor = "text-rose-500";
                  Icon = Package;
                  typeColor = "text-rose-500";
                  break;
                case 'purchase_return':
                  iconBg = "bg-emerald-50 text-emerald-500";
                  amountColor = "text-emerald-500";
                  Icon = Package;
                  typeColor = "text-emerald-500";
                  break;
                case 'cash_receipt':
                  iconBg = "bg-emerald-50 text-emerald-500";
                  amountColor = "text-emerald-500";
                  Icon = ShoppingCart;
                  typeColor = "text-emerald-500";
                  break;
                case 'cash_payment':
                  iconBg = "bg-rose-50 text-rose-500";
                  amountColor = "text-rose-500";
                  Icon = Package;
                  typeColor = "text-rose-500";
                  break;
                case 'bank_receipt':
                  iconBg = "bg-emerald-50 text-emerald-500";
                  amountColor = "text-emerald-500";
                  Icon = ShoppingCart;
                  typeColor = "text-emerald-500";
                  break;
                case 'bank_payment':
                  iconBg = "bg-rose-50 text-rose-500";
                  amountColor = "text-rose-500";
                  Icon = Package;
                  typeColor = "text-rose-500";
                  break;
                default:
                  iconBg = "bg-slate-50 text-slate-500";
                  amountColor = "text-slate-500";
                  Icon = Activity;
                  typeColor = "text-slate-500";
              }

              return {
                id: activity.description,
                status: "Posted",
                user: activity.party || "System",
                type: activity.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                time: new Date(activity.date).toLocaleDateString(),
                amount: activity.amount ? `Rs.${activity.amount.toLocaleString()}` : '-',
                color: "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
                amountColor,
                Icon,
                iconBg,
                typeColor
              };
            });

            setTransactions(formattedTransactions);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransactions();
    }
  }, [activeTab]);

  const activities = [
    { title: "System Ready", desc: "APP_NAME is running 100% offline in Local Mode.", time: "Live", Icon: Database, iconBg: "bg-purple-50 text-purple-600" },
  ];

  const activeUsers = [
    { initials: "U", name: "Current User", role: "admin", time: "Now", status: "online", color: "bg-maroon-800 text-white" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
            <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-maroon-50 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-400 rounded-lg">
                <Activity size={18} />
            </div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 dark:text-white tracking-tight">Activity Feed</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Recent transactions and system activities</p>
        </div>
        <Link 
          href="/reports" 
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-maroon-800 transition-colors border border-slate-200 dark:border-slate-800 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800"
        >
          View More
          <ExternalLink size={12} />
        </Link>
      </div>

      <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${
              activeTab === tab 
                ? "bg-maroon-800 text-white shadow-md" 
                : "text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {activeTab === "Transactions" && (transactions || []).map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${item.iconBg} dark:bg-slate-800 dark:text-slate-200`}>
                <item.Icon size={16} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-maroon-800 dark:group-hover:text-maroon-400 transition-colors">{item.id}</p>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${item.color} dark:bg-slate-800 dark:text-slate-400 dark:text-slate-500`}>
                        {item.status}
                    </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">{item.user}</p>
                <div className="flex items-center gap-2 text-[10px] font-medium">
                    <span className={item.typeColor}>{item.type}</span>
                    <span className="text-slate-300 dark:text-slate-700 dark:text-slate-200">•</span>
                    <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1"><Clock size={10}/> {item.time}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-black ${item.amountColor}`}>{item.amount}</p>
            </div>
          </div>
        ))}

        {activeTab === "Activities" && activities.map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900 shadow-sm">
            <div className={`p-3 rounded-full shrink-0 ${item.iconBg} dark:bg-slate-800 dark:text-slate-200`}>
              <item.Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">{item.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1.5">{item.desc}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1"><Clock size={10} /> {item.time}</p>
            </div>
          </div>
        ))}

        {activeTab === "Active Users" && (
            <div className="space-y-6">
                <div className="flex justify-between px-6 pb-6 pt-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-center">
                        <p className="text-3xl font-black text-emerald-500 mb-1">1</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Online</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black text-amber-500 mb-1">0</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Away</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black text-slate-300 dark:text-slate-600 dark:text-slate-300 mb-1">1</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Offline</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {activeUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:border-slate-800 dark:hover:border-slate-800">
                        <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${user.color}`}>
                                {user.initials}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 dark:text-slate-200 leading-none mb-1.5">{user.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{user.role}</p>
                        </div>
                        </div>
                        <div className="text-right">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{user.time}</p>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
