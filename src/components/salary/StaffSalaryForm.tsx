"use client";

import { useState } from "react";
import { Save, User, DollarSign, Plus, Trash2 } from "lucide-react";

interface StaffSalaryFormProps {
  onClose: () => void;
}

export default function StaffSalaryForm({ onClose }: StaffSalaryFormProps) {
  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase flex items-center">
            <User size={12} className="mr-1" /> Select Staff Member
          </label>
          <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
            <option value="">Select Employee</option>
            <option value="e1">Nasrullah Qasim</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase flex items-center">
            <DollarSign size={12} className="mr-1" /> Basic Salary
          </label>
          <input type="number" placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-maroon-800" />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase">Allowances & Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">House Rent</label>
            <input type="number" defaultValue={0} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Medical</label>
            <input type="number" defaultValue={0} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Conveyance</label>
            <input type="number" defaultValue={0} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-all">Cancel</button>
        <button type="submit" className="flex items-center px-8 py-2.5 bg-maroon-800 hover:bg-maroon-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-maroon-800/20 transition-all">
          <Save size={18} className="mr-2" /> Save Salary Config
        </button>
      </div>
    </form>
  );
}
