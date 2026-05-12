"use client";

import ReportLayout from "./ReportLayout";
import { BarChart4, ChevronDown, ListFilter } from "lucide-react";

export default function TrialBalanceReport() {
  const filters = (
    <>
      <div className="space-y-1.5 min-w-[240px]">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Financial Year</label>
        <div className="relative">
          <select className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold appearance-none cursor-pointer">
            <option>Financial Year 2025-26 (Active)</option>
            <option>Financial Year 2024-25</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
        </div>
      </div>
      <div className="space-y-1.5 min-w-[180px]">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">As of Date</label>
        <input type="date" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
      </div>
      <div className="space-y-1.5 min-w-[180px]">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Account Type</label>
        <div className="relative">
          <select className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold appearance-none cursor-pointer">
            <option>All Types</option>
            <option>Asset</option>
            <option>Liability</option>
            <option>Equity</option>
            <option>Income</option>
            <option>Expense</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
        </div>
      </div>
      <div className="space-y-1.5 min-w-[180px]">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Account Level</label>
        <div className="relative">
          <select className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold appearance-none cursor-pointer">
            <option>Level 5 - Detail</option>
            <option>Level 4 - Sub Control</option>
            <option>Level 3 - Control</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
        </div>
      </div>
    </>
  );

  return (
    <ReportLayout 
      title="Trial Balance" 
      subtitle="Comprehensive view of all account balances for the selected period."
      filters={filters}
    >
      <div className="flex flex-col items-center justify-center p-24 text-center">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 text-slate-200 rounded-full flex items-center justify-center mb-6">
          <BarChart4 size={48} />
        </div>
        <h3 className="text-xl font-black text-slate-400 dark:text-slate-500">Select parameters and click Generate</h3>
        <p className="text-slate-400 dark:text-slate-500 font-medium mt-2 max-w-sm">Use the filters above to customize the report data and view your financial position.</p>
      </div>
    </ReportLayout>
  );
}
