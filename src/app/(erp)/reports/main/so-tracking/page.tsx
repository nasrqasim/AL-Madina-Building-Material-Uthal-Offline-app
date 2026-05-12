"use client";

import { useState, useEffect } from "react";
import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Search, Download, Printer, ShoppingBag, Clock, CheckCircle, Truck, DollarSign, RotateCcw, Play, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';


export default function SOTrackingReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/sales');
        const json = await res.json();
        if (json.ok && json.data?.length > 0) {
          const transformed = json.data.map((s: any) => ({
            id: s._id,
            date: new Date(s.date).toLocaleDateString(),
            soNo: s.invoiceNo || s.soNo || s.docNo || "N/A",
            customer: s.partyId?.name || s.partyId?.companyName || s.customerName || "Walk-in",
            orderedQty: s.lines?.reduce((acc: number, i: any) => acc + (i.qty || 0), 0) || 0,
            soAmount: s.totalAmount || 0,
            deliveries: s.status === 'Completed' || s.status === 'posted' ? 1 : 0,
            deliveredAmt: s.status === 'Completed' || s.status === 'posted' ? (s.totalAmount || 0) : 0,
            fulfillment: s.status === 'Completed' || s.status === 'posted' ? 100 : 0,
            status: s.status || "Open"
          }));
          setData(transformed);
        }
      } catch (error) {
        console.error("Error fetching SO tracking:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { title: "Total SOs", value: data.length.toString(), icon: ShoppingBag, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Open SOs", value: data.filter(d => d.status === 'draft' || d.status === 'Open').length.toString(), icon: Clock, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
    { title: "Deliveries", value: data.filter(d => d.fulfillment === 100).length.toString(), icon: Truck, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
    { title: "Total Value", value: `Rs. ${data.reduce((acc, curr) => acc + curr.soAmount, 0).toLocaleString()}`, icon: DollarSign, iconColor: "text-yellow-600", iconBg: "bg-yellow-50" },
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
        <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26 (Active)</option>
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-1 lg:col-span-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date From</label>
          <input type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1.5 md:col-span-1 lg:col-span-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date To</label>
          <input type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</label>
          <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Customers</option>
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-1 lg:col-span-2 flex gap-2">
          <button className="flex-1 py-2 bg-maroon-800 text-white rounded-lg text-xs font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5">
            <Play size={14} /> Run
          </button>
          <button className="flex-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ERPReportLayout
      title="SO Tracking"
      description="Track sales order status, delivery fulfillment, and salesperson performance."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Tracking", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "SOTracking.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        <div className="px-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8"></th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">SO #</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Ordered Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">SO Amount</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Deliveries</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Delivered Amt</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Fulfillment</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs text-center">&gt;</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">{row.date}</td>
                  <td className="px-4 py-3 text-xs font-bold text-maroon-800">{row.soNo}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">{row.customer}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100 text-right">{row.orderedQty}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100 text-right">{row.soAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs font-medium text-rose-600 text-center bg-rose-50/50 dark:bg-rose-900/10">{row.deliveries}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100 text-right">{row.deliveredAmt.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${row.fulfillment}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600">{row.fulfillment.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
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
             <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6">SO Fulfillment</h3>
             <div className="space-y-4">
                {[
                  { label: "Completed", val: 50, color: "bg-emerald-500" },
                  { label: "Open", val: 50, color: "bg-blue-500" },
                  { label: "Partial", val: 0, color: "bg-amber-500" }
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
             <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6">Customer Performance</h3>
             <div className="space-y-4">
                {[
                  { label: "Tech Corp", val: 80, color: "bg-maroon-800" },
                  { label: "Local Retailer", val: 20, color: "bg-slate-400" }
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900 dark:text-white">{item.val}% Value</span>
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
