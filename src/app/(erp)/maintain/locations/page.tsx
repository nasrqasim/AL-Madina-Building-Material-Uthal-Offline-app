"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import LocationModal from "@/components/erp/maintain/LocationModal";
import { Plus, MapPin, Search, Edit2, Trash2, Home, CheckCircle2, FileText, Download, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function LocationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/locations");
      const json = await res.json();
      if (json.ok) setLocations(json.data || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleAdd = () => { setSelectedLocation(null); setIsModalOpen(true); };

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      for (const row of data) {
        await fetch("/api/locations", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: row["Code"] || row.code || `LOC-${Date.now()}`,
            name: row["Name"] || row.name || "Unknown",
            type: row["Type"] || row.type || "Warehouse",
            city: row["City"] || row.city || "",
            contact: row["Contact"] || row.contact || "",
            phone: row["Phone"] || row.phone || "",
            status: row["Status"] || row.status || "Active",
          }),
        });
      }
      fetchLocations();
    }
  };

  const handleEdit = (loc: any) => { setSelectedLocation(loc); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      await fetch(`/api/locations/${id}`, { method: "DELETE" });
      fetchLocations();
    }
  };

  const handleSave = async (data: any) => {
    if (selectedLocation?._id) {
      await fetch(`/api/locations/${selectedLocation._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } else {
      await fetch("/api/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, code: data.code || `LOC-${Date.now()}` }) });
    }
    fetchLocations();
    setIsModalOpen(false);
  };

  const filteredLocations = (locations || []).filter(loc => {
    const q = searchTerm.toLowerCase();
    return (
      (loc.name || "").toLowerCase().includes(q) ||
      (loc.code || "").toLowerCase().includes(q) ||
      (loc.type || "").toLowerCase().includes(q) ||
      (loc.city || "").toLowerCase().includes(q) ||
      (loc.contact || "").toLowerCase().includes(q)
    );
  });

  const columns = [
    { header: "Code", accessor: "code", render: (val: string) => <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{val}</span> },
    { header: "Location Name", accessor: "name", render: (val: string, row: any) => (
      <div className="flex items-center gap-2">
        <span className="font-black text-slate-900 dark:text-white">{val}</span>
        {row.isDefault && <span className="px-2 py-0.5 bg-maroon-50 text-maroon-800 rounded text-[9px] font-black uppercase tracking-widest">Default</span>}
      </div>
    )},
    { header: "Type", accessor: "type", render: (val: string) => <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">{val}</span> },
    { header: "City", accessor: "city" },
    { header: "Contact", accessor: "contact" },
    { header: "Status", accessor: "status", render: (val: string) => <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${val === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{val}</span> },
  ];

  return (
    <div className="space-y-6">
      <ERPPageHeader title="Inventory Locations" subtitle="Master Data / Inventory Locations"
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export", onClick: () => exportToExcel(locations, "Locations.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Code", "Name", "Type", "City", "Contact", "Phone", "Status"], "LocationsTemplate.xlsx"), icon: Download },
          { label: "Import", onClick: handleImport, icon: FileText },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><MapPin size={24} /></div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(locations || []).length}</h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Total Locations</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(locations || []).filter(l => l.status === "Active").length}</h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Active Locations</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Home size={24} /></div>
          <div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white truncate max-w-[150px]">{(locations || []).find(l => l.isDefault)?.name || "None"}</h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Default Location</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by location name, code, type, or city..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-maroon-800/5 transition-all" 
            />
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20">
            <Plus size={18} /> New Location
          </button>
        </div>
        <ERPDataTable columns={columns} data={filteredLocations}
          actions={[
            { label: "Edit", onClick: handleEdit, icon: Edit2 },
            { label: "Delete", onClick: (row: any) => handleDelete(row._id), icon: Trash2, variant: "danger" },
          ]}
        />
      </div>

      <LocationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} location={selectedLocation} onSave={handleSave} />
    </div>
  );
}
