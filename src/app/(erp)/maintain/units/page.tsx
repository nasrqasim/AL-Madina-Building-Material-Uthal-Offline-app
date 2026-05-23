"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import UnitModal from "@/components/erp/maintain/UnitModal";
import { Plus, Search, Edit2, Trash2, Info, FileText, Download, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function UnitsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/units");
      const json = await res.json();
      if (json.ok) setUnits(json.data);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUnits(); }, []);

  const handleAdd = () => { setSelectedUnit(null); setIsModalOpen(true); };

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      for (const row of data) {
        await fetch("/api/units", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: row["Code"] || row.code || `UNIT-${Date.now()}`,
            name: row["Name"] || row.name || "Unknown",
            type: row["Type"] || row.type || "Other",
            description: row["Description"] || row.description || "",
            status: row["Status"] || row.status || "Active",
          }),
        });
      }
      fetchUnits();
    }
  };

  const handleEdit = (unit: any) => { setSelectedUnit(unit); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this unit?")) {
      try {
        const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.message || "Failed to delete unit");
        }
        fetchUnits();
      } catch (e) {
        console.error(e);
        alert((e as Error).message);
      }
    }
  };

  const handleSave = async (data: any) => {
    try {
      const url = selectedUnit?._id ? `/api/units/${selectedUnit._id}` : "/api/units";
      const method = selectedUnit?._id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedUnit?._id ? data : { ...data, code: data.code || `UNIT-${Date.now()}` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to save unit");

      fetchUnits();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    }
  };

  const filteredUnits = units.filter(unit => {
    const q = searchTerm.toLowerCase();
    return (
      (unit.name || "").toLowerCase().includes(q) ||
      (unit.code || "").toLowerCase().includes(q) ||
      (unit.type || "").toLowerCase().includes(q) ||
      (unit.description || "").toLowerCase().includes(q)
    );
  });

  const columns = [
    { header: "Code", accessor: "code", render: (val: string) => <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-[10px] font-black uppercase tracking-widest">{val}</span> },
    { header: "Name", accessor: "name", render: (val: string) => <span className="font-black text-slate-900 dark:text-white">{val}</span> },
    { header: "Type", accessor: "type", render: (val: string) => <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">{val}</span> },
    { header: "Description", accessor: "description", render: (val: string) => <span className="text-slate-400 dark:text-slate-500 font-bold">{val || "-"}</span> },
    { header: "Status", accessor: "status", render: (val: string) => <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${val === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{val}</span> },
  ];

  return (
    <div className="space-y-6">
      <ERPPageHeader title="Units of Measure" subtitle="Master Data / Units"
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export", onClick: () => exportToExcel(units, "UnitsOfMeasure.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Code", "Name", "Type", "Description", "Status"], "UnitsTemplate.xlsx"), icon: Download },
          { label: "Import", onClick: handleImport, icon: FileText },
          { label: "Add Unit", onClick: handleAdd, icon: Plus, variant: "primary" },
        ]}
      />
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-l-4 border-l-maroon-800 border-y border-r border-slate-100 dark:border-slate-800 shadow-sm flex gap-4">
        <div className="p-2 text-maroon-800 shrink-0"><Info size={24} /></div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
          <span className="text-slate-900 dark:text-white font-black">Units of Measure</span> defines the units (Pcs, Ctn, Box, Kg, Litre etc.) that items can be sold or purchased in.
        </p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by unit name, code, type, or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-maroon-800/5 transition-all" 
            />
          </div>
        </div>
        <ERPDataTable columns={columns} data={filteredUnits}
          actions={[
            { label: "Edit", onClick: handleEdit, icon: Edit2 },
            { label: "Delete", onClick: (row: any) => handleDelete(row._id), icon: Trash2, variant: "danger" },
          ]}
        />
      </div>
      <UnitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} unit={selectedUnit} onSave={handleSave} />
    </div>
  );
}
