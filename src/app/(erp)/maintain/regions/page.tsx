"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import RegionModal from "@/components/erp/maintain/RegionModal";
import { Plus, Map, Globe2, Search, Edit2, Trash2, FileText, Download, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function RegionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRegions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/regions");
      const json = await res.json();
      if (json.ok) setRegions(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRegions(); }, []);

  const handleAdd = () => { setSelectedRegion(null); setIsModalOpen(true); };

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      for (const row of data) {
        await fetch("/api/regions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: row["Code"] || row.code || `REG-${Date.now()}`,
            name: row["Name"] || row.name || "Unknown Region",
            coverage: row["Coverage"] || row.coverage || "",
            areas: parseInt(row["Areas"] || row.areas || "0"),
          }),
        });
      }
      fetchRegions();
    }
  };

  const handleEdit = (region: any) => { setSelectedRegion(region); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this region?")) {
      try {
        await fetch(`/api/regions/${id}`, { method: "DELETE" });
        fetchRegions();
      } catch (e) { console.error(e); }
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedRegion?._id) {
        await fetch(`/api/regions/${selectedRegion._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/regions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, code: data.code || `REG-${Date.now()}` }),
        });
      }
      fetchRegions();
    } catch (e) { console.error(e); }
    setIsModalOpen(false);
  };

  const filteredRegions = (regions || []).filter(region => {
    const q = searchTerm.toLowerCase();
    return (
      (region.name || "").toLowerCase().includes(q) ||
      (region.code || "").toLowerCase().includes(q) ||
      (region.coverage || "").toLowerCase().includes(q)
    );
  });

  const columns = [
    { header: "Code", accessor: "code" }
  ];

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Regions" 
        subtitle="Master Data / Regions"
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export", onClick: () => exportToExcel(regions, "Regions.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Code", "Name", "Coverage", "Areas"], "RegionsTemplate.xlsx"), icon: Download },
          { label: "Import", onClick: handleImport, icon: FileText },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
            <Map size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{(regions || []).length}</h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Regions</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Globe2 size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {(regions || []).reduce((acc, r) => acc + (r.areas || 0), 0)}
            </h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Areas</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by region name, code, or coverage..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAdd}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Region
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {(filteredRegions || []).map((region) => (
            <div key={region._id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl group-hover:bg-maroon-800 group-hover:text-white transition-all">
                  <Map size={20} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{region.code}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{region.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">({region.areas} areas)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEdit(region)}
                  className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(region._id)}
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {regions.length === 0 && !isLoading && (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 font-bold">No regions found. Add your first region.</div>
          )}
        </div>
      </div>

      <RegionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        region={selectedRegion}
        onSave={handleSave}
      />
    </div>
  );
}
