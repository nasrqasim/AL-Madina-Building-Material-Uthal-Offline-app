"use client";

import { useState, useEffect } from "react";
import BillOfMaterialsForm from "@/components/store/BillOfMaterialsForm";
import BillOfMaterialsDetails from "@/components/store/BillOfMaterialsDetails";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Filter, Eye, Edit, Trash2, Layers, Settings, Activity, Clock, LayoutGrid, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

interface BOM {
  id: string;
  docNo: string;
  bomName: string;
  finishedItem: string;
  version: string;
  status: "Active" | "Draft" | "Archived";
  totalCost: number;
  location: string;
}

const initialBOMs: BOM[] = [
  {
    id: "1",
    docNo: "BOM-2026-00001",
    bomName: "Mobil Special 4L Production",
    finishedItem: "Mobil Special 20W-50 4L",
    version: "1.0",
    status: "Active",
    totalCost: 3500,
    location: "Main Warehouse"
  },
  {
    id: "2",
    docNo: "BOM-2026-00002",
    bomName: "Shell Helix HX5 1L Pack",
    finishedItem: "Shell Helix HX5 1L",
    version: "2.1",
    status: "Draft",
    totalCost: 1200,
    location: "Packaging Unit 1"
  },
  {
    id: "3",
    docNo: "BOM-DUMMY",
    bomName: "Castrol Magnatec 4L Blend",
    finishedItem: "Castrol Magnatec 5W-30",
    version: "1.2",
    status: "Draft",
    totalCost: 4800,
    location: "Main Warehouse"
  }
];

export default function BillOfMaterialsPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewBOM, setViewBOM] = useState<any | null>(null);
  const [boms, setBoms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBOMs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices?type=bill_of_materials", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setBoms(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBOMs();
  }, [showForm]);

  const deleteBOM = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBoms(prev => prev.filter(b => b._id !== id));
      } else {
        window.alert("Failed to delete");
      }
    } catch (e) { console.error(e); }
  };

  if (showForm) {
    return <BillOfMaterialsForm onClose={() => { setShowForm(false); setViewBOM(null); }} initialData={viewBOM && showForm ? viewBOM : null} />;
  }

  if (viewBOM) {
    return (
      <BillOfMaterialsDetails 
        record={viewBOM} 
        onClose={() => setViewBOM(null)} 
        onEdit={() => {
          setShowForm(true);
          setViewBOM(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Bill of Materials"
        description="Define and manage manufacturing recipes and costs."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(boms, "BillOfMaterials.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-maroon-50 text-maroon-800 rounded-xl flex items-center justify-center">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Recipes</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{boms.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Settings size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active BOMs</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{boms.filter(b => b.status === "Active").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg. Cost</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              Rs.{(boms.reduce((sum, b) => sum + b.totalCost, 0) / (boms.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Drafts</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{boms.filter(b => b.status === "Draft").length}</h4>
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
              placeholder="Search by recipe name, finished item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New BOM
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
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc No</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recipe Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Finished Item</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Version</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Estimated Cost</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : boms.length > 0 ? (
                boms.map((bom) => (
                  <tr key={bom._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{bom.invoiceNo || bom.docNo}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{bom.bomName || bom.name}</td>
                    <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{bom.finishedItem || bom.itemName}</td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">v{bom.version || "1.0"}</span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">{(bom.totalAmount || bom.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>

                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        bom.status === "Active" ? "bg-emerald-100 text-emerald-700" : 
                        bom.status === "Draft" ? "bg-orange-100 text-orange-700" : 
                        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      }`}>
                        {bom.status}
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
                        <button onClick={() => setViewBOM(bom)} className="p-1.5 text-slate-300 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => { setViewBOM(bom); setShowForm(true); }} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteBOM(bom._id)}
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
                  <td colSpan={7} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">No bill of materials found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
