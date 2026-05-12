"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, RotateCcw, Users, DollarSign, TrendingDown, TrendingUp, Search, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PartySaleSummaryReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/sales');
        const json = await res.json();
        if (json.ok && json.data) {
          // Group by partyId
          const grouped = json.data.reduce((acc: any, s: any) => {
            const key = s.partyId?._id || "walk-in";
            if (!acc[key]) {
              acc[key] = {
                id: key,
                customerCode: s.partyId?.code || "WALK-001",
                customerName: s.partyId?.name || s.partyId?.companyName || s.customerName || "Walk-in",
                invoices: 0,
                gross: 0,
                returns: 0,
                discount: 0,
                gst: 0,
                net: 0
              };
            }
            acc[key].invoices += 1;
            if (s.type === 'sale_return') {
              acc[key].returns += Math.abs(s.totalAmount);
            } else {
              acc[key].gross += s.subTotal || 0;
              acc[key].discount += s.discountAmount || 0;
              acc[key].gst += s.taxAmount || 0;
              acc[key].net += s.totalAmount || 0;
            }
            return acc;
          }, {});

          const totalNetAll: number = Object.values(grouped).reduce((s: number, r: any) => s + r.net, 0);
          const transformed = Object.values(grouped).map((r: any) => ({
            ...r,
            percent: totalNetAll > 0 ? ((r.net / totalNetAll) * 100).toFixed(1) + "%" : "0%"
          }));
          setData(transformed);
        }
      } catch (error) {
        console.error("Error fetching party sale summary:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalInvoices = data.reduce((acc, curr) => acc + curr.invoices, 0);
  const totalGross = data.reduce((acc, curr) => acc + curr.gross, 0);
  const totalReturns = data.reduce((acc, curr) => acc + curr.returns, 0);
  const totalNet = data.reduce((acc, curr) => acc + curr.net, 0);

  const stats = [
    { title: "CUSTOMERS WITH SALES", value: data.length.toString(), subtitle: "Active customers", icon: Users, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "TOTAL SALE AMOUNT", value: `Rs. ${totalGross.toLocaleString()}`, subtitle: "Gross Invoiced", icon: DollarSign, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "TOTAL RETURNS", value: `Rs. ${totalReturns.toLocaleString()}`, subtitle: "Sale returns", icon: TrendingDown, iconColor: "text-rose-600", iconBg: "bg-rose-50", valueColor: "text-rose-600" },
    { title: "NET SALES", value: `Rs. ${totalNet.toLocaleString()}`, subtitle: "Sales - Returns", icon: TrendingUp, iconColor: "text-blue-600", iconBg: "bg-blue-50", valueColor: "text-blue-600" },
  ];

  const Filters = (
    <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-3 w-full">
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26...</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date From</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date To</label>
          <input type="date" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Customers</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Area</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Areas</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Region</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Regions</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Salesperson</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Salespersons</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tax Filter</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Both (Tax + Non-Tax)</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Min Amount</label>
          <input type="number" placeholder="0" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button 
          className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center"
          onClick={() => setHasSearched(!hasSearched)}
        >
          <RotateCcw size={14} />
        </button>
        <button className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1">
          <Download size={12} /> CSV
        </button>
        <button className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center gap-1">
          <Printer size={12} /> Print
        </button>
      </div>
    </div>
  );


  const barData = data.map(r => ({ name: r.customerName, value: r.net })).sort((a, b) => b.value - a.value).slice(0, 15);

  const pieData = barData.slice(0, 5).map((d: any, idx) => ({
    name: d.name,
    value: d.value,
    color: ['#881337', '#be123c', '#e11d48', '#fb7185', '#fda4af'][idx % 5]
  }));

  return (
    <ERPReportLayout
      title="Party Sale Summary"
      description="Consolidated sales performance by customer, showing gross, returns, and net sales."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Summary", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "PartySaleSummary.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">Fetching live customer sales summary...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 mx-4">
            <Users size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No customer sales data found for the selected criteria</p>
          </div>
        ) : (
          <>
            <div className="px-4">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Party Sale Summary</h3>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{data.length} customers</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border-b border-slate-200 dark:border-slate-800 min-w-max">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer Code</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer Name</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Invoices</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Gross Sales</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Returns</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Discount</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">GST</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right flex items-center justify-end gap-1">Net Sales <TrendingUp size={10} className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500"/></th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((row: any, i: number) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-maroon-800 cursor-pointer hover:underline">{row.customerCode}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-blue-600 cursor-pointer hover:underline">{row.customerName}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center">{row.invoices}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.gross.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-rose-600 text-right">{row.returns.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.discount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.gst.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-blue-600 text-right">{row.net.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-rose-800 text-right bg-rose-50/30">{row.percent}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                      <td colSpan={3} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">TOTAL ({data.length} customers)</td>
                      <td className="px-4 py-3 text-[11px] text-center">{totalInvoices}</td>
                      <td className="px-4 py-3 text-[11px] text-right">{totalGross.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-rose-600">{totalReturns.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right">{data.reduce((s, r) => s + r.discount, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right">{data.reduce((s, r) => s + r.gst, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-blue-600">{totalNet.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Top 15 Customers by Net Sales</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{fontSize: 10}} />
                      <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={80} />
                      <RechartsTooltip />
                      <Bar dataKey="value" name="Net Sales" fill="#881337" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Sale Distribution by Customer</h3>
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
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
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
