"use client";

import { useState, useEffect } from "react";
import PurchaseRequisitionForm from "@/components/store/PurchaseRequisitionForm";
import PurchaseRequisitionDetails from "@/components/store/PurchaseRequisitionDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Send, CheckCircle2, Clock, AlertCircle, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

interface Requisition {
  id: string;
  docNo: string;
  date: string;
  requestedBy: string;
  department: string;
  requiredDate: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  totalEstimate: number;
}

const initialRequisitions: Requisition[] = [
  {
    id: "1",
    docNo: "PR-2026-00001",
    date: "2026-04-28",
    requestedBy: "Nasrullah Qasim",
    department: "Maintenance",
    requiredDate: "2026-05-05",
    priority: "High",
    status: "Approved",
    totalEstimate: 125000.00
  },
  {
    id: "2",
    docNo: "PR-2026-00002",
    date: "2026-04-29",
    requestedBy: "Ahmed Khan",
    department: "Operations",
    requiredDate: "2026-05-10",
    priority: "Medium",
    status: "Submitted",
    totalEstimate: 45000.00
  },
  {
    id: "3",
    docNo: "PR-DUMMY",
    date: "2026-04-30",
    requestedBy: "Ali Raza",
    department: "Production",
    requiredDate: "2026-05-02",
    priority: "Urgent",
    status: "Draft",
    totalEstimate: 8500.00
  }
];

export default function PurchaseRequisitionPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewReq, setViewReq] = useState<any | null>(null);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequisitions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=purchase_requisition", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setRequisitions(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [showForm]);

  const deleteRequisition = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRequisitions(prev => prev.filter(r => r._id !== id));
      } else {
        window.alert("Failed to delete");
      }
    } catch (e) { console.error(e); }
  };

  if (showForm) {
    return <PurchaseRequisitionForm onClose={() => { setShowForm(false); setViewReq(null); }} initialData={viewReq && showForm ? viewReq : null} />;
  }

  if (viewReq) {
    return (
      <PurchaseRequisitionDetails 
        record={viewReq} 
        onClose={() => setViewReq(null)} 
        onEdit={() => {
          setShowForm(true);
          setViewReq(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Purchase Requisition"
        description="Request items from the store or procurement department."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(requisitions, "PurchaseRequisitions.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total PRs</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{requisitions.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Approved</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{requisitions.filter(r => r.status === "Approved").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Send size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Submitted</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{requisitions.filter(r => r.status === "Submitted").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Drafts</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{requisitions.filter(r => r.status === "Draft").length}</h4>
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
              placeholder="Search by PR#, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Requisition
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
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">PR #</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Requested By</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Department</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Priority</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Estimate</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={8} className="px-8 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : requisitions.length > 0 ? (
                requisitions.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{req.invoiceNo || req.docNo}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">{req.date ? req.date.split('T')[0] : "-"}</td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{req.requestedBy || req.userId?.name}</td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{req.department}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        req.priority === "Urgent" ? "text-rose-600" :
                        req.priority === "High" ? "text-orange-600" :
                        "text-blue-600"
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">{(req.totalAmount || req.totalEstimate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>

                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        req.status === "Approved" ? "bg-emerald-100 text-emerald-700" : 
                        req.status === "Submitted" ? "bg-blue-100 text-blue-700" : 
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {req.status}
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
                        <button onClick={() => setViewReq(req)} className="p-1.5 text-slate-300 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => { setViewReq(req); setShowForm(true); }} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteRequisition(req._id)}
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
                  <td colSpan={8} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No requisitions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
