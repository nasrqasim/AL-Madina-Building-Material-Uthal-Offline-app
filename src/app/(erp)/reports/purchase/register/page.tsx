"use client";

import React, { useState, useEffect } from "react";
import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, FileText, ShoppingCart, DollarSign, Percent, Search, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export default function PurchaseRegisterReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/purchases');
        const json = await res.json();
        if (json.ok && json.data) {
          const transformed = json.data.map((p: any) => ({
            id: p._id,
            date: new Date(p.date).toLocaleDateString(),
            docNo: p.invoiceNo || p.docNo || "N/A",
            vendorInv: p.reference || "-",
            type: p.type?.toUpperCase().replace('_', ' ') || "PURCHASE",
            vendor: p.partyId?.name || p.partyId?.companyName || "-",
            job: p.jobId?.name || "-",
            emp: p.employeeId?.name || "-",
            gross: p.subTotal || 0,
            discount: p.discountAmount || 0,
            gst: p.taxAmount || 0,
            wht: p.whtAmount || 0,
            net: p.totalAmount || 0,
            status: p.status || "Posted",
            statusColor: "text-emerald-600 bg-emerald-50"
          }));
          setData(transformed);
        }
      } catch (error) {
        console.error("Error fetching purchase register:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredData = (data || []).filter(row => {
    const q = searchTerm.toLowerCase();
    return (
      (row.docNo || "").toLowerCase().includes(q) ||
      (row.vendor || "").toLowerCase().includes(q) ||
      (row.vendorInv || "").toLowerCase().includes(q) ||
      (row.type || "").toLowerCase().includes(q)
    );
  });

  const stats = [
    { title: "Total Documents", value: filteredData.length.toString(), icon: FileText, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Total Gross Amount", value: `Rs. ${filteredData.reduce((s, r) => s + r.gross, 0).toLocaleString()}`, icon: ShoppingCart, iconColor: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-50 dark:bg-slate-800/50" },
    { title: "Total Net Amount", value: `Rs. ${filteredData.reduce((s, r) => s + r.net, 0).toLocaleString()}`, icon: DollarSign, iconColor: "text-rose-600", iconBg: "bg-rose-50", valueColor: "text-rose-600" },
    { title: "Total GST", value: `Rs. ${filteredData.reduce((s, r) => s + r.gst, 0).toLocaleString()}`, icon: Percent, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Document Type</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Types</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tax Filter</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Both (Tax + Non-Tax)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Vendors</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job / Project</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Jobs</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Employees</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search by doc number, vendor invoice number, or vendor name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" 
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20">
            <Play size={14} /> Generate
          </button>
        </div>
      </div>
    </div>
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE ORDER': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'PURCHASE RETURN': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'GOODS RECEIPT NOTE': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'PURCHASE INVOICE': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'NON-TAX PURCHASE INVOICE': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  };


  const lineData = Object.entries(filteredData.reduce((acc: any, curr) => {
    const month = curr.date.split('/').slice(1).join('/');
    if (!acc[month]) acc[month] = { name: month, documents: 0, netAmount: 0 };
    acc[month].documents += 1;
    acc[month].netAmount += curr.net;
    return acc;
  }, {})).map(([_, v]) => v);

  const barData = Object.entries(filteredData.reduce((acc: any, curr) => {
    if (!acc[curr.type]) acc[curr.type] = { name: curr.type, gross: 0, net: 0 };
    acc[curr.type].gross += curr.gross;
    acc[curr.type].net += curr.net;
    return acc;
  }, {})).map(([_, v]) => v);

  return (
    <ERPReportLayout
      title="Purchase Register"
      description="Detailed log of all purchase transactions including returns and tax invoices."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Report", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(filteredData, "PurchaseRegister.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse border-b border-slate-200 dark:border-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc #</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Invoice</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Gross Amount</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Discount</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">GST</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">WHT</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Net Amount</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row, i) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.date}</td>
                  <td className="px-4 py-3 text-[11px] font-bold text-maroon-800 cursor-pointer hover:underline">
                    {row.docNo}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.vendorInv}</td>
                  <td className="px-4 py-3 text-[11px]">
                    <span className={`px-1.5 py-0.5 text-[8px] font-black border rounded ${getTypeColor(row.type)}`}>{row.type}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.vendor}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.job}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.emp}</td>
                  <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.gross.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.discount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.gst.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.wht.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.net.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                <td colSpan={8} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">Grand Total ({filteredData.length} documents)</td>
                <td className="px-4 py-3 text-[11px] text-right">{filteredData.reduce((s, r) => s + r.gross, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-[11px] text-right">{filteredData.reduce((s, r) => s + r.discount, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-[11px] text-right">{filteredData.reduce((s, r) => s + r.gst, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-[11px] text-right">{filteredData.reduce((s, r) => s + r.wht, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-[11px] text-right">{filteredData.reduce((s, r) => s + r.net, 0).toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Monthly Purchase Document Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis yAxisId="left" tick={{fontSize: 10}} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} />
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
                  <Line yAxisId="left" type="monotone" dataKey="netAmount" name="Net Amount" stroke="#881337" strokeWidth={2} dot={{ fill: '#881337', r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="documents" name="Documents" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Amount by Document Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 8}} />
                  <YAxis tick={{fontSize: 10}} />
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '10px' }}/>
                  <Bar dataKey="gross" name="Gross Amount" fill="#881337" barSize={30} />
                  <Bar dataKey="net" name="Net Amount" fill="#d6a383" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </ERPReportLayout>
  );
}
