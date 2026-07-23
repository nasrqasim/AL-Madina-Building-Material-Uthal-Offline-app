"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import StaffModal from "@/components/erp/maintain/StaffModal";
import PaySalaryModal from "@/components/salary/PaySalaryModal";
import { Plus, Search, Edit2, Trash2, UserPlus, Printer, FileSpreadsheet, DollarSign, Calendar, Eye } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

export default function StaffSalaryPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaySalaryModalOpen, setIsPaySalaryModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [payStaff, setPayStaff] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (json.ok) setStaffList(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const deleteStaff = async (id: string) => {
    setStaffList((staffList || []).filter(s => s._id !== id));
    try {
      await fetch(`/api/employees/${id}`, { method: "DELETE" });
    } catch (e) { console.error(e); }
  };

  const filteredStaff = (staffList || []).filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesQuery = (
      (s.name || "").toLowerCase().includes(q) ||
      (s.code || "").toLowerCase().includes(q) ||
      (s.cnic || "").toLowerCase().includes(q) ||
      (s.designation || "").toLowerCase().includes(q) ||
      (s.department || "").toLowerCase().includes(q)
    );

    if (!matchesQuery) return false;

    if (fromDate && s.createdAt) {
      if (new Date(s.createdAt) < new Date(fromDate)) return false;
    }
    if (toDate && s.createdAt) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(s.createdAt) > endOfDay) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Salary Staff"
        description="Manage employee salary structures and personnel information."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(staffList, "StaffSalary.xlsx"), icon: FileSpreadsheet },
        ]}
      />
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={() => { setPayStaff(null); setIsPaySalaryModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20"
        >
          <DollarSign size={18} />
          Pay Salary
        </button>
        <button
          onClick={() => { setSelectedStaff(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
        >
          <Plus size={18} />
          Add Salary Staff
        </button>
      </div>

      {/* Filters & Date Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by code, name, CNIC, or designation..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" 
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
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

        <div className="flex gap-3">
          <select className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all">
            <option>All Departments</option>
          </select>
          <select className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all">
            <option>Active Only</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold">Loading...</div>
        ) : filteredStaff.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Designation / Dept</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Basic Salary</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStaff.map((staff) => (
                <tr key={staff._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">{staff.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{staff.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{staff.designation}</div>
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{staff.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-maroon-800">PKR {(staff.basicSalary || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center ${staff.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setPayStaff(staff); setIsPaySalaryModalOpen(true); }}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                        title="Pay Salary to this employee"
                      >
                        <DollarSign size={14} /> Pay Salary
                      </button>
                      <button
                        onClick={() => router.push(`/salary/staff-salary/${staff._id || staff.id}`)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                        title="View Ledger"
                      >
                        <Eye size={14} /> View Ledger
                      </button>
                      <button 
                        onClick={printPage}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all" title="Print"
                      >
                        <Printer size={16} />
                      </button>
                      <button onClick={() => { setSelectedStaff(staff); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteStaff(staff._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <UserPlus size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium mb-1">No salary staff added yet</p>
            <p className="text-xs text-slate-400">Click &quot;Add Salary Staff&quot; to get started</p>
          </div>
        )}
      </div>

      {/* Reuse the Employee/Staff modal but make sure to pass the refetch function */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); fetchStaff(); }}
        staff={selectedStaff}
      />

      <PaySalaryModal
        isOpen={isPaySalaryModalOpen}
        onClose={() => { setIsPaySalaryModalOpen(false); setPayStaff(null); }}
        staffList={staffList}
        onSuccess={() => { setIsPaySalaryModalOpen(false); setPayStaff(null); fetchStaff(); }}
        preselectedStaff={payStaff}
      />
    </div>
  );
}
