"use client";

import React, { useState, useEffect } from "react";
import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, Users, DollarSign, ArrowDownLeft, ArrowUpRight, Search, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

export default function VendorBalancesReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [p, cp, bp] = await Promise.all([
          fetch('/api/purchases').then(r => r.json()),
          fetch('/api/cash-payments').then(r => r.json()),
          fetch('/api/bank-payments').then(r => r.json())
        ]);

        const vendorMap = new Map();

        // Add from purchases (Credit)
        (p.data || []).forEach((inv: any) => {
          const vId = inv.partyId?._id || "unknown";
          if (!vendorMap.has(vId)) {
            vendorMap.set(vId, {
              id: vId,
              vendor: inv.partyId?.name || inv.partyId?.companyName || "Unknown Vendor",
              type: "Supplier",
              city: inv.partyId?.city || "-",
              opening: 0,
              debit: 0,
              credit: 0
            });
          }
          const v = vendorMap.get(vId);
          if (inv.type === 'purchase_return') v.debit += inv.totalAmount || 0;
          else v.credit += inv.totalAmount || 0;
        });

        // Add from payments (Debit)
        [...(cp.data || []), ...(bp.data || [])].forEach((pay: any) => {
          const vId = pay.partyId?._id || "unknown";
          if (!vendorMap.has(vId)) {
            vendorMap.set(vId, {
              id: vId,
              vendor: pay.partyId?.name || pay.partyId?.companyName || "Unknown Vendor",
              type: "Supplier",
              city: pay.partyId?.city || "-",
              opening: 0,
              debit: 0,
              credit: 0
            });
          }
          vendorMap.get(vId).debit += pay.amount || 0;
        });

        const result = Array.from(vendorMap.values()).map(v => ({
          ...v,
          closing: (v.opening + v.credit - v.debit)
        }));
        setData(result);
        setFilteredData(result);

      } catch (error) {
        console.error("Error fetching vendor balances:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredData(data);
      return;
    }
    setFilteredData(
      data.filter((r) =>
        String(r.vendor || "").toLowerCase().includes(q) ||
        String(r.city || "").toLowerCase().includes(q) ||
        String(r.type || "").toLowerCase().includes(q)
      )
    );
  }, [searchQuery, data]);

  const totalDebit = filteredData.reduce((s, r) => s + r.debit, 0);
  const totalCredit = filteredData.reduce((s, r) => s + r.credit, 0);
  const totalClosing = filteredData.reduce((s, r) => s + r.closing, 0);

  const stats = [
    { title: "Vendors with Balance", value: filteredData.filter(v => v.closing !== 0).length.toString(), icon: Users, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Total Payable", value: `Rs. ${totalClosing.toLocaleString()}`, icon: DollarSign, iconColor: "text-rose-600", iconBg: "bg-rose-50", valueColor: "text-rose-600" },
    { title: "Total Debit", value: `Rs. ${totalDebit.toLocaleString()}`, icon: ArrowDownLeft, iconColor: "text-emerald-600", iconBg: "bg-emerald-50", valueColor: "text-emerald-600" },
    { title: "Total Credit", value: `Rs. ${totalCredit.toLocaleString()}`, icon: ArrowUpRight, iconColor: "text-blue-600", iconBg: "bg-blue-50", valueColor: "text-blue-600" },
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="space-y-1 lg:col-span-2">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26 (Active)</option>
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
        <div className="space-y-1 lg:col-span-2">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Vendors</option>
          </select>
        </div>
        
        {/* Next Row of Filters */}
        <div className="space-y-1 lg:col-span-2 lg:col-start-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Type</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Types</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-2">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">City</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Cities</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Min Balance</label>
          <input type="number" placeholder="0" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1 lg:col-span-3 flex flex-col justify-end">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={14} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search vendor name..." className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        <button className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20">
          <Play size={14} /> Generate
        </button>
      </div>
    </div>
  );


  return (
    <ERPReportLayout
      title="Vendor Balances"
      description="Consolidated list of all vendor account balances (Payables/Receivables)."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Balances", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(filteredData, "VendorBalances.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse border-b border-slate-200 dark:border-slate-800 min-w-max">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Type</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">City</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Opening</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Debit</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Credit</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row, i) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 text-[11px] font-bold text-blue-600 cursor-pointer hover:underline">{row.vendor}</td>
                  <td className="px-4 py-3 text-[11px] text-center">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black border border-rose-200 bg-rose-50 text-rose-600 uppercase tracking-wider">{row.type}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center">{row.city}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.opening.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-emerald-600 text-right">{row.debit.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 text-right">{row.credit.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-[11px] font-black text-right ${row.closing < 0 ? 'text-emerald-600' : 'text-rose-600'} bg-slate-50/30`}>{row.closing.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                <td colSpan={4} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">Grand Total</td>
                <td className="px-4 py-3 text-[11px] text-right">0.00</td>
                <td className="px-4 py-3 text-[11px] text-right">{totalDebit.toLocaleString()}</td>
                <td className="px-4 py-3 text-[11px] text-right">{totalCredit.toLocaleString()}</td>
                <td className={`px-4 py-3 text-[11px] text-right ${totalClosing < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{totalClosing.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ERPReportLayout>
  );
}
