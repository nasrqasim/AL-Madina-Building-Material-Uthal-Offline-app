"use client";

import { useState } from "react";
import { Search, MoreVertical, Edit, Trash2, Eye, FileText, CreditCard } from "lucide-react";

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface Action {
  label: string;
  onClick: (item: any) => void;
  icon?: any;
  variant?: "default" | "danger";
}

interface ERPDataTableProps {
  columns: Column[];
  data: any[];
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  actions?: Action[];
  isLoading?: boolean;
}

export default function ERPDataTable({ 
  columns, 
  data, 
  onSearch, 
  searchPlaceholder = "Search...",
  actions,
  isLoading 
}: ERPDataTableProps) {
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
      {/* Table Header / Search */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-maroon-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading data...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors group">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200 dark:text-slate-300 whitespace-nowrap">
                      {col.render ? col.render(item?.[col.accessor], item) : item?.[col.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Primary Icons for Common Actions */}
                        {actions.filter(a => ["Edit", "Delete", "View", "Ledger", "Pay", "Receive Payment"].includes(a.label)).map((action, actIdx) => {
                          const ActionIcon = action.icon;
                          return (
                            <button
                              key={actIdx}
                              onClick={() => action.onClick(item)}
                              title={action.label}
                              className={`p-2 rounded-lg transition-all ${
                                action.variant === "danger"
                                  ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              {ActionIcon && <ActionIcon size={18} />}
                            </button>
                          );
                        })}

                        {/* Overflow Menu for Other Actions */}
                        {actions.filter(a => !["Edit", "Delete", "View", "Ledger", "Pay", "Receive Payment"].includes(a.label)).length > 0 && (
                          <div className="relative">
                            <button 
                              onClick={() => setOpenActionMenu(openActionMenu === rowIdx ? null : rowIdx)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {openActionMenu === rowIdx && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenu(null)}></div>
                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                                  {actions.filter(a => !["Edit", "Delete", "View", "Ledger", "Pay", "Receive Payment"].includes(a.label)).map((action, actIdx) => {
                                    const ActionIcon = action.icon;
                                    return (
                                      <button
                                        key={actIdx}
                                        onClick={() => {
                                          action.onClick(item);
                                          setOpenActionMenu(null);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                          action.variant === "danger" 
                                            ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        }`}
                                      >
                                        {ActionIcon && <ActionIcon size={16} />}
                                        {action.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
