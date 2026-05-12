"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, Users, DollarSign, Wallet, History, Search, RotateCcw, TrendingDown, ArrowUpRight, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function StaffLoanAdvanceReportPage() {
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const [loansRes, advancesRes, empRes] = await Promise.all([
        fetch("/api/salary-loans"),
        fetch("/api/salary-advances"),
        fetch("/api/employees")
      ]);
      
      const loansJson = await loansRes.json();
      const advancesJson = await advancesRes.json();
      const empJson = await empRes.json();
      
      let empMap = new Map();
      let empByName = new Map();
      let empByCode = new Map();
      if (empJson.ok) {
        setEmployees(empJson.data);
        empMap = new Map(empJson.data.map((e: any) => [e._id, e]));
        empByName = new Map(empJson.data.map((e: any) => [e.name, e]));
        empByCode = new Map(empJson.data.map((e: any) => [e.code, e]));
      }

      const combinedData: any[] = [];
      
      if (loansJson.ok) {
        loansJson.data.forEach((loan: any) => {
          const empId = loan.employeeId || loan.employee;
          const emp = empMap.get(empId) || empByName.get(empId) || empByCode.get(empId);
          if (!emp) return; // hide unknown
          combinedData.push({
            id: loan._id,
            staff: emp.name,
            code: emp.code,
            type: "Loan",
            issued: new Date(loan.date || loan.createdAt).toLocaleDateString(),
            amount: loan.amount || 0,
            recovered: loan.deductedAmount || 0,
            balance: (loan.amount || 0) - (loan.deductedAmount || 0),
          });
        });
      }

      if (advancesJson.ok) {
        advancesJson.data.forEach((adv: any) => {
          const empId = adv.employeeId || adv.employee;
          const emp = empMap.get(empId) || empByName.get(empId) || empByCode.get(empId);
          if (!emp) return; // hide unknown
          combinedData.push({
            id: adv._id,
            staff: emp.name,
            code: emp.code,
            type: "Advance",
            issued: new Date(adv.date || adv.createdAt).toLocaleDateString(),
            amount: adv.amount || 0,
            recovered: adv.deductedAmount || 0,
            balance: (adv.amount || 0) - (adv.deductedAmount || 0),
          });
        });
      }

      setReportData(combinedData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const outstandingData = reportData.filter(r => r.balance > 0);

  const totalLoanOutstanding = outstandingData.filter(r => r.type === "Loan").reduce((sum, r) => sum + r.balance, 0);
  const totalAdvanceOutstanding = outstandingData.filter(r => r.type === "Advance").reduce((sum, r) => sum + r.balance, 0);
  const totalReceivable = totalLoanOutstanding + totalAdvanceOutstanding;

  const stats = [
    { title: "Staff with Outstanding", value: new Set(outstandingData.map(r => r.code)).size.toString(), icon: Users, iconColor: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-50 dark:bg-slate-800/50" },
    { title: "Loan Outstanding", value: `Rs.${totalLoanOutstanding.toLocaleString()}`, icon: History, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
    { title: "Advance Outstanding", value: `Rs.${totalAdvanceOutstanding.toLocaleString()}`, icon: Wallet, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "Total Receivable", value: `Rs.${totalReceivable.toLocaleString()}`, icon: DollarSign, iconColor: "text-white", iconBg: "bg-maroon-800", valueColor: "text-white" },
  ];

  const pieData = [
    { name: 'Loan Outstanding', value: totalLoanOutstanding, color: '#881337' },
    { name: 'Advance Outstanding', value: totalAdvanceOutstanding, color: '#d6a383' },
  ];

  const highestOutstanding = outstandingData.reduce((prev, current) => (prev.balance > current.balance) ? prev : current, { staff: "None", code: "N/A", balance: 0, type: "" } as any);

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Staff</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All</option>
            <option>Loan</option>
            <option>Advance</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Outstanding only</option>
            <option>All</option>
            <option>Paid</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1 flex items-end">
           <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={12} />
            <input type="text" placeholder="Search by staff..." className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-2">
        <button 
          className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20 disabled:opacity-50"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <Play size={14} /> {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>
    </div>
  );

  return (
    <ERPReportLayout
      title="Staff Loan & Advance"
      description="Detailed tracking of employee loans, advances, and recovery status."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Report", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(reportData, "StaffLoans.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Fetching records...</p>
          </div>
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <TrendingDown size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Click generate to view loans & advances</p>
          </div>
        ) : outstandingData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <TrendingDown size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No staff have outstanding loans or advances matching your filters</p>
          </div>
        ) : (
          <>
            <div className="px-4">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Outstanding Balances</h3>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{outstandingData.length} records</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff Name</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Type</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Issued Date</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-right">Amount</th>
                      <th className="px-4 py-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest text-right">Recovered</th>
                      <th className="px-4 py-3 text-[9px] font-black text-rose-600 uppercase tracking-widest text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outstandingData.map((row, i) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-maroon-800">{row.staff}</span>
                                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">{row.code}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                row.type === 'Loan' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {row.type}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center">{row.issued}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-emerald-700 text-right">{row.recovered.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-rose-700 text-right bg-rose-50/30">{row.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest">Outstanding Distribution</h3>
                <div className="h-64 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `Rs.${value}`} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-center">
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                            <ArrowUpRight size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Highest Outstanding</p>
                            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{highestOutstanding.staff} ({highestOutstanding.code})</h4>
                            <p className="text-sm font-bold text-rose-600">Rs. {highestOutstanding.balance.toLocaleString()} ({highestOutstanding.type})</p>
                        </div>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-2">Recovery Insight</h4>
                        <p className="text-xs text-amber-900/70 leading-relaxed font-medium">
                            Staff loans are currently recovered at an average rate of 12.5% per month. Total recovery expected in the next payroll cycle: <span className="font-bold">Rs. 24,500</span>.
                        </p>
                    </div>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ERPReportLayout>
  );
}
