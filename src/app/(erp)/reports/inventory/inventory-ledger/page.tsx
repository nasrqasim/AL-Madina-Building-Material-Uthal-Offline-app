"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Clock, Download, Printer, Play, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState } from "react";

export default function InventoryLedgerReportPage() {
  const [hasSearched, setHasSearched] = useState(false);

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Item *</label>
          <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
            <option>Select Item</option>
            <option className="text-slate-900 dark:text-white">Engine Oil 5W-40</option>
            <option className="text-slate-900 dark:text-white">Oil Filter OF-100</option>
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">From Date</label>
          <input type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">To Date</label>
          <input type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</label>
          <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Locations</option>
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transaction Type</label>
          <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Types</option>
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Direction</label>
          <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All</option>
            <option>In</option>
            <option>Out</option>
          </select>
        </div>
        
        <div className="md:col-span-5 flex justify-end gap-2 mt-4">
          <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
            <Download size={14} /> Export CSV
          </button>
          <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
            <Printer size={14} /> Print
          </button>
          <button 
            className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-xs font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20"
            onClick={() => setHasSearched(true)}
          >
            <Play size={14} /> Generate Report
          </button>
        </div>
      </div>
    </div>
  );

  const dummyData = [
    { id: 1, date: "28-Apr-2026", type: "Opening", docNo: "-", location: "Main Warehouse", qtyIn: 50, qtyOut: 0, balance: 50 },
    { id: 2, date: "29-Apr-2026", type: "Sales Invoice", docNo: "SI-001", location: "Main Warehouse", qtyIn: 0, qtyOut: 10, balance: 40 },
    { id: 3, date: "30-Apr-2026", type: "Purchase Order", docNo: "PO-022", location: "Main Warehouse", qtyIn: 100, qtyOut: 0, balance: 140 },
  ];

  return (
    <ERPReportLayout
      title="Inventory Ledger"
      description="Stock movement history for specific items across all warehouse locations."
      filters={Filters}
      actions={[
        { label: "Print Ledger", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(dummyData, "InventoryLedger.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="p-0">
        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
            <Clock size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">Select an item and date range to view the ledger</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc #</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Qty In</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Qty Out</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dummyData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">{row.date}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">{row.type}</td>
                  <td className="px-6 py-4 text-xs font-bold text-blue-600 cursor-pointer hover:underline">{row.docNo}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">{row.location}</td>
                  <td className="px-6 py-4 text-xs font-black text-emerald-600 text-right">{row.qtyIn > 0 ? row.qtyIn : '-'}</td>
                  <td className="px-6 py-4 text-xs font-black text-rose-600 text-right">{row.qtyOut > 0 ? row.qtyOut : '-'}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800 dark:text-slate-100 text-right">{row.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ERPReportLayout>
  );
}
