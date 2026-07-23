"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Plus, Calendar, ShieldCheck, AlertCircle, ChevronRight, CheckCircle2, Trash2 } from "lucide-react";
import FinancialYearModal from "@/components/erp/settings/FinancialYearModal";

export default function FinancialYearPage() {
  const [years, setYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchYears = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/financial-years");
      const data = await res.json();
      if (data.ok) {
        setYears(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch financial years");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleCloseYear = async (id: string) => {
    if (confirm("Are you sure you want to close this financial year? This action is permanent.")) {
      try {
        const res = await fetch(`/api/financial-years/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Closed", isClosed: true }),
        });
        if (res.ok) fetchYears();
      } catch (err) {
        console.error("Failed to close year");
      }
    }
  };

  const handleDeleteYear = async (id: string) => {
    if (confirm("Are you sure you want to delete this financial year? All associated data might be affected.")) {
      try {
        const res = await fetch(`/api/financial-years/${id}`, {
          method: "DELETE",
        });
        if (res.ok) fetchYears();
      } catch (err) {
        console.error("Failed to delete year");
      }
    }
  };

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Financial Year" 
        description="Manage accounting periods and perform year-end closing operations."
      />

      {/* Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Period Management</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">Ensure all transactions are posted before closing.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
        >
          <Plus size={18} />
          New Financial Year
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="p-20 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Loading Periods...</div>
        ) : (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {(years || []).map((year) => (
              <div key={year._id} className={`p-8 rounded-[2.5rem] border-2 transition-all relative group ${
                year.status === "Current" ? "border-maroon-800 bg-maroon-50/10 shadow-lg" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
              }`}>
                <button 
                  onClick={() => handleDeleteYear(year._id)}
                  className="absolute top-6 right-6 p-2 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                     <div className={`p-4 rounded-2xl ${year.status === "Current" ? "bg-maroon-800 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500"}`}>
                        <Calendar size={24} />
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">{year.name}</h4>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Status: <span className={year.status === "Current" ? "text-maroon-800" : "text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500"}>{year.status}</span></p>
                     </div>
                  </div>
                  {year.isClosed ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest mr-8">
                       <CheckCircle2 size={16} />
                       Closed
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleCloseYear(year._id)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mr-8"
                    >
                      Close Year
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Start Date</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date(year.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">End Date</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date(year.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                      <ShieldCheck size={16} className={year.isClosed ? "text-emerald-500" : "text-slate-300"} />
                      {year.isClosed ? "Audited & Verified" : "Pending Audit"}
                   </div>
                   <button className="text-maroon-800 hover:translate-x-1 transition-all">
                      <ChevronRight size={20} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FinancialYearModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchYears} 
      />
    </div>
  );
}

