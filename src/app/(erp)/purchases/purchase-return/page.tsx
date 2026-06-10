"use client";

import { useState, useEffect } from "react";
import PurchaseReturnForm from "@/components/purchases/PurchaseReturnForm";
import PurchaseReturnDetails from "@/components/purchases/PurchaseReturnDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, RotateCcw, Link2, AlertCircle, CheckCircle2, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";


export default function PurchaseReturnPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=purchase_return", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setReturns(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [showForm]);

  const handleSaveReturn = (data: any) => {
    if (data.id) {
      setReturns(returns.map(r => r.id === data.id ? { ...r, ...data } : r));
    } else {
      setReturns([...returns, { ...data, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditOrder(null);
  };

  const deleteReturn = async (id: string) => {
    if (confirm("Are you sure you want to delete this purchase return record?")) {
      try {
        const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
        if (res.ok) {
          setReturns(returns.filter(r => r._id !== id));
          alert("Deleted successfully");
        } else {
          alert("Failed to delete");
        }
      } catch (e) { console.error(e); }
    }
  };

  if (showForm) {
    return <PurchaseReturnForm 
      onClose={() => {
        setShowForm(false);
        setEditOrder(null);
      }} 
      onSave={handleSaveReturn}
      initialData={editOrder}
    />;
  }

  if (viewOrder) {
    return (
      <PurchaseReturnDetails 
        record={viewOrder} 
        onClose={() => setViewOrder(null)} 
        onEdit={() => {
          setEditOrder(viewOrder);
          setShowForm(true);
          setViewOrder(null);
        }} 
      />
    );
  }

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = !searchQuery || 
      (ret.invoiceNo || ret.docNo)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.partyId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.partyId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ret.remarks || ret.reason)?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || ret.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const retDateStr = ret.date ? new Date(ret.date).toISOString().split('T')[0] : "";
    const matchesDate = !filterDate || retDateStr === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Purchase Return (Debit Note)"
        description="Manage and track goods returned to vendors (Debit Memos)."
        actions={[
          { label: "Export", onClick: () => exportToExcel(returns, "PurchaseReturns.xlsx"), icon: FileSpreadsheet }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <RotateCcw size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Returns</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{returns.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Posted</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{returns.filter(r => r.status === "Posted").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Drafts</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{returns.filter(r => r.status === "Draft").length}</h4>
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
              placeholder="Search by return#, vendor, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all"
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all flex-1 md:flex-none"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Posted">Posted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2 bg-maroon-800 text-white rounded-lg text-sm font-bold hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Return
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
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12">#</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Return #</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Ref</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : filteredReturns.length > 0 ? (
                filteredReturns.map((ret, i) => (
                  <tr key={ret._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 font-medium">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{ret.invoiceNo || ret.docNo}</span>
                        <Link2 size={12} className="text-blue-400 opacity-0 group-hover:opacity-100" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {ret.date ? new Date(ret.date).toLocaleDateString() : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ret.partyId?.companyName || ret.partyId?.name || ret.vendor}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-maroon-800 bg-maroon-50 px-2 py-0.5 rounded">{ret.reference || ret.invoiceRef}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{ret.remarks || ret.reason}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{(ret.totalAmount || ret.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ret.status === "Posted" ? "bg-emerald-100 text-emerald-700" : 
                        ret.status === "Cancelled" ? "bg-rose-100 text-rose-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewOrder(ret)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" 
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditOrder(ret); setShowForm(true); }}
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
                          onClick={() => deleteReturn(ret._id)}
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
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No purchase return records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-50 bg-slate-50 dark:bg-slate-800/50/30 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
          <span>Total: {filteredReturns.length} return(s)</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Posted: {filteredReturns.filter(r => r.status === "Posted").length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span> Draft: {filteredReturns.filter(r => r.status === "Draft").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
