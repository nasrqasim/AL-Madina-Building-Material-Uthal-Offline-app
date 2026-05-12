"use client";

import { useState } from "react";
import ERPPageHeader from "../ui/ERPPageHeader";
import ERPDataTable from "../ui/ERPDataTable";
import { Filter, Download, Printer, Calendar } from "lucide-react";
import { printPage } from "@/lib/excel";

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface ReportLayoutProps {
  title: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  isLoading?: boolean;
}

export default function ReportLayout({ 
  title, 
  subtitle, 
  columns, 
  data, 
  isLoading 
}: ReportLayoutProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title={title} 
        description={subtitle || `View and export your ${title.toLowerCase()}`}
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
        ]}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400 dark:text-slate-500" />
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500"
            />
            <span className="text-slate-400 dark:text-slate-500">to</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500"
            />
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2"></div>

          <select className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500">
            <option value="">All Branches</option>
            <option value="main">Main Branch</option>
            <option value="warehouse">Warehouse</option>
          </select>

          <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-maroon-800 text-white rounded-lg text-sm font-medium hover:bg-maroon-900 transition-colors">
            <Filter size={18} />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Data Table */}
      <ERPDataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
      />
    </div>
  );
}
