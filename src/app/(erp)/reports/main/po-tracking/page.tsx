"use client";

import { useState, useEffect } from "react";
import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Search, Download, Printer, ShoppingCart, Clock, CheckCircle, Package, DollarSign, RotateCcw, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';


export default function POTrackingReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/purchases');
        const json = await res.json();
        if (json.ok && json.data?.length > 0) {
          const transformed = json.data.map((p: any) => ({
            id: p._id,
            date: new Date(p.date).toLocaleDateString(),
            poNo: p.invoiceNo || p.poNo || p.docNo || "N/A",
            vendor: p.partyId?.name || p.partyId?.companyName || "-",
            orderedQty: p.lines?.reduce((s: number, i: any) => s + (i.qty || 0), 0) || 0,
            poAmount: `Rs. ${(p.totalAmount || 0).toLocaleString()}`,
            receivings: p.status === 'Completed' || p.status === 'posted' ? 1 : 0,
            receivedQty: p.status === 'Completed' || p.status === 'posted' ? p.lines?.reduce((s: number, i: any) => s + (i.qty || 0), 0) : 0,
            receivedAmt: p.status === 'Completed' || p.status === 'posted' ? `Rs. ${(p.totalAmount || 0).toLocaleString()}` : "Rs. 0",
            fulfillment: p.status === 'Completed' || p.status === 'posted' ? 100 : 0,
            status: p.status || "Ordered"
          }));
          setData(transformed);
        }
      } catch (error) {
        console.error("Error fetching PO tracking:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { title: "Total POs", value: data.length.toString(), icon: ShoppingCart, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Open / Pending", value: data.filter(d => d.status === 'draft' || d.status === 'pending').length.toString(), icon: Clock, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
    { title: "Full Receivings", value: data.filter(d => d.fulfillment === 100).length.toString(), icon: Package, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
    { title: "Total Value", value: `Rs. ${data.reduce((acc, curr) => acc + (parseFloat(curr.poAmount.replace(/[^\d.]/g, '')) || 0), 0).toLocaleString()}`, icon: DollarSign, iconColor: "text-yellow-600", iconBg: "bg-yellow-50" },
  ];

  const Filters = (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
      <div className="space-y-1.5 md:col-span-1">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
        <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
          <option>Financial Year 2025-26</option>
        </select>
      </div>
      <div className="space-y-1.5 md:col-span-1">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date From</label>
        <input type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
      </div>
      <div className="space-y-1.5 md:col-span-1">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date To</label>
        <input type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
      </div>
      <div className="space-y-1.5 md:col-span-1">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</label>
        <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
          <option>All Vendors</option>
        </select>
      </div>
      <div className="space-y-1.5 md:col-span-1">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
        <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
          <option>All Statuses</option>
        </select>
      </div>
      <div className="space-y-1.5 md:col-span-1 flex gap-2">
        <button className="flex-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
          <Search size={14} />
        </button>
        <button className="flex-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <ERPReportLayout
      title="PO Tracking"
      description="Monitor purchase order fulfillment, received quantities, and vendor performance."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Tracking", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "POTracking.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {/* Table Section */}
        <div className="px-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8"></th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">PO #</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Ordered Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">PO Amount</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Receivings</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Received Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Received Amt</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Fulfillment</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs text-center">&gt;</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">{row.date}</td>
                  <td className="px-4 py-3 text-xs font-bold text-maroon-800">{row.poNo}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">{row.vendor}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100 text-right">{row.orderedQty}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100 text-right">{row.poAmount}</td>
                  <td className="px-4 py-3 text-xs font-medium text-rose-600 text-center bg-rose-50/50 dark:bg-rose-900/10">{row.receivings}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100 text-right">{row.receivedQty}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100 text-right">{row.receivedAmt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${row.fulfillment}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600">{row.fulfillment.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts Section - SSR Safe Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
           <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
             <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6">Status Breakdown</h3>
             <div className="space-y-4">
                {[
                  { label: "Completed", val: 100, color: "bg-emerald-500" },
                  { label: "Partial", val: 0, color: "bg-blue-500" },
                  { label: "Ordered", val: 0, color: "bg-amber-500" }
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900 dark:text-white">{item.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
           </div>
           <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
             <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6">Vendor Analysis</h3>
             <div className="space-y-4">
                {[
                  { label: "nASR", val: 100, color: "bg-maroon-800" },
                  { label: "Others", val: 0, color: "bg-slate-300" }
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900 dark:text-white">Rs. 399.94</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </ERPReportLayout>
  );
}
