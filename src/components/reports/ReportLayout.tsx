"use client";

import { useState } from "react";
import { 
  BarChart4, 
  FileSearch, 
  Download, 
  Printer, 
  Filter, 
  RefreshCcw, 
  Search,
  ChevronDown,
  ArrowRight,
  Database,
  FileSpreadsheet
} from "lucide-react";
import { printPage, exportDOMTableToExcel } from "@/lib/excel";

interface ReportLayoutProps {
  title: string;
  subtitle: string;
  filters: React.ReactNode;
  children: React.ReactNode;
}

export default function ReportLayout({ title, subtitle, filters, children }: ReportLayoutProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-8 shadow-sm">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-black text-maroon-800 uppercase tracking-[0.2em] mb-2">
                <Database size={14} />
                <span>Reports / Accounting</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
              <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mt-1">{subtitle}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => exportDOMTableToExcel(title)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-800 shadow-sm">
                <FileSpreadsheet size={18} />
                Excel
              </button>
              <button onClick={printPage} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-800 shadow-sm">
                <Printer size={18} />
                Print
              </button>
              <button className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl font-black text-sm hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20">
                <BarChart4 size={18} />
                Generate
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-wrap items-end gap-6 shadow-inner">
            {filters}
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search by account code or name..." 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 transition-all"
              />
            </div>
            <div className="flex items-center space-x-2 px-4 py-3">
              <input type="checkbox" id="zero-bal" className="w-4 h-4 rounded border-slate-300 text-maroon-800 focus:ring-maroon-800" />
              <label htmlFor="zero-bal" className="text-xs font-black text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider cursor-pointer">Show Zero Balances</label>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto p-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[600px]">
          {children}
        </div>
      </div>
    </div>
  );
}
