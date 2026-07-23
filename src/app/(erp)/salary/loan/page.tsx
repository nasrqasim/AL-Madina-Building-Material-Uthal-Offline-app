"use client";

import { useState, useEffect } from "react";
import LoanForm from "@/components/salary/LoanRequestForm";
import ReceiveLoanModal from "@/components/salary/ReceiveLoanModal";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Search, Edit, Trash2, Printer, FileSpreadsheet, DollarSign, Calendar } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

export default function SalaryLoanPage() {
  const [showForm, setShowForm] = useState(false);
  const [showReceiveLoanModal, setShowReceiveLoanModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const [loanRes, empRes] = await Promise.all([
        fetch("/api/salary-loans"),
        fetch("/api/employees")
      ]);
      const loanJson = await loanRes.json();
      const empJson = await empRes.json();
      if (loanJson.ok) setRecords(loanJson.data || []);
      if (empJson.ok) setStaffList(empJson.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [showForm]);

  const deleteRecord = async (id: string) => {
    setRecords((records || []).filter(r => r._id !== id));
    try {
      await fetch(`/api/salary-loans/${id}`, { method: "DELETE" });
    } catch (e) { console.error(e); }
  };

  if (showForm) {
    return <LoanForm onClose={() => { setShowForm(false); setSelectedRecord(null); }} initialData={selectedRecord} />;
  }

  const filteredRecords = (records || []).filter(p => {
    const matchesSearch = p.voucherNo?.toLowerCase().includes(searchQuery.toLowerCase()) || p.employee?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (fromDate && p.date) {
      if (new Date(p.date) < new Date(fromDate)) return false;
    }
    if (toDate && p.date) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(p.date) > endOfDay) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Salary Loan"
        description="Manage long-term employee loans and their monthly deduction schedules."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(records, "SalaryLoans.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={() => { setSelectedLoanForRepay(null); setShowReceiveLoanModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20"
        >
          <DollarSign size={18} />
          Receive Loan Repayment
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
        >
          <Plus size={18} />
          Disburse New Loan
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search loans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all font-medium"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <Calendar size={14} className="text-slate-400 ml-1" />
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-transparent border-0 outline-none text-slate-800 dark:text-white font-bold"
            />
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-transparent border-0 outline-none text-slate-800 dark:text-white font-bold"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="text-[10px] text-rose-600 font-extrabold uppercase px-1.5 py-0.5 bg-rose-50 rounded hover:bg-rose-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher No</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Loan Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Installments</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monthly Ded.</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4"><span className="text-sm font-bold text-slate-900 dark:text-white">{p.voucherNo}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.date}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.employee}</span></td>
                    <td className="px-6 py-4 text-right"><span className="text-sm font-black text-maroon-800">PKR {(p.amount||0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-slate-600">{p.installments}</span></td>
                    <td className="px-6 py-4 text-right"><span className="text-sm font-medium text-slate-500">{(p.monthlyDeduction||0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.status === "Active" ? "bg-emerald-100 text-emerald-700" : p.status === "Completed" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedLoanForRepay(p); setShowReceiveLoanModal(true); }}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                          title="Receive loan repayment"
                        >
                          <DollarSign size={14} /> Pay Loan
                        </button>
                        <button onClick={() => { setSelectedRecord(p); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => deleteRecord(p._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">No salary loans found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiveLoanModal
        isOpen={showReceiveLoanModal}
        onClose={() => { setShowReceiveLoanModal(false); setSelectedLoanForRepay(null); }}
        staffList={staffList}
        loansList={records}
        onSuccess={() => fetchLoans()}
        preselectedLoan={selectedLoanForRepay}
      />
    </div>
  );
}
