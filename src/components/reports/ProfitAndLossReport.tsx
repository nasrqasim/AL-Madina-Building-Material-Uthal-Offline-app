"use client";

import ReportLayout from "./ReportLayout";
import { useState } from "react";
import { ChevronDown, ChevronUp, PieChart } from "lucide-react";

export default function ProfitAndLossReport() {
  const data = [
    { 
      group: "INCOME",
      items: [
        { name: "Sales Revenue", amount: 15000000 },
        { name: "Other Income", amount: 250000 },
      ],
      total: 15250000
    },
    { 
      group: "COST OF GOODS SOLD",
      items: [
        { name: "Purchases", amount: 9500000 },
        { name: "Direct Labor", amount: 1200000 },
        { name: "Freight Inward", amount: 150000 },
      ],
      total: 10850000
    },
    { 
      group: "OPERATING EXPENSES",
      items: [
        { name: "Salaries & Wages", amount: 850000 },
        { name: "Rent & Utilities", amount: 450000 },
        { name: "Marketing", amount: 120000 },
      ],
      total: 1420000
    }
  ];

  const grossProfit = data[0].total - data[1].total;
  const netProfit = grossProfit - data[2].total;

  const filters = (
    <div className="flex items-center gap-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Period</label>
        <select className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold w-48">
          <option>This Month</option>
          <option>This Quarter</option>
          <option>This Financial Year</option>
          <option>Last Year</option>
        </select>
      </div>
    </div>
  );

  return (
    <ReportLayout 
      title="Profit & Loss Statement" 
      subtitle="Summarized view of revenues, costs, and expenses incurred during a specific period."
      filters={filters}
    >
      <div className="p-12 max-w-4xl mx-auto space-y-12">
        {data.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-sm font-black text-maroon-800 uppercase tracking-[0.2em] border-b-2 border-maroon-100 pb-2">{section.group}</h3>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300">
                  <span>{item.name}</span>
                  <span>{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 text-base font-black text-slate-900 dark:text-white">
                <span className="uppercase tracking-tight">Total {section.group}</span>
                <span>{section.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            {section.group === "COST OF GOODS SOLD" && (
              <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Gross Profit</span>
                <span className="text-2xl font-black text-maroon-800">{grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        ))}

        <div className="mt-12 p-8 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-[2.5rem] shadow-2xl shadow-maroon-900/30 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white dark:bg-slate-900/10 rounded-2xl backdrop-blur-md">
              <PieChart size={32} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Net Profit / Loss</p>
              <h2 className="text-4xl font-black tracking-tighter mt-1">PKR {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest opacity-60">Margin</p>
            <p className="text-2xl font-black tracking-tighter">{((netProfit / data[0].total) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
