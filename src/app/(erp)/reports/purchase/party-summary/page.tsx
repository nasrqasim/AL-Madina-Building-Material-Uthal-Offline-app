"use client";

import React, { useState, useEffect } from "react";
import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, RotateCcw, Users, ShoppingCart, RotateCcw as RotateLeft, TrendingUp, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PartyPurchaseSummaryReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/purchases');
        const json = await res.json();
        if (json.ok && json.data) {
          const grouped = json.data.reduce((acc: any, p: any) => {
            const vendorId = p.partyId?._id || "unknown";
            if (!acc[vendorId]) {
              acc[vendorId] = {
                id: vendorId,
                vendorCode: p.partyId?.code || "V-???",
                vendorName: p.partyId?.name || p.partyId?.companyName || "Unknown Vendor",
                invoices: 0,
                gross: 0,
                returns: 0,
                discount: 0,
                gst: 0,
                wht: 0,
                net: 0
              };
            }
            const isReturn = p.type === 'purchase_return';
            acc[vendorId].invoices += 1;
            acc[vendorId].gross += p.subTotal || 0;
            if (isReturn) acc[vendorId].returns += p.totalAmount || 0;
            acc[vendorId].discount += p.discountAmount || 0;
            acc[vendorId].gst += p.taxAmount || 0;
            acc[vendorId].wht += p.whtAmount || 0;
            acc[vendorId].net += (isReturn ? -(p.totalAmount || 0) : (p.totalAmount || 0));
            return acc;
          }, {});

          const list = Object.values(grouped);
          const totalNet: number = list.reduce((s: number, r: any) => s + r.net, 0);
          setData(list.map((r: any) => ({
            ...r,
            percent: totalNet > 0 ? ((r.net / totalNet) * 100).toFixed(1) + "%" : "0%"
          })));
        }
      } catch (error) {
        console.error("Error fetching party summary:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { title: "TOTAL VENDORS", value: data.length.toString(), subtitle: "Active vendors", icon: Users, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "TOTAL PURCHASES", value: `Rs. ${data.reduce((s, r) => s + r.gross, 0).toLocaleString()}`, subtitle: `${data.reduce((s, r) => s + r.invoices, 0)} transactions`, icon: ShoppingCart, iconColor: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-50 dark:bg-slate-800/50" },
    { title: "TOTAL RETURNS", value: `Rs. ${data.reduce((s, r) => s + r.returns, 0).toLocaleString()}`, subtitle: "Returns deducted", icon: RotateLeft, iconColor: "text-amber-600", iconBg: "bg-amber-50", valueColor: "text-amber-600" },
    { title: "NET PURCHASES", value: `Rs. ${data.reduce((s, r) => s + r.net, 0).toLocaleString()}`, subtitle: "Purchases - Returns", icon: TrendingUp, iconColor: "text-emerald-600", iconBg: "bg-emerald-50", valueColor: "text-emerald-600" },
  ];

  const Filters = (
    <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26...</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date From</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date To</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Vendors</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tax Filter</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Both (Tax + Non-Tax)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Min Amount</label>
          <input type="number" placeholder="0" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );


  const barData = data.map(d => ({ name: d.vendorName, value: d.net })).sort((a, b) => b.value - a.value).slice(0, 15);

  const pieData = barData.map((d, idx) => ({
    name: `${d.name} (${((d.value / (data.reduce((s, r) => s + r.net, 0) || 1)) * 100).toFixed(1)}%)`,
    value: d.value,
    color: ['#881337', '#be123c', '#e11d48', '#fb7185', '#fda4af'][idx % 5]
  }));

  return (
    <ERPReportLayout
      title="Party Purchase Summary"
      description="Reports / Purchase Reports / Party Purchase Summary"
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Report", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "PartyPurchaseSummary.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Vendor Purchase Summary</h3>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{data.length} {data.length === 1 ? 'vendor' : 'vendors'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-b border-slate-200 dark:border-slate-800 min-w-max">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Code</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Name</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Invoices</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Gross Purchases</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Returns</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Discount</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">GST</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">WHT</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right flex items-center justify-end gap-1">Net Purchases <TrendingUp size={10} className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500"/></th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">% of Total</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-slate-100">
                {data.map((row: any, i: number) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-maroon-800 cursor-pointer hover:underline">{row.vendorCode}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-blue-600 cursor-pointer hover:underline">{row.vendorName}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center">{row.invoices}</td>
                    <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.gross.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-rose-600 text-right">{row.returns.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.discount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.gst.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.wht.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] font-black text-emerald-600 text-right">{row.net.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] font-black text-rose-800 text-right bg-rose-50/30">{row.percent}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                  <td colSpan={3} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">TOTAL ({data.length} vendors)</td>
                  <td className="px-4 py-3 text-[11px] text-center">{data.reduce((s, r) => s + r.invoices, 0)}</td>
                  <td className="px-4 py-3 text-[11px] text-right">{data.reduce((s, r) => s + r.gross, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] text-right text-rose-600">{data.reduce((s, r) => s + r.returns, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] text-right">{data.reduce((s, r) => s + r.discount, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] text-right">{data.reduce((s, r) => s + r.gst, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] text-right">{data.reduce((s, r) => s + r.wht, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] text-right text-emerald-600">{data.reduce((s, r) => s + r.net, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Top 15 Vendors by Net Purchases</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{fontSize: 10}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={60} />
                  <RechartsTooltip />
                  <Bar dataKey="value" name="Net Purchases" fill="#881337" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Purchase Distribution by Vendor</h3>
            <div className="h-64 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </ERPReportLayout>
  );
}
