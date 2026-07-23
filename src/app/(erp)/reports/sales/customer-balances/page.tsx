"use client";

import ERPReportLayout from "@/components/erp/reports/ERPReportLayout";
import { Download, Printer, Play, Users, DollarSign, ArrowUpRight, ArrowDownRight, Search, FileSpreadsheet } from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import CustomerProfileHistory from "@/components/erp/maintain/CustomerProfileHistory";
import { calculateBalanceFromTransactions } from "@/lib/customerBalance";

function formatBalance(val: number) {
  if (val > 0) return { text: `Rs. ${val.toLocaleString()}`, label: "(Debit)", color: "text-rose-600" };
  if (val < 0) return { text: `Rs. ${Math.abs(val).toLocaleString()}`, label: "(Credit)", color: "text-emerald-600" };
  return { text: "Rs. 0", label: "", color: "text-slate-500" };
}

export default function CustomerBalancesReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [shopProfile, setShopProfile] = useState<any>(null);

  const [rawParties, setRawParties] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [cashReceipts, setCashReceipts] = useState<any[]>([]);
  const [bankReceipts, setBankReceipts] = useState<any[]>([]);
  const [cashPayments, setCashPayments] = useState<any[]>([]);
  const [bankPayments, setBankPayments] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    async function fetchShop() {
      try {
        const res = await fetch("/api/shop-profile");
        const json = await res.json();
        if (json.ok) setShopProfile(json.data || []);
      } catch (err) {
        console.error("Error fetching shop profile:", err);
      }
    }
    fetchShop();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [partiesRes, salesRes, cashReceiptsRes, bankReceiptsRes, cashPayRes, bankPayRes] = await Promise.all([
          fetch('/api/parties?type=customer'),
          fetch('/api/sales'),
          fetch('/api/cash-receipts'),
          fetch('/api/bank-receipts'),
          fetch('/api/cash-payments'),
          fetch('/api/bank-payments')
        ]);

        const [partiesJson, salesJson, cashReceiptsJson, bankReceiptsJson, cashPayJson, bankPayJson] = await Promise.all([
          partiesRes.json(),
          salesRes.json(),
          cashReceiptsRes.json(),
          bankReceiptsRes.json(),
          cashPayRes.json(),
          bankPayRes.json()
        ]);

        const partiesList = partiesJson.ok ? partiesJson.data : (Array.isArray(partiesJson) ? partiesJson : []);
        const salesList = salesJson.ok ? salesJson.data : (Array.isArray(salesJson) ? salesJson : []);
        const cashReceiptsList = cashReceiptsJson.ok ? cashReceiptsJson.data : (Array.isArray(cashReceiptsJson) ? cashReceiptsJson : []);
        const bankReceiptsList = bankReceiptsJson.ok ? bankReceiptsJson.data : (Array.isArray(bankReceiptsJson) ? bankReceiptsJson : []);
        const cashPaymentsList = cashPayJson.ok ? cashPayJson.data : (Array.isArray(cashPayJson) ? cashPayJson : []);
        const bankPaymentsList = bankPayJson.ok ? bankPayJson.data : (Array.isArray(bankPayJson) ? bankPayJson : []);

        setRawParties(partiesList);
        setSales(salesList);
        setCashReceipts(cashReceiptsList);
        setBankReceipts(bankReceiptsList);
        setCashPayments(cashPaymentsList);
        setBankPayments(bankPaymentsList);
      } catch (error) {
        console.error("Error fetching customer balances:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (rawParties.length === 0) return;

    // Calculate balances for each customer using unified function
    const result = (rawParties || []).map((customer: any) => {
      const balance = calculateBalanceFromTransactions(customer, sales, cashReceipts, bankReceipts, cashPayments, bankPayments);
      
      return {
        id: customer._id,
        customer: customer.name || customer.companyName || "Unknown",
        region: customer.region || "-",
        area: customer.area || "-",
        city: customer.city || "-",
        opening: customer.openingBalance || 0,
        receivable: balance.receivable,
        advance: balance.advance,
        closing: balance.netBalance,
        rawParty: customer
      };
    });

    setData(result);
  }, [rawParties, sales, cashReceipts, bankReceipts]);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = data;

    if (selectedCategory !== "All") {
      result = result.filter(r => {
        const cat = (r.rawParty?.category || "").toLowerCase().trim();
        const sel = selectedCategory.toLowerCase().trim();
        if (sel === "credit customer") {
          return cat.includes("credit");
        }
        if (sel === "cash customer") {
          return cat === "cash customer";
        }
        return cat === sel;
      });
    }

    if (q) {
      result = result.filter((r) =>
        String(r.customer || "").toLowerCase().includes(q) ||
        String(r.region || "").toLowerCase().includes(q) ||
        String(r.area || "").toLowerCase().includes(q)
      );
    }
    setFilteredData(result);
  }, [searchQuery, selectedCategory, data]);

  const totalReceivable = (filteredData || []).reduce((s, r) => s + r.receivable, 0);
  const totalAdvance = (filteredData || []).reduce((s, r) => s + r.advance, 0);
  const totalClosing = (filteredData || []).reduce((s, r) => s + r.closing, 0);

  const closingFmt = formatBalance(totalClosing);

  const stats = [
    { title: "Customers with Balance", value: (filteredData || []).length.toString(), icon: Users, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Total Receivable", value: `Rs. ${totalReceivable.toLocaleString()}`, icon: DollarSign, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
    { title: "Total Advance", value: `Rs. ${totalAdvance.toLocaleString()}`, icon: DollarSign, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "Net Balance", value: closingFmt.text, icon: DollarSign, iconColor: "text-blue-600", iconBg: "bg-blue-50", valueColor: closingFmt.color },
  ];

  const Filters = (
    <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full">
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Year</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>Financial Year 2025-26...</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Customers</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Region</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Regions</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Area</label>
          <select className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20">
            <option>All Areas</option>
          </select>
        </div>
        <div className="space-y-1 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Min Balance</label>
          <input type="number" placeholder="0" className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20" />
        </div>
        <div className="space-y-1 lg:col-span-3 xl:col-span-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">&nbsp;</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={12} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search customer name..." className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/10 font-medium transition-all" />
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 shrink-0">
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Download size={14} /> CSV
        </button>
        <button className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center gap-1.5">
          <Printer size={14} /> Print
        </button>
        <button className="px-3 py-2 bg-maroon-800 text-white rounded-lg text-[10px] font-bold hover:bg-maroon-900 flex items-center justify-center gap-1.5 shadow-sm shadow-maroon-900/20">
          <Play size={14} /> Generate
        </button>
      </div>
    </div>
  );

  const barData = (filteredData || []).slice(0, 10).map(r => ({ name: r.customer, balance: r.closing }));

  if (selectedCustomer) {
    return (
      <div className="p-6">
        <CustomerProfileHistory 
          customer={selectedCustomer}
          onBack={() => setSelectedCustomer(null)}
          shopProfile={shopProfile}
        />
      </div>
    );
  }

  return (
    <ERPReportLayout
      title="Customer Balances"
      description="Real-time balances of all customer accounts from Party ledger."
      stats={stats}
      filters={Filters}
      actions={[
        { label: "Print Balances", onClick: printPage, icon: Printer },
        { label: "Export Excel", onClick: () => exportToExcel(filteredData, "CustomerBalances.xlsx"), icon: FileSpreadsheet },
      ]}
    >
      <div className="space-y-6">
        {/* Category Filter Buttons */}
        <div className="no-print bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center mx-4">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Categories:</span>
          {[
            "All",
            "Cash Customer",
            "Credit Customer",
            "Cash Customer (Jama)",
            "Credit Customer (Counter)",
            "Credit Customer Max",
            "Credit Customer (Haji Gul)",
            "Credit Customer (Makkah)",
            "Credit Customer (Radbook)"
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-maroon-800 text-white shadow-sm shadow-maroon-800/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">Fetching live customer balances...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 mx-4">
            <Users size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No customer balances found for the selected criteria</p>
          </div>
        ) : (
          <>
            <div className="px-4">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8">#</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-600">CUSTOMER ↑</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">REGION</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">AREA</th>
                      <th className="px-4 py-3 text-[9px] font-black text-rose-600 uppercase tracking-widest text-right">RECEIVABLE</th>
                      <th className="px-4 py-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest text-right">ADVANCE</th>
                      <th className="px-4 py-3 text-[9px] font-black text-blue-600 uppercase tracking-widest text-right">NET BALANCE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(filteredData || []).map((row: any, i: number) => {
                      const bal = formatBalance(row.closing);
                      return (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">{i + 1}</td>
                          <td 
                            onClick={() => setSelectedCustomer(row.rawParty)}
                            className="px-4 py-3 text-[11px] font-bold text-blue-600 cursor-pointer hover:underline uppercase"
                          >
                            {row.customer}
                          </td>
                          <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.region}</td>
                          <td className="px-4 py-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">{row.area}</td>
                          <td className="px-4 py-3 text-[11px] font-medium text-rose-600 text-right">
                            {row.receivable > 0 ? `Rs. ${row.receivable.toLocaleString()}` : "Rs. 0"}
                          </td>
                          <td className="px-4 py-3 text-[11px] font-medium text-emerald-600 text-right">
                            {row.advance > 0 ? `Rs. ${row.advance.toLocaleString()}` : "Rs. 0"}
                          </td>
                          <td className={`px-4 py-3 text-[11px] font-black text-right ${bal.color}`}>
                            {Math.abs(row.closing).toLocaleString()}
                            {bal.label && <span className="ml-1 text-[9px] font-bold opacity-70">{bal.label}</span>}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                      <td colSpan={4} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-100">Grand Total</td>
                      <td className="px-4 py-3 text-[11px] text-right text-rose-600">Rs. {totalReceivable.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-emerald-600">Rs. {totalAdvance.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-[11px] text-right ${closingFmt.color}`}>
                        {Math.abs(totalClosing).toLocaleString()}
                        {closingFmt.label && <span className="ml-1 text-[9px] font-bold opacity-70">{closingFmt.label}</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-6">Top Customer Balances</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <RechartsTooltip formatter={(value) => `Rs.${value}`} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                      <Bar dataKey="balance" name="Closing Balance" fill="#3b82f6" barSize={40} />
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
