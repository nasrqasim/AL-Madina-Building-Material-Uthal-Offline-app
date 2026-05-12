"use client";

import React, { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Search, ChevronDown, ChevronRight, FileText, Download, Printer, Maximize2, Minimize2, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";


export default function JournalReportPage() {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/journal-entries');
        const json = await res.json();
        if (json.ok && json.data?.length > 0) {
          const transformed = json.data.map((j: any) => ({
            id: j.voucherNo || j._id,
            date: new Date(j.date).toLocaleDateString(),
            type: j.type || "Journal Voucher",
            job: j.jobId?.name || "-",
            employee: j.createdBy?.name || "Admin",
            linesCount: j.entries?.length || 0,
            debit: j.entries?.reduce((s: number, e: any) => s + (e.debit || 0), 0) || 0,
            credit: j.entries?.reduce((s: number, e: any) => s + (e.credit || 0), 0) || 0,
            entries: (j.entries || []).map((e: any) => ({
              accountCode: e.accountId?.code || "N/A",
              accountName: e.accountId?.name || "Unknown Account",
              narration: e.narration || j.narration || "",
              debit: e.debit || null,
              credit: e.credit || null
            }))
          }));
          setData(transformed);
        }
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedRows(data.map(d => d.id));
  };

  const collapseAll = () => {
    setExpandedRows([]);
  };

  const totalDebit = data.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = data.reduce((sum, item) => sum + item.credit, 0);

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Journal Report"
        description="Detailed accounting journal with drill-down transaction entries."
        actions={[
          { label: "Print Report", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(data, "JournalReport.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Transactions</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{data.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
            Dr
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Debit</p>
            <p className="text-xl font-black text-blue-600">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-black text-sm">
            Cr
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Credit</p>
            <p className="text-xl font-black text-rose-600">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">
            =
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Balance</p>
            <p className="text-xl font-black text-emerald-600">Balanced</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
              <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
                <option>Financial Year 2025-26 (Active)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">From Date</label>
              <input type="date" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">To Date</label>
              <input type="date" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transaction Type</label>
              <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
                <option>All Types</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input type="text" placeholder="Search doc#, account, description..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={expandAll} className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5">
                <Maximize2 size={14} /> Expand
              </button>
              <button onClick={collapseAll} className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5">
                <Minimize2 size={14} /> Collapse
              </button>
              <button onClick={() => exportToExcel(data, "JournalReport.csv")} className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5">
                <Download size={14} /> CSV
              </button>
              <button className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5">
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8"></th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Document #</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transaction Type</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Lines</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Debit</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((row: any) => (
                <React.Fragment key={row.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => toggleRow(row.id)}>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500">
                      {expandedRows.includes(row.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-maroon-800">
                      {row.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">{row.date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded text-[10px] font-black uppercase tracking-wider">{row.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">{row.job}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">{row.employee}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-500 text-center">{row.linesCount} entries</td>
                    <td className="px-4 py-3 text-sm font-black text-blue-600 text-right">{row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm font-black text-rose-600 text-right">{row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  
                  {expandedRows.includes(row.id) && row.entries.map((entry: any, idx: number) => (
                    <tr key={`${row.id}-entry-${idx}`} className="bg-slate-50 dark:bg-slate-800/20">
                      <td colSpan={2} className="px-4 py-2 pl-12 text-xs font-bold text-slate-500">{entry.accountCode}</td>
                      <td colSpan={3} className="px-4 py-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{entry.accountName}</span>
                        <span className="text-xs text-slate-400 ml-2 italic">{entry.narration}</span>
                      </td>
                      <td colSpan={2}></td>
                      <td className="px-4 py-2 text-sm font-medium text-blue-600 text-right">
                        {entry.debit !== null ? entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-rose-600 text-right">
                        {entry.credit !== null ? entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-800">
                <td colSpan={7} className="px-4 py-4 text-right text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Grand Total</td>
                <td className="px-4 py-4 text-sm font-black text-blue-600 text-right">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-4 text-sm font-black text-rose-600 text-right">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
