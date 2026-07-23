"use client";

import { useState, useEffect } from "react";
import SaleInvoiceForm from "@/components/sales/SaleInvoiceForm";
import SaleInvoiceDetails from "@/components/sales/SaleInvoiceDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import WhatsAppShareModal from "@/components/erp/whatsapp/WhatsAppShareModal";
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, ExternalLink, CheckCircle2, CreditCard, Clock, Printer, FileSpreadsheet, Upload, MessageCircle } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

interface SaleInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  customer: string;
  linkedRef: string;
  total: number;
  balance: number;
  status: "Draft" | "Posted" | "Paid" | "Cancelled";
}



export default function SaleInvoicePage() {
  const [showForm, setShowForm] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [waParty, setWaParty] = useState<any>(null);
  const [waDocData, setWaDocData] = useState<any>(null);
  const [shopProfile, setShopProfile] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(1000);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=sale", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setInvoices(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShopProfile = async () => {
    try {
      const res = await fetch("/api/shop-profile");
      const json = await res.json();
      if (json.ok) setShopProfile(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchShopProfile();
  }, [showForm]);

  const deleteInvoice = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvoices(prev => prev.filter(i => i._id !== id));
      } else {
        window.alert("Failed to delete");
      }
    } catch (e) { console.error(e); }
  };

  const filteredInvoices = (invoices || []).filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.partyId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.partyId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.regNo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || inv.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const invDateStr = inv.date ? new Date(inv.date).toISOString().split('T')[0] : "";
    const matchesDate = !filterDate || invDateStr === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDate, statusFilter]);

  // Early returns after all hooks
  if (showForm) {
    return <SaleInvoiceForm 
      onClose={() => {
        setShowForm(false);
        setEditOrder(null);
      }} 
      initialData={editOrder}
    />;
  }

  if (viewOrder) {
    return (
      <SaleInvoiceDetails 
        invoice={viewOrder} 
        onClose={() => setViewOrder(null)} 
        onEdit={() => {
          setEditOrder(viewOrder);
          setShowForm(true);
          setViewOrder(null);
        }} 
      />
    );
  }

  // Pagination logic
  const totalPages = Math.ceil((filteredInvoices || []).length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = (filteredInvoices || []).slice(startIndex, endIndex);

  // Generate page range for display (show max 5 page numbers at a time)
  const getPageRange = () => {
    const range: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    
    return range;
  };

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Sale Invoice"
        description="Manage customer invoices and track payments."
        actions={[
          { label: "Import", onClick: () => window.location.href = "/ai-studio", icon: Upload },
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(invoices, "SaleInvoices.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Invoices</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(invoices || []).length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fully Paid</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(invoices || []).filter(i => i.status?.toLowerCase() === "paid").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Posted</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(invoices || []).filter(i => i.status?.toLowerCase() === "posted").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Drafts</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(invoices || []).filter(i => i.status?.toLowerCase() === "draft").length}</h4>
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
              placeholder="Search by invoice#, customer, vehicle no, reference..."
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
              <option value="Paid">Paid</option>
            </select>
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2 bg-maroon-800 text-white rounded-lg text-sm font-bold hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Invoice
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
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice #</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle No</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">KMs (S/E/R)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Oil Limit</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(currentInvoices || []).length > 0 ? (
                (currentInvoices || []).map((inv, i) => (
                  <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-[11px]">
                    <td className="px-6 py-4 text-slate-500 font-medium">{startIndex + i + 1}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 group-hover:text-maroon-800 transition-colors">{inv.invoiceNo}</span>
                      {inv.reference && <span className="block text-[9px] text-maroon-600 mt-1">Ref: {inv.reference}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-600">{inv.date ? new Date(inv.date).toLocaleDateString() : "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{inv.partyId?.companyName || inv.partyId?.name || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-blue-600">{inv.regNo || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-500">{inv.startKms || 0} / {inv.endKms || 0} / {inv.rangeKms || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-orange-600">{inv.oilGaugeLimit || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-600">{inv.locationId?.name || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-600">{inv.employeeId?.name || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-600">{inv.paymentTerms || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-500 truncate max-w-[150px] inline-block" title={inv.notes || "-"}>{inv.notes || "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-900">{(inv.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-black ${((inv.totalAmount || 0) - (inv.amountReceived || 0)) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {((inv.totalAmount || 0) - (inv.amountReceived || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        inv.status?.toLowerCase() === "paid" ? "bg-emerald-100 text-emerald-700" : 
                        inv.status?.toLowerCase() === "posted" ? "bg-blue-100 text-blue-700" : 
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewOrder(inv)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" 
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={printPage}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all" title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setWaParty(inv.partyId || { name: inv.customerName });
                            setWaDocData({ ...inv, rows: inv.items });
                            setIsWhatsAppModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-all" title="WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditOrder(inv); setShowForm(true); }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteInvoice(inv._id)}
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
                  <td colSpan={15} className="px-6 py-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No sale invoices found.</p>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 dark:bg-slate-950 text-white">
                <td colSpan={11} className="px-6 py-3 text-xs font-black uppercase tracking-widest">Grand Total ({(filteredInvoices || []).length} Invoices)</td>
                <td className="px-6 py-3 text-right text-xs font-black">{(filteredInvoices || []).reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-3 text-right text-xs font-black">{(filteredInvoices || []).reduce((s, i) => s + ((i.totalAmount || 0) - (i.amountReceived || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing {startIndex + 1} to {Math.min(endIndex, (filteredInvoices || []).length)} of {(filteredInvoices || []).length} invoices
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              
              {/* First page */}
              {getPageRange()[0] > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    1
                  </button>
                  {getPageRange()[0] > 2 && <span className="px-2 text-xs text-slate-400">...</span>}
                </>
              )}
              
              {/* Page range */}
              <div className="flex items-center gap-1">
                {getPageRange().map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      currentPage === page
                        ? "bg-maroon-800 text-white"
                        : "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              {/* Last page */}
              {getPageRange()[getPageRange().length - 1] < totalPages && (
                <>
                  {getPageRange()[getPageRange().length - 1] < totalPages - 1 && <span className="px-2 text-xs text-slate-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 border-t border-slate-50 bg-slate-50 dark:bg-slate-800/50/30 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
          <span>Total: {(invoices || []).length} invoice(s)</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Posted: {(invoices || []).filter(i => i.status?.toLowerCase() === "posted").length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Paid: {(invoices || []).filter(i => i.status?.toLowerCase() === "paid").length}
            </span>
          </div>
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
