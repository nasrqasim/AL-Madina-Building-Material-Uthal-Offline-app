"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import SearchableItemSelect from "@/components/erp/ui/SearchableItemSelect";
import { Download, Printer, Play, Clock, Box, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function InventoryLedgerReportPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ openingBalance: 0, totalIn: 0, totalOut: 0, closingBalance: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetch('/api/items')
      .then(r => r.json())
      .then(json => { if (json.ok) setItems(json.data); })
      .catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!selectedItemId) return alert("Please select an item");
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ itemId: selectedItemId });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await fetch(`/api/reports/inventory-ledger?${params}`);
      const json = await res.json();
      if (json.ok) {
        const payload = json.data;
        const rows = Array.isArray(payload) ? payload : (payload.rows || []);
        setData(rows.map((t: any) => ({
          ...t,
          date: new Date(t.date).toISOString(),
        })));
        if (!Array.isArray(payload) && payload) {
          setSummary({
            openingBalance: payload.openingBalance ?? 0,
            totalIn: payload.totalIn ?? 0,
            totalOut: payload.totalOut ?? 0,
            closingBalance: payload.closingBalance ?? 0,
          });
        } else {
          const totalIn = rows.reduce((s: number, r: any) => s + (r.in || 0), 0);
          const totalOut = rows.reduce((s: number, r: any) => s + (r.out || 0), 0);
          const closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;
          const openingBalance = rows.length > 0 ? rows[0].balance - rows[0].in + rows[0].out : 0;
          setSummary({ openingBalance, totalIn, totalOut, closingBalance });
        }
      } else {
        alert(json.message || "Failed to load ledger");
        setData([]);
      }
    } catch (e) {
      console.error("Error generating ledger:", e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  

  const stats = [
    { title: "Opening Balance", value: summary.openingBalance.toLocaleString(), icon: Box, iconColor: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-50 dark:bg-slate-800/50" },
    { title: "Total In (Qty)", value: summary.totalIn.toLocaleString(), icon: ArrowUpRight, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "Total Out (Qty)", value: summary.totalOut.toLocaleString(), icon: ArrowDownRight, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Closing Balance", value: summary.closingBalance.toLocaleString(), icon: Box, iconColor: "text-blue-600", iconBg: "bg-blue-50", valueColor: "text-blue-600" },
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1 lg:col-span-2">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
            Item <span className="text-rose-500">*</span>
          </label>
          <SearchableItemSelect
            items={items}
            value={selectedItemId}
            onChange={setSelectedItemId}
            placeholder="Type 170, code, or name..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">From Date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">To Date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-2">
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
          <Download size={14} /> Export CSV
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
          <Printer size={14} /> Print
        </button>
        <button 
          className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20"
          onClick={handleGenerate}
        >
          <Play size={14} /> Generate Report
        </button>
      </div>
    </div>
  );

  const trendData = data.map(t => ({
    name: new Date(t.date).toLocaleDateString('default', { day: '2-digit', month: 'short' }),
    balance: t.balance
  }));

  return (
    <ERPReportLayout
      title="Inventory Ledger"
      description="Detailed historical tracking of all stock movements (In and Out) for a specific item."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Ledger", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "InventoryLedger.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">Generating inventory ledger...</p>
          </div>
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 mx-4">
            <Clock size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Select an item and date range to view the ledger</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 mx-4">
            <Box size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No transactions found for this item</p>
          </div>
        ) : (
          <>
            <div className="px-4">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ref No</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">In (+)</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Out (-)</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Rate</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-200">{row.type}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-blue-600">{row.refNo}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.location}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-emerald-600 text-right">{row.in > 0 ? row.in : "-"}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-rose-600 text-right">{row.out > 0 ? row.out : "-"}</td>
                        <td className="px-4 py-3 text-sm font-black text-slate-800 dark:text-slate-100 text-right">{row.balance}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-500 text-right">{row.rate?.toLocaleString?.() ?? row.rate}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-700 text-right">{row.total?.toLocaleString?.() ?? row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {trendData.length > 1 && (
              <div className="px-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="balance" stroke="#881337" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </ERPReportLayout>
  );
}


