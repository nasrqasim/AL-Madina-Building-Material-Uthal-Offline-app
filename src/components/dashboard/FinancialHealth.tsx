"use client";

import { Activity, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function FinancialHealth() {
  const ratios = [
    { title: "Current Ratio", label: "Liquidity measure", value: "1.85", target: "1.50", color: "text-emerald-500", progress: 100 },
    { title: "Quick Ratio", label: "Acid-test ratio", value: "1.20", target: "1.00", color: "text-emerald-500", progress: 100 },
    { title: "Debt to Equity", label: "Leverage ratio", value: "0.45", target: "1.00", color: "text-amber-500", progress: 45 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-full transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 rounded-lg">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 dark:text-white tracking-tight">Financial Health</h2>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Key financial ratios and metrics</p>
          </div>
        </div>
        <Link 
          href="/reports/financial/health" 
          className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-rose-800 dark:hover:text-rose-400 transition-colors"
        >
          View More
          <ExternalLink size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {ratios.map((ratio) => (
          <div key={ratio.title} className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div className="relative w-24 h-24 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-slate-200 dark:text-slate-800 dark:text-slate-100"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * ratio.progress) / 100}
                  className={`${ratio.color} transition-all duration-1000`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-slate-800 dark:text-slate-100 dark:text-white">
                {ratio.value}
              </div>
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 dark:text-slate-200">{ratio.title}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-2 uppercase font-medium">{ratio.label}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
              Target: {ratio.target}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="text-rose-500">%</span> Profit Margins
        </h4>
        <div className="space-y-4">
          {[
            { label: "Gross Margin", value: "42.5%", width: "w-[42.5%]" },
            { label: "Operating Margin", value: "24.8%", width: "w-[24.8%]" },
            { label: "Net Margin", value: "16.4%", width: "w-[16.4%]" },
          ].map((margin) => (
            <div key={margin.label} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:text-white dark:group-hover:text-white transition-colors">{margin.label}</span>
                <span className="text-sm font-black text-amber-500">{margin.value}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: margin.value }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="text-rose-500">$</span> Working Capital
          </h4>
        </div>
        <Link 
          href="/reports/financial/cash-management"
          className="block bg-maroon-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-maroon-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-4xl font-black mb-2">Rs. 1,450,000</h3>
                <p className="text-xs font-bold text-white/60 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">+Rs. 250,000</span> vs previous period
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900/10 rounded-xl group-hover:bg-white dark:bg-slate-900/20 transition-colors">
                <ExternalLink size={20} className="text-white/80 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white dark:bg-slate-900/10 rounded-full blur-2xl group-hover:bg-white dark:bg-slate-900/20 transition-colors duration-500"></div>
          <div className="absolute right-4 top-4 w-12 h-12 bg-maroon-400/20 rounded-full blur-xl"></div>
        </Link>
      </div>
    </div>
  );
}
