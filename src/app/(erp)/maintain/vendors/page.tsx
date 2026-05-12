"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import VendorModal from "@/components/erp/maintain/VendorModal";
import QuickPaymentModal from "@/components/erp/maintain/QuickPaymentModal";
import { Plus, FileText, Download, Printer, UserCheck, UserX, Wallet, Search, Edit2, Trash2, MapPin, User, Hash, FileSpreadsheet } from "lucide-react";
import ERPStatCard from "@/components/erp/ui/ERPStatCard";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function VendorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeVendor, setActiveVendor] = useState<any>(null);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parties");
      const json = await res.json();
      if (json.ok) {
        setVendors(json.data.filter((p: any) => p.type === "Vendor"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAdd = () => {
    setSelectedVendor(null);
    setIsModalOpen(true);
  };

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      console.log("Imported vendor data:", data);
      alert("Bulk import API needs to be implemented. Data parsed successfully.");
    }
  };

  const handleEdit = (vendor: any) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        const res = await fetch(`/api/parties/${id}`, { method: "DELETE" });
        if (res.ok) fetchVendors();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (data: any) => {
    const payload = {
      ...data,
      name: data.companyName || data.name || data.contactPerson || "Unknown",
      code: data.code || `VEND-${Date.now()}`,
      type: "Vendor"
    };

    try {
      if (selectedVendor?._id) {
        const res = await fetch(`/api/parties/${selectedVendor._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchVendors();
      } else {
        const res = await fetch("/api/parties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchVendors();
      }
    } catch (e) {
      console.error(e);
    }
    setIsModalOpen(false);
  };

  const columns = [
    { 
      header: "Code", 
      accessor: "code",
      render: (val: string) => <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{val}</span>
    },
    { 
      header: "Vendor Name", 
      accessor: "name",
      render: (val: string, row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 dark:text-white">{val}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">{row.contactPerson}</span>
        </div>
      )
    },
    { 
      header: "Type", 
      accessor: "type",
      render: (val: string) => (
        <span className="px-3 py-1 bg-maroon-50 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
          {val}
        </span>
      )
    },
    { header: "Phone", accessor: "phone" },
    { header: "City", accessor: "city" },
    { header: "NTN", accessor: "ntn" },
    { 
      header: "WHT", 
      accessor: "wht",
      render: () => <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold">-</span>
    },
    { 
      header: "Purchased Money (Payable)", 
      accessor: "balance", 
      render: (val: number) => (
        <span className="text-sm font-black text-slate-900 dark:text-white">
          Rs.{val?.toLocaleString() || "0"}
        </span>
      )
    },
    { 
      header: "Status", 
      accessor: "status", 
      render: (val: string) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          val === "Active" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        }`}>
          {val}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Vendors" 
        subtitle="Master Data / Vendors"
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(vendors, "Vendors.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Code", "Name", "Contact Person", "Phone", "Email", "City", "NTN", "Balance", "Type", "Status"], "VendorsTemplate.xlsx"), icon: Download },
          { label: "Import Excel", onClick: handleImport, icon: FileText },
        ]}
      />

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search vendors by name, code, phone, or city..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-700 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 dark:text-white outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAdd}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Vendor
            </button>
          </div>
        </div>

        <ERPDataTable 
          columns={columns} 
          data={vendors} 
          actions={[
            { label: "Edit", onClick: handleEdit, icon: Edit2 },
            { label: "View Ledger", onClick: () => {}, icon: FileText },
            { label: "Pay", onClick: (row: any) => { setActiveVendor(row); setIsPaymentModalOpen(true); }, icon: Wallet },
            { label: "Delete", onClick: (row: any) => handleDelete(row._id), icon: Trash2, variant: "danger" },

          ]}
        />
      </div>

      <VendorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        vendor={selectedVendor}
        onSave={handleSave}
      />

      {activeVendor && (
        <QuickPaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)} 
          vendor={activeVendor} 
          onSuccess={fetchVendors} 
        />
      )}
    </div>
  );
}
