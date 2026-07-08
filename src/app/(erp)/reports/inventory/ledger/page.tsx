"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import SearchableItemSelect from "@/components/erp/ui/SearchableItemSelect";
import { Download, Printer, Play, Clock, Box, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Eye } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function InventoryLedgerReportPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
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

    fetch('/api/categories')
      .then(r => r.json())
      .then(json => { if (json.ok) setCategories(json.data.filter((c: any) => c.type === "main")); })
      .catch(console.error);
  }, []);

  const handleGenerate = async (itemIdOverride?: string) => {
    const id = itemIdOverride || selectedItemId;
    if (!id) return alert("Please select an item");
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ itemId: id });
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

  const handleViewLedger = (itemId: string) => {
    setSelectedItemId(itemId);
    handleGenerate(itemId);
  };

  const filteredItems = items.filter(item => {
    if (selectedCategory === "All") return true;
    const catObj = categories.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase());
    if (!catObj) return false;
    return item.mainCategoryId === catObj.id || item.mainCategoryId === catObj._id;
  });

  const selectedItemObj = items.find(i => i._id === selectedItemId);

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
            items={filteredItems}
            value={selectedItemId}
            onChange={(val) => {
              setSelectedItemId(val);
              if (val) {
                handleGenerate(val);
              } else {
                setHasSearched(false);
                setData([]);
              }
            }}
            placeholder="Type code or name..."
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
        {selectedItemId && (
          <button 
            onClick={() => {
              setSelectedItemId("");
              setHasSearched(false);
              setData([]);
            }}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            Show Whole Stock
          </button>
        )}
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
          <Download size={14} /> Export CSV
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
          <Printer size={14} /> Print
        </button>
        <button 
          className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20"
          onClick={() => handleGenerate()}
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
      title={selectedItemId ? `Inventory Ledger - ${selectedItemObj?.name || ""}` : "Inventory Ledger"}
      description={selectedItemId ? `Detailed historical tracking of all stock movements for ${selectedItemObj?.name || ""}.` : "Overview of current stock for all items."}
      stats={selectedItemId ? stats : undefined}
      filters={Filters}
      actions={[
        { label: "Print Ledger", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(selectedItemId ? data : filteredItems, "InventoryLedger.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {/* Category Filter Buttons */}
        <div className="no-print bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center mx-4">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Categories:</span>
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSelectedItemId("");
              setHasSearched(false);
              setData([]);
            }}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
              selectedCategory === "All"
                ? "bg-maroon-800 text-white shadow-sm shadow-maroon-800/20"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            All
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id || cat._id}
              onClick={() => {
                setSelectedCategory(cat.name);
                setSelectedItemId("");
                setHasSearched(false);
                setData([]);
              }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? "bg-maroon-800 text-white shadow-sm shadow-maroon-800/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">Generating inventory ledger...</p>
          </div>
        ) : selectedItemId ? (
          // DETAILED ITEM LEDGER VIEW (Switcher Techno Style)
          data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 mx-4">
              <Box size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No transactions found for this item</p>
            </div>
          ) : (
            <>
              <div className="px-4">
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tran. No.</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Party Name</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Qty In</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Qty Out</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Rate</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Gross Amount</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Discount</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amt. Excl. Tax</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">G.S.T.</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amt. Incl. Tax</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Balance Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((row, i) => {
                        const qty = row.in > 0 ? row.in : row.out;
                        const grossAmt = qty * row.rate;
                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}</td>
                            <td className="px-4 py-3 text-[11px] font-bold text-blue-600">{row.refNo}</td>
                            <td className="px-4 py-3 text-[11px] font-medium text-slate-700 dark:text-slate-200">{row.partyName || "Walk-in (Cash) Customer"}</td>
                            <td className="px-4 py-3 text-[11px] font-black text-emerald-600 text-right">{row.in > 0 ? row.in.toFixed(2) : ""}</td>
                            <td className="px-4 py-3 text-[11px] font-black text-rose-600 text-right">{row.out > 0 ? row.out.toFixed(2) : ""}</td>
                            <td className="px-4 py-3 text-[11px] font-medium text-slate-400">-</td>
                            <td className="px-4 py-3 text-[11px] font-medium text-slate-500 text-right">{row.rate.toFixed(2)}</td>
                            <td className="px-4 py-3 text-[11px] font-medium text-slate-600 text-right">{grossAmt.toFixed(2)}</td>
                            <td className="px-4 py-3 text-[11px] font-medium text-slate-400 text-right">0.00</td>
                            <td className="px-4 py-3 text-[11px] font-medium text-slate-600 text-right">{grossAmt.toFixed(2)}</td>
                            <td className="px-4 py-3 text-[11px] font-medium text-slate-400 text-right">0.00</td>
                            <td className="px-4 py-3 text-[11px] font-bold text-slate-700 text-right">{row.total.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-black text-slate-800 dark:text-slate-100 text-right">{row.balance.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                      {/* Footer Row */}
                      <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                        <td colSpan={3} className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">Totals</td>
                        <td className="px-4 py-3 text-[11px] text-right text-emerald-600">{summary.totalIn.toFixed(2)}</td>
                        <td className="px-4 py-3 text-[11px] text-right text-rose-600">{summary.totalOut.toFixed(2)}</td>
                        <td colSpan={7} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">Balance</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">{summary.closingBalance.toFixed(2)}</td>
                      </tr>
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
          )
        ) : (
          // WHOLE STOCK DEFAULT LIST VIEW
          <div className="px-4">
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-8">#</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item Code</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Purchase Rate</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Retail Rate</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ltr / Pcs per Ctn</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Stock (Cartons)</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Reorder Level</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item, i) => (
                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-200">{item.code}</td>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-900 dark:text-white uppercase">{item.name}</td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 text-right">Rs. {(item.purchaseRate || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 text-right">Rs. {(item.retailRate || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-500 text-right">{(item.litersInCtn || item.liters || 0)}</td>
                      <td className="px-4 py-3 text-sm font-black text-slate-800 dark:text-slate-100 text-right">{(item.stockQtyCartons || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-500 text-right">{(item.reorderLevel || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewLedger(item._id)}
                          className="px-2 py-1 bg-maroon-800 text-white rounded text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1 mx-auto"
                        >
                          <Eye size={10} /> View Ledger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ERPReportLayout>
  );
}
