"use client";

import { useState, useEffect } from "react";
import GoodsReceiptForm from "@/components/purchases/GoodsReceiptForm";
import GoodsReceiptDetails from "@/components/purchases/GoodsReceiptDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, Truck, ClipboardList, CheckCircle2, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";


export default function GoodsReceiptPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=grn", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setReceipts(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [showForm]);

  const handleSaveReceipt = (data: any) => {
    if (data.id) {
      setReceipts(receipts.map(r => r.id === data.id ? { ...r, ...data } : r));
    } else {
      setReceipts([...receipts, { ...data, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditOrder(null);
  };

  const deleteReceipt = async (id: string) => {
    if (confirm("Are you sure you want to delete this goods receipt record?")) {
      try {
        const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
        if (res.ok) {
          setReceipts(receipts.filter(r => r._id !== id));
          alert("Deleted successfully");
        } else {
          alert("Failed to delete");
        }
      } catch (e) { console.error(e); }
    }
  };

  if (showForm) {
    return <GoodsReceiptForm 
      onClose={() => {
        setShowForm(false);
        setEditOrder(null);
      }} 
      onSave={handleSaveReceipt}
      initialData={editOrder}
    />;
  }

  if (viewOrder) {
    return (
      <GoodsReceiptDetails 
        receipt={viewOrder} 
        onClose={() => setViewOrder(null)} 
        onEdit={() => {
          setEditOrder(viewOrder);
          setShowForm(true);
          setViewOrder(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Goods Receipt (GRN)"
        description="Record and track incoming goods from vendors."
        actions={[
          { label: "Export", onClick: () => exportToExcel(receipts, "GoodsReceipts.xlsx"), icon: FileSpreadsheet }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Receipts</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{receipts.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Received</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{receipts.filter(r => r.status === "Received").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">In-Transit</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{receipts.filter(r => r.status === "Draft").length}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-800/50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by GRN#, vendor, PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all flex-1 md:flex-none">
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2 bg-maroon-800 text-white rounded-lg text-sm font-bold hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New GRN
            </button>
            <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">GRN Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">PO Ref</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Value (PKR)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : receipts.length > 0 ? (
                receipts.map((rcpt) => (
                  <tr key={rcpt._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{rcpt.invoiceNo || rcpt.docNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(rcpt.date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{rcpt.partyId?.companyName || rcpt.partyId?.name || rcpt.vendor}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{rcpt.reference || rcpt.poRef}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{(rcpt.totalAmount || rcpt.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        rcpt.status === "Received" ? "bg-emerald-100 text-emerald-700" : 
                        rcpt.status === "Cancelled" ? "bg-rose-100 text-rose-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {rcpt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewOrder(rcpt)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" 
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditOrder(rcpt); setShowForm(true); }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={printPage}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all" title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => deleteReceipt(rcpt._id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No goods receipt records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-50 bg-slate-50 dark:bg-slate-800/50/30 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
          <span>Total: {receipts.length} record(s)</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Received: {receipts.filter(r => r.status === "Received").length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span> Draft: {receipts.filter(r => r.status === "Draft").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
