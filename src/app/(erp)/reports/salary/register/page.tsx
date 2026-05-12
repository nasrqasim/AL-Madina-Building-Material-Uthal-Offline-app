"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, Users, DollarSign, ShieldCheck, Wallet, History, Search, RotateCcw, FileText, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function SalaryRegisterReportPage() {
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("All Months");

  const handleGenerate = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const [payrollRes, empRes] = await Promise.all([
        fetch("/api/payrolls"),
        fetch("/api/employees")
      ]);
      const payrollJson = await payrollRes.json();
      const empJson = await empRes.json();
      
      if (payrollJson.ok) setPayrolls(payrollJson.data);
      if (empJson.ok) setEmployees(empJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const empMap = new Map(employees.map(e => [e._id, e]));
  const empByName = new Map(employees.map(e => [e.name, e]));
  const empByCode = new Map(employees.map(e => [e.code, e]));

  // Filter payrolls by month if selected
  const filteredPayrolls = payrolls.filter(p => selectedMonth === "All Months" || p.month === selectedMonth);

  // Flatten staff data across filtered payrolls
  const reportData = filteredPayrolls.flatMap(p => 
    p.staff.map((s: any) => {
      const empId = s.employeeId || s.employee;
      const emp = empMap.get(empId) || empByName.get(empId) || empByCode.get(empId);
      if (!emp) return null; // hide unknown
      return {
        id: s._id || Math.random().toString(),
        code: emp.code,
        name: emp.name,
        dept: emp.department || "General",
        gross: (s.basicSalary || 0) + (s.allowances || 0),
        statutory: s.deductions || 0,
        loan: s.loans || 0,
        advance: s.advances || 0,
        net: s.netSalary || 0,
      };
    }).filter(Boolean)
  );

  const totalGross = reportData.reduce((sum, item) => sum + item.gross, 0);
  const totalStatutory = reportData.reduce((sum, item) => sum + item.statutory, 0);
  const totalLoan = reportData.reduce((sum, item) => sum + item.loan, 0);
  const totalAdvance = reportData.reduce((sum, item) => sum + item.advance, 0);
  const totalNet = reportData.reduce((sum, item) => sum + item.net, 0);

  const stats = [
    { title: "Lines", value: reportData.length.toString(), icon: FileText, iconColor: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-50 dark:bg-slate-800/50" },
    { title: "Total Gross", value: `Rs.${totalGross.toLocaleString()}`, icon: DollarSign, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
    { title: "Statutory", value: `Rs.${totalStatutory.toLocaleString()}`, icon: ShieldCheck, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Loan Recovery", value: `Rs.${totalLoan.toLocaleString()}`, icon: History, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
    { title: "Advance Recovery", value: `Rs.${totalAdvance.toLocaleString()}`, icon: Wallet, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "Net Paid", value: `Rs.${totalNet.toLocaleString()}`, icon: DollarSign, iconColor: "text-white", iconBg: "bg-maroon-800", valueColor: "text-white" },
  ];

  const deptGroups = reportData.reduce((acc, curr) => {
    acc[curr.dept] = (acc[curr.dept] || 0) + curr.gross;
    return acc;
  }, {} as Record<string, number>);

  const pieColors = ['#881337', '#be123c', '#e11d48', '#f43f5e', '#fb7185'];
  const pieData = Object.entries(deptGroups).map(([name, value], idx) => ({
    name, value, color: pieColors[idx % pieColors.length]
  }));

  const staffCountDept = reportData.reduce((acc, curr) => {
    acc[curr.dept] = (acc[curr.dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const barData = Object.entries(staffCountDept).map(([name, count]) => ({ name, count }));

  const uniqueMonths = Array.from(new Set(payrolls.map(p => p.month))).sort().reverse();

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Month</label>
          <select 
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="All Months">All Months</option>
            {uniqueMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
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
      title="Salary Register"
      description="Detailed payroll breakdown by department and employee for any financial month."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Register", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(reportData, "SalaryRegister.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Calculating salary register...</p>
          </div>
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <FileText size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Click generate to view payroll lines</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <FileText size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No payroll lines match your filters</p>
            <p className="text-xs mt-1">Run a payroll under Salary → Payroll Run first.</p>
          </div>
        ) : (
          <>
            <div className="px-4">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Payroll Summary {selectedMonth !== 'All Months' ? `- ${selectedMonth}` : ''}</h3>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{reportData.length} lines</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dept</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-right">Gross Salary</th>
                      <th className="px-4 py-3 text-[9px] font-black text-rose-600 uppercase tracking-widest text-right">Statutory</th>
                      <th className="px-4 py-3 text-[9px] font-black text-amber-600 uppercase tracking-widest text-right">Loan</th>
                      <th className="px-4 py-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest text-right">Advance</th>
                      <th className="px-4 py-3 text-[9px] font-black text-blue-800 uppercase tracking-widest text-right">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.map((row, i) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-maroon-800">{row.name}</span>
                                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">{row.code}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.dept}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.gross.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-rose-700 text-right bg-rose-50/20">{row.statutory.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-amber-700 text-right bg-amber-50/20">{row.loan.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-emerald-700 text-right bg-emerald-50/20">{row.advance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-blue-900 text-right bg-blue-50/30">{row.net.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900 text-white font-black">
                        <td colSpan={3} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest">Total Payroll</td>
                        <td className="px-4 py-3 text-[11px] text-right">{totalGross.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] text-right text-rose-400">{totalStatutory.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] text-right text-amber-400">{totalLoan.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] text-right text-emerald-400">{totalAdvance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] text-right text-blue-400 underline underline-offset-4 decoration-double">{totalNet.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest">Salary Expense by Department</h3>
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

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest">Staff Count by Department</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Staff Count" fill="#881337" barSize={40} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ERPReportLayout>
  );
}
