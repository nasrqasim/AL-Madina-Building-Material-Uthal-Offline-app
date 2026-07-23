"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, History, TrendingUp, AlertCircle, CheckCircle, Info } from "lucide-react";

interface AvailableItem {
  _id: string;
  code: string;
  name: string;
  category?: string;
  purchaseRate?: number;
  retailRate?: number;
  wholesaleRate?: number;
  rate?: number;
  stockQtyCartons?: number;
  unit?: string;
  gallonsInCtn?: number;
  litersInCtn?: number;
}

interface ItemDetailsPanelProps {
  item: AvailableItem | null | undefined;
  type: "sale" | "purchase" | "store";
  isWholesale?: boolean;
}

export default function ItemDetailsPanel({ item, type, isWholesale = false }: ItemDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [itemHistory, setItemHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!item?._id) {
        setItemHistory([]);
        return;
      }
      setLoadingHistory(true);
      try {
        // Fetch invoices based on context type
        const apiType = type === "purchase" ? "purchase" : "sale";
        const res = await fetch(`/api/invoices?type=${apiType}`);
        const data = await res.json();
        if (data.ok) {
          const records: any[] = [];
          data.data.forEach((inv: any) => {
            const line = inv.lines?.find((l: any) => (l.itemId?._id || l.itemId) === item._id);
            if (line) {
              const qtyParts = [];
              if (line.cartons) qtyParts.push(`${line.cartons}C`);
              if (line.gallons) qtyParts.push(`${line.gallons}G`);
              if (line.liters) qtyParts.push(`${line.liters}L`);
              records.push({
                invoiceNo: inv.invoiceNo,
                date: new Date(inv.date).toLocaleDateString(),
                partyName: inv.partyId?.name || (type === "purchase" ? "Walk-in Vendor" : "Walk-in Customer"),
                quantity: qtyParts.join(", ") || line.qty || "0",
                rate: line.rate || 0,
                amount: line.netAmount || 0
              });
            }
          });
          setItemHistory(records.slice(0, 6));
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, [item?._id, type]);

  const stockStatus = useMemo(() => {
    if (!item) return { label: "N/A", color: "text-slate-400 bg-slate-100 dark:bg-slate-800" };
    const stock = item.stockQtyCartons || 0;
    if (stock <= 0) return { label: "Out of Stock", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900" };
    if (stock < 5) return { label: "Low Stock", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900" };
    return { label: "In Stock", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900" };
  }, [item]);

  if (!item) {
    return (
      <div className="h-full min-h-[250px] bg-slate-50 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-slate-400 dark:text-slate-500 transition-all duration-300">
        <Package className="w-12 h-12 mb-3 opacity-30 animate-pulse text-maroon-800 dark:text-maroon-400" />
        <span className="text-xs font-black uppercase tracking-widest text-center">No Item Selected</span>
        <span className="text-[10px] mt-1 text-slate-400 text-center max-w-[200px]">Click or select an item row to display stock, pricing, and history.</span>
      </div>
    );
  }

  // Determine active display price
  const displayPrice = isWholesale 
    ? (item.wholesaleRate || item.rate || 0) 
    : (type === "purchase" ? (item.purchaseRate || item.rate || 0) : (item.retailRate || item.rate || 0));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[350px] transition-all duration-300 hover:shadow-md">
      {/* Mini Header / Tabs */}
      <div className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/80 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "details"
                ? "bg-maroon-800 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <Info className="w-3.5 h-3.5" /> Info
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-maroon-800 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <History className="w-3.5 h-3.5" /> History
          </button>
        </div>
        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${stockStatus.color}`}>
          {stockStatus.label}
        </span>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {activeTab === "details" ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Item Identification */}
            <div>
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Item Name</div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-2">{item.name}</h4>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700/50">
                  Code: {item.code}
                </span>
                {item.category && (
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700/50">
                    {item.category}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 p-3 rounded-2xl">
                <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stock Qty</div>
                <div className="text-base font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
                  {item.stockQtyCartons ?? 0} <span className="text-[10px] font-bold text-slate-400">{item.unit || "PCS"}</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 p-3 rounded-2xl">
                <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {type === "purchase" ? "Purchase Rate" : "Selling Rate"}
                </div>
                <div className="text-base font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
                  Rs. {displayPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </div>
              </div>
            </div>

            {/* Conversion Details */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Packaging Specifications</div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/20">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Gallons per Carton</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">{item.gallonsInCtn || 4} G</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Liters per Carton</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">{item.litersInCtn || 16} L</span>
              </div>
            </div>

            {/* Price reference checklist */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-[11px]">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Pricing Tiers (Reference)</div>
              <div className="flex justify-between text-slate-500">
                <span>Purchase Rate:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">Rs. {(item.purchaseRate || 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Retail Rate:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">Rs. {(item.retailRate || 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Wholesale Rate:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">Rs. {(item.wholesaleRate || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-fadeIn h-full flex flex-col">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-between">
              <span>Recent {type === "purchase" ? "Purchases" : "Sales"}</span>
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {loadingHistory ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-maroon-800 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (itemHistory || []).length > 0 ? (
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2 font-black text-slate-500 uppercase">Inv No</th>
                      <th className="p-2 font-black text-slate-500 uppercase">Qty</th>
                      <th className="p-2 font-black text-slate-500 uppercase text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(itemHistory || []).map((h, idx) => (
                      <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800/40">
                        <td className="p-2 font-bold text-slate-800 dark:text-slate-200 font-mono" title={`${h.invoiceNo} on ${h.date}`}>
                          {h.invoiceNo.slice(-6)}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-mono">
                          {h.quantity}
                        </td>
                        <td className="p-2 text-right font-black text-slate-800 dark:text-slate-200 font-mono">
                          {Number(h.rate).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                <History className="w-8 h-8 mb-2 opacity-25" />
                <span className="text-[10px] font-black uppercase tracking-wider">No Invoice History</span>
                <span className="text-[9px] mt-0.5 opacity-65 text-center">No transaction records found in database.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
