"use client";

import { useState, useEffect } from "react";
import StockTransferForm from "@/components/store/StockTransferForm";
import StockTransferDetails from "@/components/store/StockTransferDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, Truck, Package, ArrowRightLeft, Clock, MapPin, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

interface StockTransfer {
  id: string;
  docNo: string;
  date: string;
  fromLocation: string;
  toLocation: string;
  status: "Draft" | "Dispatched" | "Received";
  totalValue: number;
  reason: string;
}

const initialTransfers: StockTransfer[] = [
  {
    id: "1",
    docNo: "STK-TRF-00001",
    date: "2026-04-28",
    fromLocation: "Main Warehouse",
    toLocation: "Showroom A",
    status: "Received",
    totalValue: 561600,
    reason: "Restocking showroom inventory for monthly sales target"
  },
  {
    id: "2",
    docNo: "STK-TRF-00002",
    date: "2026-04-30",
    fromLocation: "Main Warehouse",
    toLocation: "Branch B",
    status: "Dispatched",
    totalValue: 245000,
    reason: "Internal stock movement for branch requisition #821"
  },
  {
    id: "3",
    docNo: "STK-TRF-DUMMY",
    date: "2026-05-01",
    fromLocation: "Showroom A",
    toLocation: "Main Warehouse",
    status: "Draft",
    totalValue: 85000,
    reason: "Returning slow-moving stock to main hub"
  }
];

export default function StockTransferPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewTrf, setViewTrf] = useState<any | null>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=stock_transfer", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setTransfers(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [showForm]);

  const deleteTransfer = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTransfers(prev => prev.filter(t => t._id !== id));
      } else {
        window.alert("Failed to delete");
      }
    } catch (e) { console.error(e); }
  };

  if (showForm) {
    return <StockTransferForm onClose={() => { setShowForm(false); setViewTrf(null); }} initialData={viewTrf && showForm ? viewTrf : null} />;
  }

  if (viewTrf) {
    return (
      <StockTransferDetails 
        record={viewTrf} 
        onClose={() => setViewTrf(null)} 
        onEdit={() => {
          setShowForm(true);
          setViewTrf(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Stock Transfer"
        description="Manage and track internal stock movements between locations."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(transfers, "StockTransfers.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transfers</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{transfers.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">In Transit</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{transfers.filter(t => t.status === "Dispatched").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Received</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{transfers.filter(t => t.status === "Received").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{transfers.filter(t => t.status === "Draft").length}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters & Search Row */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by reason, doc#, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
              <option value="">All Status</option>
              <option value="Received">Received</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Draft">Draft</option>
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Transfer
            </button>
            <button className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transfer #</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Route (From → To)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason / Memo</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Value (PKR)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : transfers.length > 0 ? (
                transfers.map((trf) => (
                  <tr key={trf._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{trf.invoiceNo || trf.docNo}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(trf.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{trf.fromLocation || trf.fromWarehouse}</span>
                        <ArrowRightLeft size={14} className="text-slate-300" />
                        <span className="text-sm font-black text-blue-600 uppercase tracking-tight">{trf.toLocation || trf.toWarehouse}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 line-clamp-1">{trf.remarks || trf.reason}</td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">{(trf.totalAmount || trf.totalValue || 0).toLocaleString()}</td>

                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        trf.status === "Received" ? "bg-emerald-100 text-emerald-700" : 
                        trf.status === "Dispatched" ? "bg-blue-100 text-blue-700" : 
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {trf.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={printPage}
                          className="p-1.5 text-slate-300 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all" title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button onClick={() => setViewTrf(trf)} className="p-1.5 text-slate-300 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => { setViewTrf(trf); setShowForm(true); }} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTransfer(trf._id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No transfer records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
