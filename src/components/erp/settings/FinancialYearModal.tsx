"use client";

import { useState } from "react";
import { X, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface FinancialYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FinancialYearModal({ isOpen, onClose, onSuccess }: FinancialYearModalProps) {
  const [formData, setFormData] = useState({
    name: "FY 2025-26",
    startDate: "2025-07-01",
    endDate: "2026-06-30",
    status: "Upcoming",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/financial-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to save financial year");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-maroon-800 text-white rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">New Financial Year</h2>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Accounting Period</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Period Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                placeholder="e.g. FY 2025-26"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                <input
                  required
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                <input
                  required
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 appearance-none cursor-pointer"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Current">Set as Current (Closes others)</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-4 bg-maroon-800 text-white rounded-2xl font-black shadow-lg shadow-maroon-900/20 hover:bg-maroon-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={20} />
              )}
              Create Period
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
