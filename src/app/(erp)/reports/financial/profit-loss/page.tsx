"use client";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, TrendingUp, TrendingDown, DollarSign, Percent, Search, Maximize2, Minimize2, Eye, EyeOff, ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart, Area, AreaChart } from 'recharts';

export default function ProfitLossReportPage() {
  const [fromDate, setFromDate] = useState("2026-05-01");
  const [toDate, setToDate] = useState("2026-05-31");
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "revenue": true,
    "expenses": true
  });
  const [detailsOn, setDetailsOn] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/reports/profit-loss?fromDate=${fromDate}&toDate=${toDate}`);
      const json = await res.json();
      if (json.ok) setReport(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const margin = report ? (report.totalRevenue > 0 ? (report.netProfit / report.totalRevenue * 100) : 0) : 0;

  const stats = [
    { title: "Total Revenue", value: `Rs.${(report?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "Total Expenses", value: `Rs.${(report?.totalExpenses || 0).toLocaleString()}`, icon: TrendingDown, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Net Profit", value: `Rs.${(report?.netProfit || 0).toLocaleString()}`, icon: DollarSign, iconColor: "text-blue-600", iconBg: "bg-blue-50", valueColor: "text-blue-600" },
    { title: "Profit Margin", value: `${margin.toFixed(1)}%`, icon: Percent, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26...</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">From Date</label>
          <input 
            type="date" 
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">To Date</label>
          <input 
            type="date" 
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Comparison</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>None</option>
            <option>Previous Period</option>
            <option>Previous Year</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-4 flex items-end">
           <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={12} />
            <input type="text" placeholder="Search accounts by code or name..." className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-2">
        <button 
          onClick={() => setDetailsOn(!detailsOn)}
          className={`px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
            detailsOn ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {detailsOn ? <Eye size={14} /> : <EyeOff size={14} />} Details On
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Maximize2 size={14} /> Expand
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Minimize2 size={14} /> Collapse
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Download size={14} /> CSV
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Printer size={14} /> Print
        </button>
        <button 
          className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20 disabled:opacity-50"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <Play size={14} /> {isLoading ? "Generating..." : "Generate Report"}
        </button>
      </div>
    </div>
  );

  return (
    <ERPReportLayout
      title="Profit & Loss"
      description="Income statement summarizing revenues, costs, and expenses."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Statement", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => {
          if (!report) return alert("Please generate report first");
          const exportData = [
            { Category: "REVENUE", Account: "", Amount: "" },
            ...report.revenue.map((r: any) => ({ Category: "Revenue", Account: r.title, Amount: r.amount })),
            { Category: "Total Revenue", Account: "", Amount: report.totalRevenue },
            { Category: "", Account: "", Amount: "" },
            { Category: "EXPENSES", Account: "", Amount: "" },
            ...report.expenses.map((e: any) => ({ Category: "Expenses", Account: e.title, Amount: e.amount })),
            { Category: "Total Expenses", Account: "", Amount: report.totalExpenses },
            { Category: "", Account: "", Amount: "" },
            { Category: "NET PROFIT", Account: "", Amount: report.netProfit },
          ];
          exportToExcel(exportData, "ProfitLossStatement.xlsx");
        }, icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Calculating profit & loss...</p>
          </div>
        ) : !report ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <div className="flex gap-1 items-end mb-4">
                <div className="w-2 h-8 bg-slate-200 rounded-sm animate-pulse" />
                <div className="w-2 h-12 bg-slate-300 rounded-sm animate-pulse" />
                <div className="w-2 h-6 bg-slate-200 rounded-sm animate-pulse" />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Click generate to view the income statement</p>
          </div>
        ) : (
          <div className="px-4">
            <div className="mb-8 text-center">
                <h2 className="text-xl font-black text-maroon-800 uppercase tracking-widest">Income Statement</h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{COMPANY_NAME} | {fromDate} to {toDate}</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {/* Revenue Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 cursor-pointer" onClick={() => toggleSection("revenue")}>
                        <div className="flex items-center gap-2">
                            {expandedSections["revenue"] ? <ChevronDown size={18} className="text-maroon-800" /> : <ChevronRight size={18} className="text-maroon-800" />}
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Revenue</h3>
                        </div>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{report.totalRevenue.toLocaleString()}</span>
                    </div>
                    {expandedSections["revenue"] && (
                        <div className="space-y-2 pl-6">
                            {report.revenue.map((r: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                                    <span>{r.title}</span>
                                    <span>{r.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Expenses Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 cursor-pointer" onClick={() => toggleSection("expenses")}>
                        <div className="flex items-center gap-2">
                            {expandedSections["expenses"] ? <ChevronDown size={18} className="text-maroon-800" /> : <ChevronRight size={18} className="text-maroon-800" />}
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Operating Expenses</h3>
                        </div>
                        <span className="text-sm font-black text-rose-700">({report.totalExpenses.toLocaleString()})</span>
                    </div>
                    {expandedSections["expenses"] && (
                        <div className="space-y-2 pl-6">
                            {report.expenses.map((e: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                                    <span>{e.title}</span>
                                    <span>{e.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Net Profit */}
                <div className="flex justify-between py-6 border-t-4 border-double border-slate-800 bg-slate-900 px-6 rounded-xl">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Net Profit / (Loss)</h3>
                    <span className={`text-2xl font-black ${report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Rs. {report.netProfit.toLocaleString()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Gross Margin</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">32.0%</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Operating Margin</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">20.0%</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Net Margin</span>
                    <span className={`text-2xl font-black ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{margin.toFixed(1)}%</span>
                </div>
            </div>
          </div>
        )}
      </div>
    </ERPReportLayout>
  );
}
