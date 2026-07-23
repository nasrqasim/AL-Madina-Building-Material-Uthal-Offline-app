"use client";

import React, { useState, useEffect } from "react";
import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, RotateCcw, DollarSign, Banknote, CreditCard, Hash, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function VendorPaymentsReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [cp, bp] = await Promise.all([
          fetch('/api/cash-payments').then(r => r.json()),
          fetch('/api/bank-payments').then(r => r.json())
        ]);

        const combined = [
          ...(cp.data || []).map((v: any) => ({ ...v, mode: 'Cash Payment', badge: 'CP' })),
          ...(bp.data || []).map((v: any) => ({ ...v, mode: 'Bank Payment', badge: 'BP' }))
        ].map(v => ({
          id: v._id,
          date: new Date(v.date || v.createdAt).toLocaleDateString(),
          docNo: v.voucherNo || v.docNo || "N/A",
          type: v.badge,
          vendor: v.partyId?.name || v.partyId?.companyName || "-",
          amount: v.amount || 0,
          mode: v.mode,
          status: v.status || "Posted"
        }));

        setData(combined);
      } catch (error) {
        console.error("Error fetching vendor payments:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalPaid = (data || []).reduce((s, r) => s + r.amount, 0);
  const cashPaid = (data || []).filter(d => d.type === 'CP').reduce((s, r) => s + r.amount, 0);
  const bankPaid = (data || []).filter(d => d.type === 'BP').reduce((s, r) => s + r.amount, 0);

  const stats = [
    { title: "TOTAL PAID", value: `Rs. ${totalPaid.toLocaleString()}`, subtitle: `${(data || []).length} payments`, icon: DollarSign, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "CASH PAYMENTS (CP)", value: `Rs. ${cashPaid.toLocaleString()}`, subtitle: `${(data || []).filter(d => d.type === 'CP').length} transactions`, icon: Banknote, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "BANK PAYMENTS (BP)", value: `Rs. ${bankPaid.toLocaleString()}`, subtitle: `${(data || []).filter(d => d.type === 'BP').length} transactions`, icon: CreditCard, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
    { title: "PAYMENT COUNT", value: (data || []).length.toString(), subtitle: `CP: ${(data || []).filter(d => d.type === 'CP').length} | BP: ${(data || []).filter(d => d.type === 'BP').length}`, icon: Hash, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
  ];

  const Filters = (
    <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 w-full">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26...</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date From</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date To</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Vendors</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Type</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Payments</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );


  const lineData = Object.entries((data || []).reduce((acc: any, curr) => {
    const month = curr.date.split('/').slice(1).join('/');
    if (!acc[month]) acc[month] = { name: month, bank: 0, cash: 0 };
    if (curr.type === 'BP') acc[month].bank += curr.amount;
    else acc[month].cash += curr.amount;
    return acc;
  }, {})).map(([_, v]) => v);

  const barData = Object.entries((data || []).reduce((acc: any, curr) => {
    if (!acc[curr.vendor]) acc[curr.vendor] = { name: curr.vendor, value: 0 };
    acc[curr.vendor].value += curr.amount;
    return acc;
  }, {})).map(([_, v]) => v).sort((a: any, b: any) => b.value - a.value).slice(0, 10);

  const pieData = [
    { name: 'Cash Payments', value: cashPaid, color: '#f43f5e' },
    { name: 'Bank Payments', value: bankPaid, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <ERPReportLayout
      title="Vendor Payments"
      description="Reports / Purchase Reports / Vendor Payments"
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Payments", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "VendorPayments.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Vendor Payment Transactions</h3>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{(data || []).length} records</span>
          </div>
          <table className="w-full text-left border-collapse border-b border-slate-200 dark:border-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc #</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Mode</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data || []).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.date}</td>
                  <td className="px-4 py-3 text-[11px] font-bold text-maroon-800 cursor-pointer hover:underline">{row.docNo}</td>
                  <td className="px-4 py-3 text-[11px]">
                    <span className="px-1.5 py-0.5 text-[8px] font-black border border-rose-200 bg-rose-50 text-rose-600 rounded">{row.type}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.vendor}</td>
                  <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.mode}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                <td colSpan={4} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">TOTAL ({(data || []).length} records)</td>
                <td className="px-4 py-3 text-[11px] text-right">{totalPaid.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:col-span-2">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Payment Trend (Monthly)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="bank" name="Bank Payments" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  <Line type="monotone" dataKey="cash" name="Cash Payments" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Cash vs Bank Payments</h3>
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
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Top 10 Vendors by Payment Amount</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{fontSize: 10}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={60} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#881337" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </ERPReportLayout>
  );
}
