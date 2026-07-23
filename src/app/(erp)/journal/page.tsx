"use client";

import { useState, useEffect } from "react";
import JournalEntryForm from "@/components/journal/JournalEntryForm";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  Printer,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

interface JournalEntry {
  id: string;
  voucherNo: string;
  date: string;
  type: string;
  narration: string;
  amount: number;
  status: "Draft" | "Posted";
}

const initialEntries: JournalEntry[] = [
  {
    id: "1",
    voucherNo: "JV-2026-00001",
    date: "2026-04-28",
    type: "Journal",
    narration: "Monthly office rent payment adjustment",
    amount: 45000,
    status: "Posted"
  },
  {
    id: "2",
    voucherNo: "JV-2026-00002",
    date: "2026-05-01",
    type: "Adjustment",
    narration: "Correction of previous utility bill entry",
    amount: 1250,
    status: "Draft"
  },
  {
    id: "3",
    voucherNo: "JV-2026-00003",
    date: "2026-05-02",
    type: "Opening",
    narration: "Opening balance entry for FY 2026",
    amount: 1500000,
    status: "Posted"
  },
  {
    id: "4",
    voucherNo: "JV-2026-00004",
    date: "2026-05-04",
    type: "Journal",
    narration: "Cash withdrawal for petty cash expenses",
    amount: 5000,
    status: "Draft"
  }
];

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/journal-entries");
      const json = await res.json();
      if (json.ok) setEntries(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await fetch(`/api/journal-entries/${id}`, { method: "DELETE" });
      if (res.ok) fetchEntries();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const columns = [
    { header: "DATE", accessor: "date", render: (val: any) => new Date(val).toLocaleDateString() },
    { header: "VOUCHER #", accessor: "voucherNo" },
    { header: "ACCOUNT", accessor: "accountTitle" },
    { header: "REMARKS", accessor: "remarks" },
    { header: "DEBIT", accessor: "debit", render: (val: number) => (
      <span className="font-bold text-slate-900 dark:text-white">{val > 0 ? val.toLocaleString() : "-"}</span>
    )},
    { header: "CREDIT", accessor: "credit", render: (val: number) => (
      <span className="font-bold text-slate-900 dark:text-white">{val > 0 ? val.toLocaleString() : "-"}</span>
    )},
  ];

  if (showForm) {
    return <JournalEntryForm onClose={() => setShowForm(false)} />;
  }

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="General Journal"
        description="Record and manage manual ledger entries."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(entries, "JournalEntries.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-maroon-800/20 transition-all">
          <div className="w-12 h-12 bg-maroon-50 dark:bg-maroon-900/20 text-maroon-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Vouchers</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(entries || []).length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-emerald-500/20 transition-all">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Posted Entries</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(entries || []).filter(e => e.status === "Posted").length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-orange-500/20 transition-all">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending Drafts</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{(entries || []).filter(e => e.status === "Draft").length}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Journal Ledger</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search vouchers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-maroon-800/10 transition-all w-64"
              />
            </div>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
          >
            <Plus size={18} />
            New Entry
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Journal Entries</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Start by creating your first manual ledger entry.</p>
          </div>
        ) : (
          <ERPDataTable 
            columns={columns} 
            data={entries} 
            actions={[
              { label: "View", onClick: () => {}, icon: Eye },
              { label: "Edit", onClick: () => setShowForm(true), icon: Edit },
              { label: "Print", onClick: printPage, icon: Printer },
              { label: "Delete", onClick: (row) => deleteEntry(row.id), icon: Trash2 },
            ]}
          />
        )}
      </div>
    </div>
  );
}
