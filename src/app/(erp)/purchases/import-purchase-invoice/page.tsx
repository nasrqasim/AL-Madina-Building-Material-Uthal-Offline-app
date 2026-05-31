"use client";

import { useState, useEffect } from "react";
import ImportPurchaseInvoiceForm from "@/components/purchases/ImportPurchaseInvoiceForm";
import ImportPurchaseInvoiceDetails from "@/components/purchases/ImportPurchaseInvoiceDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, Globe, Ship, Anchor, CheckCircle2, Link2, Printer, FileSpreadsheet, Clock, MessageCircle } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { loadInvoiceById } from "@/lib/loadInvoice";
import WhatsAppShareModal from "@/components/erp/whatsapp/WhatsAppShareModal";

interface ImportInvoice {
  id: string;
  docNo: string;
  date: string;
  vendor: string;
  gdNo: string;
  amountFC: number;
  currency: string;
  status: "Draft" | "Posted" | "Cancelled";
}


export default function ImportPurchaseInvoicePage() {
  const [showForm, setShowForm] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [waParty, setWaParty] = useState<any>(null);
  const [waDocData, setWaDocData] = useState<any>(null);
  const [shopProfile, setShopProfile] = useState<any>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=import_purchase", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setInvoices(json.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchShopProfile = async () => {
    try {
      const res = await fetch("/api/shop-profile");
      const json = await res.json();
      if (json.ok) setShopProfile(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const openView = async (inv: { _id: string }) => {
    setLoadingRecord(true);
    const full = await loadInvoiceById(inv._id);
    if (!full) {
      alert("Could not load import invoice details.");
      setLoadingRecord(false);
      return;
    }
    setViewInvoice(full);
    setLoadingRecord(false);
  };

  const openEdit = async (inv: { _id: string }) => {
    setLoadingRecord(true);
    setViewInvoice(null);
    const full = await loadInvoiceById(inv._id);
    if (!full) {
      alert("Could not load import invoice for editing. Please try again.");
      setLoadingRecord(false);
      return;
    }
    setEditOrder(full);
    setShowForm(true);
    setLoadingRecord(false);
  };

  useEffect(() => {
    fetchInvoices();
    fetchShopProfile();
  }, [showForm]);

  const handleSaveInvoice = () => {
    setShowForm(false);
    setEditOrder(null);
    setViewInvoice(null);
    fetchInvoices();
  };

  const deleteInvoice = async (id: string) => {
    if (confirm("Are you sure you want to delete this import invoice?")) {
      try {
        const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
        if (res.ok) {
          setInvoices(invoices.filter(i => i._id !== id));
          alert("Deleted successfully");
        } else { alert("Failed to delete"); }
      } catch (e) { console.error(e); }
    }
  };

  if (showForm) {
    return (
      <ImportPurchaseInvoiceForm
        key={editOrder?._id ? `edit-${editOrder._id}` : "new"}
        onClose={() => {
          setShowForm(false);
          setEditOrder(null);
        }}
        onSave={handleSaveInvoice}
        initialData={editOrder}
      />
    );
  }

  if (viewInvoice) {
    return (
      <ImportPurchaseInvoiceDetails 
        record={viewInvoice} 
        onClose={() => setViewInvoice(null)} 
        onEdit={() => {
          if (viewInvoice?._id) openEdit(viewInvoice);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Import Purchase Invoice"
        description="Manage foreign purchases, GDs, customs duty, and multi-currency bills."
        actions={[
          { label: "Export", onClick: () => exportToExcel(invoices, "ImportPurchaseInvoices.xlsx"), icon: FileSpreadsheet }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Imports</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{invoices.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customs Cleared</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{invoices.filter(i => i.status === "Posted").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">In Transit</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{invoices.filter(i => i.status === "Draft").length}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by doc#, vendor, GD#..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Posted">Posted</option>
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Import
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
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc #</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">GD #</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amount (FC)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{inv.invoiceNo || inv.docNo}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{inv.partyId?.companyName || inv.partyId?.name || inv.vendor}</td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-maroon-800 bg-maroon-50 px-2 py-0.5 rounded">{inv.gdNo}</span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">
                      <div className="flex flex-col items-end">
                        <span>{(inv.totalAmount || inv.amountFC || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">{inv.currency}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        inv.status === "posted" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openView(inv)} disabled={loadingRecord} className="p-1.5 text-slate-300 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" title="View">
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEdit(inv)}
                          disabled={loadingRecord}
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
                          onClick={() => {
                            setWaParty(inv.partyId || { name: inv.vendor });
                            setWaDocData({ ...inv, rows: inv.lines });
                            setIsWhatsAppModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-all"
                          title="WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button 
                          onClick={() => deleteInvoice(inv._id)}
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
                  <td colSpan={7} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        party={waParty}
        type="Invoice"
        documentData={waDocData}
        shopProfile={shopProfile}
      />
    </div>
  );
}
