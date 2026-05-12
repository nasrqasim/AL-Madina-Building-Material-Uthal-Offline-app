"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import BankModal from "@/components/erp/maintain/BankModal";
import { Plus, Search, Trash2, Edit2, Star, FileText, Download, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function BanksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBanks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/banks");
      const json = await res.json();
      if (json.ok) setBanks(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBanks(); }, []);

  const handleAdd = () => { setSelectedBank(null); setIsModalOpen(true); };

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      for (const row of data) {
        await fetch("/api/banks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: row["Code"] || row.code || `BANK-${Date.now()}`,
            name: row["Name"] || row.name || "Unknown",
            accountNo: row["Account No"] || row.accountNo || "",
            accountTitle: row["Account Title"] || row.accountTitle || "",
            type: row["Type"] || row.type || "Current Account",
            branch: row["Branch"] || row.branch || "",
            status: row["Status"] || row.status || "Active",
          }),
        });
      }
      fetchBanks();
    }
  };

  const handleEdit = (bank: any) => { setSelectedBank(bank); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      try {
        await fetch(`/api/banks/${id}`, { method: "DELETE" });
        fetchBanks();
      } catch (e) { console.error(e); }
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedBank?._id) {
        await fetch(`/api/banks/${selectedBank._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/banks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, code: data.code || `BANK-${Date.now()}` }),
        });
      }
      fetchBanks();
    } catch (e) { console.error(e); }
    setIsModalOpen(false);
  };

  const columns = [
    { 
      header: "Code", 
      accessor: "code",
      render: (val: string) => <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{val}</span>
    },
    { 
      header: "Bank", 
      accessor: "name",
      render: (val: string, row: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-white">{val}</span>
            {row.isDefault && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase tracking-widest">
                <Star size={10} fill="currentColor" /> Default
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{row.branch}</span>
        </div>
      )
    },
    { header: "Account Number", accessor: "accountNo" },
    { header: "Account Title", accessor: "accountTitle" },
    { 
      header: "Type", 
      accessor: "type",
      render: (val: string) => (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
          {val}
        </span>
      )
    },
    { 
      header: "Balance", 
      accessor: "balance", 
      render: (val: number) => (
        <span className="text-sm font-black text-slate-900 dark:text-white">
          Rs.{(val || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: "Status", 
      accessor: "status", 
      render: (val: string) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          val === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        }`}>
          {val}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Bank Accounts" 
        subtitle="Master Data / Banks"
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(banks, "BankAccounts.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Code", "Name", "Account No", "Account Title", "Type", "Balance", "Branch", "Status"], "BankAccountsTemplate.xlsx"), icon: Download },
          { label: "Import Excel", onClick: handleImport, icon: FileText },
        ]}
      />

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by bank name, branch, or account number..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAdd}
              className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
            >
              <Plus size={18} />
              New Bank
            </button>
          </div>
        </div>

        <ERPDataTable 
          columns={columns} 
          data={banks} 
          actions={[
            { label: "Edit", onClick: handleEdit, icon: Edit2 },
            { label: "Delete", onClick: (row: any) => handleDelete(row._id), icon: Trash2, variant: "danger" },
          ]}
        />
      </div>

      <BankModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        bank={selectedBank}
        onSave={handleSave}
      />
    </div>
  );
}
