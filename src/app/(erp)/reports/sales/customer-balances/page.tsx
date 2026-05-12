"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, Users, DollarSign, ArrowUpRight, ArrowDownRight, Search, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CustomerBalancesReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [salesRes, cashRes, bankRes] = await Promise.all([
          fetch('/api/sales'),
          fetch('/api/cash-receipts'),
          fetch('/api/bank-receipts')
        ]);
        const [salesJson, cashJson, bankJson] = await Promise.all([
          salesRes.json(),
          cashRes.json(),
          bankRes.json()
        ]);

        const customerMap: any = {};

        if (salesJson.ok && salesJson.data) {
          salesJson.data.forEach((s: any) => {
            const key = s.partyId?._id || "walk-in";
            if (!customerMap[key]) {
              customerMap[key] = {
                id: key,
                customer: s.partyId?.name || s.partyId?.companyName || s.customerName || "Walk-in",
                region: s.partyId?.region || "-",
                area: s.partyId?.area || "-",
                opening: 0,
                debit: 0,
                credit: 0,
                closing: 0
              };
            }
            if (s.type === 'sale_return' || s.type === 'non_tax_sale_return') {
              customerMap[key].credit += Math.abs(s.totalAmount || 0);
            } else {
              customerMap[key].debit += s.totalAmount || 0;
            }
          });
        }

        const processReceipts = (receipts: any[]) => {
          receipts?.forEach((r: any) => {
            const key = r.partyId?._id;
            if (!key) return;
            if (!customerMap[key]) {
              customerMap[key] = {
                id: key,
                customer: r.partyId?.name || "Unknown",
                region: r.partyId?.region || "-",
                area: r.partyId?.area || "-",
                opening: 0,
                debit: 0,
                credit: 0,
                closing: 0
              };
            }
            customerMap[key].credit += r.amount || 0;
          });
        };

        if (cashJson.ok) processReceipts(cashJson.data);
        if (bankJson.ok) processReceipts(bankJson.data);

        const result = Object.values(customerMap).map((c: any) => {
          c.closing = c.opening + c.debit - c.credit;
          return c;
        }).filter((c: any) => c.closing !== 0 || c.debit !== 0 || c.credit !== 0);

        setData(result);
      } catch (error) {
        console.error("Error fetching customer balances:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalDebit = data.reduce((s, r) => s + r.debit, 0);
  const totalCredit = data.reduce((s, r) => s + r.credit, 0);
  const totalClosing = data.reduce((s, r) => s + r.closing, 0);

  const stats = [
    { title: "Customers with Balance", value: data.length.toString(), icon: Users, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Total Receivable", value: `Rs. ${totalClosing.toLocaleString()}`, icon: DollarSign, iconColor: "text-blue-600", iconBg: "bg-blue-50", valueColor: "text-blue-600" },
    { title: "Total Debit", value: `Rs. ${totalDebit.toLocaleString()}`, icon: ArrowUpRight, iconColor: "text-emerald-600", iconBg: "bg-emerald-50", iconLabel: "Dr" },
    { title: "Total Credit", value: `Rs. ${totalCredit.toLocaleString()}`, icon: ArrowDownRight, iconColor: "text-rose-600", iconBg: "bg-rose-50", iconLabel: "Cr" },
  ];

  const Filters = (
    <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 w-full">
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26...</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date From</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date To</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" defaultValue="2026-04-29" />
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Customers</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Region</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Regions</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Area</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Areas</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Min Balance</label>
          <input type="number" placeholder="0" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1 lg:col-span-3 xl:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">&nbsp;</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={12} />
            <input type="text" placeholder="Search customer name..." className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" />
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 shrink-0">
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Download size={14} /> CSV
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Printer size={14} /> Print
        </button>
        <button 
          className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20"
          onClick={() => setHasSearched(!hasSearched)}
        >
          <Play size={14} /> Generate
        </button>
      </div>
    </div>
  );


  const barData = data.slice(0, 10).map(r => ({ name: r.customer, balance: r.closing }));

  return (
    <ERPReportLayout
      title="Customer Balances"
      description="Real-time balances of all customer accounts, including debits and credits."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Balances", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "CustomerBalances.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">Fetching live customer balances...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <Users size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No customer balances found for the selected criteria</p>
          </div>
        ) : (
          <>
            <div className="px-4">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-600 dark:text-slate-300">CUSTOMER ↑</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">REGION</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">AREA</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">OPENING</th>
                      <th className="px-4 py-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest text-right">DEBIT</th>
                      <th className="px-4 py-3 text-[9px] font-black text-rose-600 uppercase tracking-widest text-right">CREDIT</th>
                      <th className="px-4 py-3 text-[9px] font-black text-blue-600 uppercase tracking-widest text-right">CLOSING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((row: any, i: number) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-blue-600 cursor-pointer hover:underline uppercase">{row.customer}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.region}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.area}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.opening.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-emerald-700 text-right">{row.debit.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-rose-700 text-right">{row.credit.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-blue-700 text-right">{row.closing.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                      <td colSpan={4} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">Grand Total</td>
                      <td className="px-4 py-3 text-[11px] text-right text-slate-800 dark:text-slate-100">{data.reduce((s, r) => s + r.opening, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-emerald-700">{totalDebit.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-rose-700">{totalCredit.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-blue-700">{totalClosing.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Top Customer Balances</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <RechartsTooltip formatter={(value) => `Rs.${value}`} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                      <Bar dataKey="balance" name="Closing Balance" fill="#3b82f6" barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ERPReportLayout>
  );
}
