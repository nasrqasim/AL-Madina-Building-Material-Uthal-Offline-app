"use client";

import { ReactNode } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  valueColor?: string;
  iconBg?: string;
  iconColor?: string;
}

interface ERPReportLayoutProps {
  title: string;
  description?: string;
  stats?: StatCardProps[];
  filters?: ReactNode;
  children: ReactNode;
  actions?: any; // Allowing any to handle the ActionButton[] | ReactNode union from ERPPageHeader
}

export default function ERPReportLayout({
  title,
  description,
  stats,
  filters,
  children,
  actions
}: ERPReportLayoutProps) {
  return (
    <div className="space-y-6">
      <ERPPageHeader
        title={title}
        description={description}
        actions={actions}
      />

      {/* Summary Cards */}
      {stats && stats.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(stats.length, 4)} gap-4`}>
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg || 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800'} ${stat.iconColor || 'text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.title}</p>
                  <p className={`text-xl font-black ${stat.valueColor || 'text-slate-800 dark:text-slate-100'}`}>{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Report Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Filters Area */}
        {filters && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-slate-800/50/30">
            {filters}
          </div>
        )}

        {/* Table/Content Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
