"use client";

import { useState, useEffect } from "react";
import NonTaxPurchaseInvoiceForm from "@/components/purchases/NonTaxPurchaseInvoiceForm";
import NonTaxPurchaseInvoiceDetails from "@/components/purchases/NonTaxPurchaseInvoiceDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Link2, ExternalLink, Clock, CheckCircle2, Printer, FileSpreadsheet, Wallet, Receipt, Upload } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

interface NonTaxInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  vendor: string;
  amount: number;
  status: "Draft" | "Posted" | "Cancelled";
}


export default function NonTaxPurchaseInvoicePage() {
  const [showForm, setShowForm] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<NonTaxInvoice | null>(null);
  const [editOrder, setEditOrder] = useState<NonTaxInvoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=non_tax_purchase", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setInvoices(json.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchInvoices();
  }, [showForm]);

  useEffect(() => {
    const aiDataStr = sessionStorage.getItem("ai_extracted_data");
    if (aiDataStr) {
      try {
        const { type, data } = JSON.parse(aiDataStr);
        if (type === "ntpi") {
          setEditOrder({
            id: "",
            invoiceNo: "NTPI-AUTO-" + Math.floor(Math.random() * 1000),
            date: data.date,
            vendor: data.vendor,
            amount: data.total,
            status: "Draft"
          } as any);
          setShowForm(true);
          sessionStorage.removeItem("ai_extracted_data");
        }
      } catch (e) {
        console.error("Error parsing AI data:", e);
      }
    }
  }, []);

  const handleSaveInvoice = (data: any) => {
    if (data.id) {
      setInvoices(invoices.map(i => i.id === data.id ? { ...i, ...data } : i));
    } else {
      setInvoices([...invoices, { ...data, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditOrder(null);
  };

  const deleteInvoice = async (id: string) => {
    if (confirm("Are you sure you want to delete this non-tax invoice?")) {
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
    return <NonTaxPurchaseInvoiceForm 
      onClose={() => {
        setShowForm(false);
        setEditOrder(null);
      }} 
      onSave={handleSaveInvoice}
      initialData={editOrder}
    />;
  }

  if (viewInvoice) {
    return (
      <NonTaxPurchaseInvoiceDetails 
        record={viewInvoice} 
        onClose={() => setViewInvoice(null)} 
        onEdit={() => {
          setEditOrder(viewInvoice);
          setShowForm(true);
          setViewInvoice(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Non-Tax Purchase Invoice"
        description="Manage commercial vendor invoices without tax deductions."
        actions={[
          { label: "Import", onClick: () => window.location.href = "/ai-studio", icon: Upload },
          { label: "Export", onClick: () => exportToExcel(invoices, "NonTaxPurchaseInvoices.xlsx"), icon: FileSpreadsheet }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-600 rounded-xl flex items-center justify-center">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Non-Tax</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{invoices.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Posted</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{invoices.filter(i => i.status === "Posted").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Draft Value</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              Rs.{invoices.filter(i => i.status === "Draft").reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by invoice#, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
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
              New Invoice
            </button>
            <button className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice #</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{inv.invoiceNo || inv.docNo}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{inv.partyId?.companyName || inv.partyId?.name || inv.vendor}</td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">{(inv.totalAmount || inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        inv.status === "posted" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewInvoice(inv)} className="p-1.5 text-slate-300 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" title="View">
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditOrder(inv); setShowForm(true); }}
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
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
