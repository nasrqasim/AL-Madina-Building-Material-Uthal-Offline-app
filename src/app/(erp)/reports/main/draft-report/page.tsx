"use client";

import { useState, useEffect } from "react";
import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Search, Download, FileText, DollarSign, CalendarPlus, Calendar, CalendarMinus, Clock, RotateCcw, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";


export default function DraftReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch from multiple sources where status is draft
        const [sales, purchases] = await Promise.all([
          fetch('/api/sales').then(r => r.json()),
          fetch('/api/purchases').then(r => r.json()),
        ]);

        const allDrafts = [
          ...(sales.data || []).filter((s: any) => s.status === 'draft'),
          ...(purchases.data || []).filter((p: any) => p.status === 'draft'),
        ].map(d => ({
          id: d._id,
          docNo: d.invoiceNo || d.soNo || d.poNo || d.docNo || "N/A",
          type: (d.soNo || d.type === 'sale_order') ? "Sales Order" : "Purchase Order",
          docDate: new Date(d.date).toLocaleDateString(),
          created: new Date(d.createdAt).toLocaleDateString(),
          createdBy: d.createdBy?.name || "System",
          party: d.partyId?.name || d.partyId?.companyName || d.vendorId?.name || "-",
          amount: `Rs. ${(d.totalAmount || 0).toLocaleString()}`,
          daysAsDraft: Math.floor((Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }));

        if (allDrafts.length > 0) setData(allDrafts);
      } catch (error) {
        console.error("Error fetching drafts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { title: "TOTAL DRAFTS", value: data.length.toString(), icon: FileText, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
    { title: "DRAFT VALUE", value: `Rs. ${data.reduce((acc, curr) => acc + (parseFloat(curr.amount.replace(/[^\d.]/g, '')) || 0), 0).toLocaleString()}`, icon: DollarSign, iconColor: "text-slate-600", iconBg: "bg-slate-100" },
    { title: "CREATED TODAY", value: data.filter(d => d.created === new Date().toLocaleDateString()).length.toString(), icon: CalendarPlus, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
    { title: "WITHIN 7 DAYS", value: data.filter(d => d.daysAsDraft <= 7).length.toString(), icon: Calendar, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "OLDER THAN 7 DAYS", value: data.filter(d => d.daysAsDraft > 7).length.toString(), icon: CalendarMinus, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "OLDEST (DAYS)", value: (data.length > 0 ? Math.max(...data.map(d => d.daysAsDraft)) : 0).toString(), icon: Clock, iconColor: "text-slate-600", iconBg: "bg-slate-100" },
  ];

  const Filters = (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input type="text" placeholder="Search doc#, party, notes..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" />
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <select className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20 min-w-[150px]">
          <option>All Document Types</option>
        </select>
        <select className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20 min-w-[150px]">
          <option>All Users</option>
        </select>
        <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center transition-colors">
          <RotateCcw size={16} />
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors">
          <Download size={14} /> Export
        </button>
      </div>
    </div>
  );

  return (
    <ERPReportLayout
      title="Draft Report"
      description="View all unposted transactions and pending drafts across the system."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Report", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "DraftReport.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="p-0">
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{data.length} drafts shown</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc #</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Created</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Created By</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Party</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amount</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Days As Draft</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-maroon-800 cursor-pointer hover:underline">{row.docNo}</td>
                <td className="px-6 py-4 text-xs">
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold">{row.type}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-200">{row.docDate}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-200">{row.created}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-200">{row.createdBy}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-200">{row.party}</td>
                <td className="px-6 py-4 text-xs font-black text-slate-800 dark:text-slate-100 text-right">{row.amount}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${row.daysAsDraft === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {row.daysAsDraft}d
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ERPReportLayout>
  );
}
