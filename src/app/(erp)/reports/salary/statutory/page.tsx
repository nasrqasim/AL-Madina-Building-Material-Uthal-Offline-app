"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, ShieldCheck, Calendar, Users, DollarSign, RotateCcw, PieChart as PieChartIcon, LayoutGrid, List, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function StatutoryContributionsReportPage() {
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("month");
  
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

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
      
      if (payrollJson.ok) setPayrolls(payrollJson.data || []);
      if (empJson.ok) setEmployees(empJson.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const empMap = new Map((employees || []).map(e => [e._id, e]));
  const empByName = new Map((employees || []).map(e => [e.name, e]));
  const empByCode = new Map((employees || []).map(e => [e.code, e]));

  // Aggregate by month
  const monthlyMap = new Map();
  // Aggregate by staff
  const staffMap = new Map();
  
  let totalDeductions = 0;
  const uniqueStaff = new Set();
  const uniqueMonths = new Set();

  (payrolls || []).forEach(p => {
    uniqueMonths.add(p.month);
    let monthDeduction = 0;
    
    p.staff.forEach((s: any) => {
      const ded = s.deductions || 0;
      if (ded > 0) {
        const empId = s.employeeId || s.employee;
        const emp = empMap.get(empId) || empByName.get(empId) || empByCode.get(empId);
        if (!emp) return; // hide unknown

        monthDeduction += ded;
        totalDeductions += ded;
        uniqueStaff.add(empId);
        
        const staffTotal = staffMap.get(emp.name) || 0;
        staffMap.set(emp.name, staffTotal + ded);
      }
    });

    const m = monthlyMap.get(p.month) || 0;
    monthlyMap.set(p.month, m + monthDeduction);
  });

  const monthData = Array.from(monthlyMap.entries()).map(([month, deductions]) => ({
    month, deductions, total: deductions
  })).sort((a, b) => a.month.localeCompare(b.month));

  const staffData = Array.from(staffMap.entries()).map(([name, deductions]) => ({
    name, deductions, total: deductions
  })).sort((a, b) => b.deductions - a.deductions);

  const stats = [
    { title: "Periods Covered", value: uniqueMonths.size.toString(), icon: Calendar, iconColor: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-50 dark:bg-slate-800/50" },
    { title: "Deduction Types", value: "1", icon: ShieldCheck, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
    { title: "Staff Affected", value: uniqueStaff.size.toString(), icon: Users, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
    { title: "Total Contributions", value: `Rs.${totalDeductions.toLocaleString()}`, icon: DollarSign, iconColor: "text-white", iconBg: "bg-maroon-800", valueColor: "text-white" },
  ];

  const pieData = [
    { name: 'Statutory Deductions', value: totalDeductions, color: '#881337' }
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26</option>
          </select>
        </div>
        <div className="space-y-1 flex items-end">
            <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2">
                <RotateCcw size={14} /> Reset
            </button>
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

  const Tabs = (
    <div className="flex border-b border-slate-200 dark:border-slate-800 px-4">
      <button 
        onClick={() => setActiveTab("month")}
        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'month' ? 'border-maroon-800 text-maroon-800 bg-maroon-50/30' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300'
        }`}
      >
        <Calendar size={14} /> By Month
      </button>
      <button 
        onClick={() => setActiveTab("deduction")}
        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'deduction' ? 'border-maroon-800 text-maroon-800 bg-maroon-50/30' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300'
        }`}
      >
        <LayoutGrid size={14} /> By Deduction
      </button>
      <button 
        onClick={() => setActiveTab("staff")}
        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'staff' ? 'border-maroon-800 text-maroon-800 bg-maroon-50/30' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300'
        }`}
      >
        <List size={14} /> By Staff
      </button>
    </div>
  );

  return (
    <ERPReportLayout
      title="Statutory Contributions"
      description="Report on income tax, pension, and other statutory deductions from employee salaries."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Contributions", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(monthData, "StatutoryContributions.xlsx"), icon: FileSpreadsheet },
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
            <ShieldCheck size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Click generate to view statutory deductions</p>
          </div>
        ) : monthData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <ShieldCheck size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No statutory deductions found for this financial year</p>
            <p className="text-xs mt-1">Run a payroll first to see contribution reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Tabs}
            
            <div className="px-4">
                {activeTab === 'month' && (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Month</th>
                          <th className="px-4 py-3 text-[9px] font-black text-rose-600 uppercase tracking-widest text-right">Statutory Deductions</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-right">Total Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {monthData.map((row) => (
                          <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 text-[11px] font-bold text-slate-800 dark:text-slate-100">{row.month}</td>
                            <td className="px-4 py-3 text-[11px] font-black text-rose-700 text-right">{row.deductions.toLocaleString()}</td>
                            <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right bg-slate-50 dark:bg-slate-800/50/50">{row.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'deduction' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest">Contribution Breakdown</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => `Rs.${value.toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest">Monthly Trend</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{fontSize: 10}} />
                                <YAxis tick={{fontSize: 10}} />
                                <RechartsTooltip formatter={(value) => `Rs.${value.toLocaleString()}`} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                                <Bar dataKey="deductions" name="Statutory Deductions" fill="#881337" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'staff' && (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff Name</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-rose-600 uppercase tracking-widest text-right">Statutory Deductions</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staffData.map(row => (
                                <tr key={row.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-[11px] font-bold text-slate-800 dark:text-slate-100">{row.name}</td>
                                    <td className="px-4 py-3 text-[11px] font-black text-rose-700 text-right">{row.deductions.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.total.toLocaleString()}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    </ERPReportLayout>
  );
}
