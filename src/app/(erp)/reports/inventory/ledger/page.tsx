"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, Clock, Box, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

export default function InventoryLedgerReportPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/items');
        const json = await res.json();
        if (json.ok) setItems(json.data);
      } catch (e) {
        console.error("Error fetching items:", e);
      }
    }
    fetchItems();
  }, []);

  const handleGenerate = async () => {
    if (!selectedItemId) return alert("Please select an item");
    setIsLoading(true);
    setHasSearched(true);
    try {
      const [salesRes, purRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/purchases')
      ]);
      const [salesJson, purJson] = await Promise.all([
        salesRes.json(),
        purRes.json()
      ]);

      if (salesJson.ok && purJson.ok) {
        const itemSales = salesJson.data.flatMap((s: any) => 
          (s.lines || []).filter((l: any) => (l.itemId?._id || l.itemId) === selectedItemId)
          .map((l: any) => ({
            date: s.date,
            refNo: s.invoiceNo || s.docNo,
            type: "Sale",
            location: "Main Warehouse",
            in: 0,
            out: l.qty || 0,
            rate: l.rate,
            total: l.total
          }))
        );

        const itemPurchases = purJson.data.flatMap((p: any) => 
          (p.lines || []).filter((l: any) => (l.itemId?._id || l.itemId) === selectedItemId)
          .map((l: any) => ({
            date: p.date,
            refNo: p.invoiceNo || p.docNo,
            type: "Purchase",
            location: "Main Warehouse",
            in: l.qty || 0,
            out: 0,
            rate: l.rate,
            total: l.total
          }))
        );

        const allTrans = [...itemSales, ...itemPurchases].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0; // Simplified; ideally starts from opening before range
        const dataWithBalance = allTrans.map(t => {
          runningBalance += (t.in - t.out);
          return { ...t, balance: runningBalance };
        });

        setData(dataWithBalance);
      }
    } catch (e) {
      console.error("Error generating ledger:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalIn = data.reduce((s, r) => s + r.in, 0);
  const totalOut = data.reduce((s, r) => s + r.out, 0);
  const closingBalance = data.length > 0 ? data[data.length - 1].balance : 0;

  const stats = [
    { title: "Opening Balance", value: "0", icon: Box, iconColor: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-50 dark:bg-slate-800/50" },
    { title: "Total In (Qty)", value: totalIn.toLocaleString(), icon: ArrowUpRight, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "Total Out (Qty)", value: totalOut.toLocaleString(), icon: ArrowDownRight, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Closing Balance", value: closingBalance.toLocaleString(), icon: Box, iconColor: "text-blue-600", iconBg: "bg-blue-50", valueColor: "text-blue-600" },
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
            Item <span className="text-rose-500">*</span>
          </label>
          <select 
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
          >
            <option value="">Select Item</option>
            {items.map(item => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">From Date</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" defaultValue="2026-03-31" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">To Date</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" defaultValue="2026-04-29" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Locations</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transaction Type</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Types</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Direction</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All</option>
            <option>In</option>
            <option>Out</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-2">
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Download size={14} /> Export CSV
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
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
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <Clock size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Select an item and date range to view the ledger</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <Box size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No transactions found for this item</p>
          </div>
        ) : (
          <>
            <div className="px-4">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Transaction History</h3>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{data.length} records</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ref No</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</th>
                      <th className="px-4 py-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest text-right">In (+)</th>
                      <th className="px-4 py-3 text-[9px] font-black text-rose-600 uppercase tracking-widest text-right">Out (-)</th>
                      <th className="px-4 py-3 text-[9px] font-black text-blue-600 uppercase tracking-widest text-right">Balance</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Rate</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50 dark:bg-slate-800/50/30 italic">
                      <td colSpan={7} className="px-4 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right uppercase tracking-widest">Opening Balance</td>
                      <td className="px-4 py-2 text-[11px] font-black text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">1,200</td>
                      <td colSpan={2}></td>
                    </tr>
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-maroon-800 cursor-pointer hover:underline">{row.refNo}</td>
                        <td className="px-4 py-3 text-[11px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                            row.type === 'Purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.location}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-emerald-700 text-right">{row.in || '-'}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-rose-700 text-right">{row.out || '-'}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-blue-700 text-right bg-blue-50/30">{row.balance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.rate?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.total?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 px-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest">Stock Level Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <RechartsTooltip />
                      <Line type="stepAfter" dataKey="balance" name="In-Stock Qty" stroke="#881337" strokeWidth={3} dot={{r: 4, fill: '#881337'}} />
                    </LineChart>
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
