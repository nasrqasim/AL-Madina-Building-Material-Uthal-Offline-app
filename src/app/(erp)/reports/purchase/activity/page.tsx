"use client";

import React, { useState, useEffect } from "react";
import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, RotateCcw, ShoppingCart, Package, FileText, RotateCcw as RotateLeft, ArrowRight, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend, ComposedChart } from 'recharts';

export default function PurchaseActivityReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/purchases');
        const json = await res.json();
        if (json.ok && json.data) {
          const grouped = json.data.reduce((acc: any, p: any) => {
            const month = new Date(p.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!acc[month]) acc[month] = { period: month, pos: 0, poAmt: 0, grns: 0, grnAmt: 0, invoices: 0, invAmt: 0, returns: 0, retAmt: 0, net: 0, count: 0 };
            
            acc[month].count += 1;
            if (p.type === 'purchase_order') { acc[month].pos += 1; acc[month].poAmt += p.totalAmount || 0; }
            else if (p.type === 'grn') { acc[month].grns += 1; acc[month].grnAmt += p.totalAmount || 0; }
            else if (p.type === 'purchase_return') { acc[month].returns += 1; acc[month].retAmt += p.totalAmount || 0; }
            else { acc[month].invoices += 1; acc[month].invAmt += p.totalAmount || 0; }
            
            acc[month].net += (p.type === 'purchase_return' ? -(p.totalAmount || 0) : (p.totalAmount || 0));
            return acc;
          }, {});

          setData(Object.values(grouped).map((g: any) => ({
            ...g,
            avgValue: g.count > 0 ? (g.invAmt / g.count).toFixed(0) : 0,
            growth: "-"
          })));
        }
      } catch (error) {
        console.error("Error fetching purchase activity:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalPos = data.reduce((s, r) => s + r.pos, 0);
  const totalPoAmt = data.reduce((s, r) => s + r.poAmt, 0);
  const totalGrns = data.reduce((s, r) => s + r.grns, 0);
  const totalGrnAmt = data.reduce((s, r) => s + r.grnAmt, 0);
  const totalInvs = data.reduce((s, r) => s + r.invoices, 0);
  const totalInvAmt = data.reduce((s, r) => s + r.invAmt, 0);
  const totalRet = data.reduce((s, r) => s + r.returns, 0);
  const totalRetAmt = data.reduce((s, r) => s + r.retAmt, 0);

  const stats = [
    { title: "TOTAL POS", value: totalPos.toString(), subtitle: `Rs. ${totalPoAmt.toLocaleString()}`, icon: ShoppingCart, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
    { title: "TOTAL GRNS", value: totalGrns.toString(), subtitle: `Rs. ${totalGrnAmt.toLocaleString()}`, icon: Package, iconColor: "text-indigo-600", iconBg: "bg-indigo-50" },
    { title: "TOTAL INVOICES", value: totalInvs.toString(), subtitle: `Rs. ${totalInvAmt.toLocaleString()}`, icon: FileText, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "TOTAL RETURNS", value: totalRet.toString(), subtitle: `Rs. ${totalRetAmt.toLocaleString()}`, icon: RotateLeft, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
  ];

  const Filters = (
    <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
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
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Vendors</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tax Filter</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Both (Tax + Non-Tax)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Group By</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Monthly</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center">
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


  const lineData = data.map(d => ({ name: d.period, invoiceAmt: d.invAmt, netAmt: d.net }));

  const stackedData = data.map(d => ({ name: d.period, grns: d.grns, invoices: d.invoices, pos: d.pos, returns: d.returns }));

  const avgData = data.map(d => ({ name: d.period, avgValue: parseFloat(d.avgValue), netAmount: d.net }));

  const FlowNode = ({ icon: Icon, title, count, amount, colorClass, borderClass }: any) => (
    <div className={`flex flex-col items-center justify-center p-4 w-32 border rounded-xl bg-white dark:bg-slate-900 shadow-sm ${borderClass}`}>
      <div className={`p-2 rounded-lg mb-2 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">{title}</span>
      <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">{count}</span>
      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">Rs.{amount}</span>
    </div>
  );

  return (
    <ERPReportLayout
      title="Purchase Activity"
      description="Holistic view of the purchase cycle: POs to GRNs to Invoices and Returns."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Report", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(data, "PurchaseActivity.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Purchase Activity by Period</h3>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{data.length} periods</span>
          </div>
          <table className="w-full text-left border-collapse border-b border-slate-200 dark:border-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Period</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">POs</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">GRNs</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Invoices</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Returns</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Net Amount</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Avg Value</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Growth %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                  <td className="px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-200">{row.period}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-rose-600 text-center bg-rose-50/30">{row.pos}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-rose-600 text-center bg-rose-50/30">{row.grns}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-amber-600 text-center bg-amber-50/30">{row.invoices}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-rose-600 text-center bg-rose-50/30">{row.returns}</td>
                  <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-100 text-right">{row.net.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.avgValue}</td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{row.growth}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                <td className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">TOTAL ({data.length} periods)</td>
                <td className="px-4 py-3 text-[11px] text-center">{totalPos}</td>
                <td className="px-4 py-3 text-[11px] text-center">{totalGrns}</td>
                <td className="px-4 py-3 text-[11px] text-center">{totalInvs}</td>
                <td className="px-4 py-3 text-[11px] text-center">{totalRet}</td>
                <td className="px-4 py-3 text-[11px] text-right">{data.reduce((s, r) => s + r.net, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-[11px] text-right">{(data.reduce((s, r) => s + parseFloat(r.avgValue), 0) / (data.length || 1)).toFixed(0)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">PO to GRN to Invoice Flow</h3>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 rounded text-[9px] uppercase tracking-wider font-bold">Conversion tracking</span>
          </div>
          <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 flex flex-wrap items-center justify-center gap-4 overflow-x-auto">
          <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 flex flex-wrap items-center justify-center gap-4 overflow-x-auto">
            <FlowNode icon={ShoppingCart} title="PURCHASE ORDERS" count={totalPos.toString()} amount={totalPoAmt.toLocaleString()} colorClass="bg-rose-100 text-rose-600" borderClass="border-rose-100" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-rose-600 mb-1">{totalPos > 0 ? ((totalGrns / totalPos) * 100).toFixed(0) : 0}%</span>
              <ArrowRight className="text-slate-300" size={20} />
            </div>
            <FlowNode icon={Package} title="GOODS RECEIPTS" count={totalGrns.toString()} amount={totalGrnAmt.toLocaleString()} colorClass="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" borderClass="border-slate-200 dark:border-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-rose-600 mb-1">{totalGrns > 0 ? ((totalInvs / totalGrns) * 100).toFixed(0) : 0}%</span>
              <ArrowRight className="text-slate-300" size={20} />
            </div>
            <FlowNode icon={FileText} title="PURCHASE INVOICES" count={totalInvs.toString()} amount={totalInvAmt.toLocaleString()} colorClass="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" borderClass="border-slate-200 dark:border-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-rose-600 mb-1">{totalInvs > 0 ? ((totalRet / totalInvs) * 100).toFixed(0) : 0}%</span>
              <ArrowRight className="text-slate-300" size={20} />
            </div>
            <FlowNode icon={RotateLeft} title="RETURNS" count={totalRet.toString()} amount={totalRetAmt.toLocaleString()} colorClass="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" borderClass="border-slate-200 dark:border-slate-800" />
          </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:col-span-2">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Purchase Trend Over Time (Monthly)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
                  <Line type="monotone" dataKey="invoiceAmt" name="Invoice Amount" stroke="#d6a383" strokeWidth={2} dot={{ fill: '#d6a383', r: 4 }} />
                  <Line type="monotone" dataKey="netAmt" name="Net Amount" stroke="#881337" strokeWidth={2} dot={{ fill: '#881337', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Document Count by Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '10px' }}/>
                  <Bar dataKey="grns" stackId="a" name="GRNs" fill="#881337" barSize={40} />
                  <Bar dataKey="invoices" stackId="a" name="Invoices" fill="#d6a383" barSize={40} />
                  <Bar dataKey="pos" stackId="a" name="POs" fill="#9f1239" barSize={40} />
                  <Bar dataKey="returns" stackId="a" name="Returns" fill="#eab308" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Average Purchase Value</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={avgData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis yAxisId="left" tick={{fontSize: 10}} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} />
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '10px' }}/>
                  <Bar yAxisId="left" dataKey="avgValue" name="Avg Value" fill="#fecdd3" barSize={20} stroke="#881337" />
                  <Line yAxisId="right" type="monotone" dataKey="netAmount" name="Net Amount" stroke="#d6a383" strokeWidth={2} dot={{ fill: '#d6a383', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </ERPReportLayout>
  );
}
