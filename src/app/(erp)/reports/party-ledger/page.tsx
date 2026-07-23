"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Wallet, FileText, Download, Printer, Calendar, Search, ArrowLeft } from "lucide-react";
import { calculateVendorBalanceFromTransactions } from "@/lib/vendorBalance";

export default function PartyLedgerPage() {
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [partyType, setPartyType] = useState<"Customer" | "Vendor">("Vendor");
  const [parties, setParties] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFromDate(firstDay.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const res = await fetch(`/api/parties?type=${partyType.toLowerCase()}`);
      const json = await res.json();
      if (json.ok) {
        setParties(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLedger = async () => {
    if (!selectedPartyId) return;
    setIsLoading(true);
    try {
      // Fetch all transaction data for balance calculation
      const [purRes, cashPayRes, bankPayRes, cashRecRes, bankRecRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/cash-payments"),
        fetch("/api/bank-payments"),
        fetch("/api/cash-receipts"),
        fetch("/api/bank-receipts")
      ]);
      
      const purJson = await purRes.json();
      const cashPayJson = await cashPayRes.json();
      const bankPayJson = await bankPayRes.json();
      const cashRecJson = await cashRecRes.json();
      const bankRecJson = await bankRecRes.json();

      const purchases = purJson.ok ? purJson.data || [] : [];
      const cashPayments = cashPayJson.ok ? cashPayJson.data || [] : [];
      const bankPayments = bankPayJson.ok ? bankPayJson.data || [] : [];
      const cashReceipts = cashRecJson.ok ? cashRecJson.data || [] : [];
      const bankReceipts = bankRecJson.ok ? bankRecJson.data || [] : [];

      const selectedParty = parties.find((p: any) => p._id === selectedPartyId);
      
      if (partyType === "Vendor" && selectedParty) {
        const vendorBalance = calculateVendorBalanceFromTransactions(
          selectedParty, 
          purchases, 
          [], 
          cashPayments, 
          bankPayments, 
          cashReceipts, 
          bankReceipts
        );
        setBalance(vendorBalance);
      }

      // Filter transactions by date range and party
      const allTransactions = [
        ...purchases.filter((t: any) => t.partyId === selectedPartyId && t.date >= fromDate && t.date <= toDate),
        ...cashPayments.filter((t: any) => (t.partyId === selectedPartyId || t.vendor === selectedPartyId) && t.date >= fromDate && t.date <= toDate),
        ...bankPayments.filter((t: any) => (t.partyId === selectedPartyId || t.vendor === selectedPartyId) && t.date >= fromDate && t.date <= toDate),
      ].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setTransactions(allTransactions);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [partyType]);

  useEffect(() => {
    if (selectedPartyId) {
      fetchLedger();
    }
  }, [selectedPartyId, fromDate, toDate]);

  const selectedParty = parties.find((p: any) => p._id === selectedPartyId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <ERPPageHeader
        title={`${partyType} Ledger`}
        subtitle={`Detailed statement of accounts for ${partyType.toLowerCase()}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Party Type</label>
              <select
                value={partyType}
                onChange={(e) => {
                  setPartyType(e.target.value as "Customer" | "Vendor");
                  setSelectedPartyId("");
                }}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm"
              >
                <option value="Vendor">Vendor</option>
                <option value="Customer">Customer</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Select {partyType}</label>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">-- Select --</option>
                {parties.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.companyName || p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        {balance && partyType === "Vendor" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Payable (We Owe)</div>
              <div className="text-2xl font-black text-rose-600">PKR {balance.payable.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Advance (Vendor Owes Us)</div>
              <div className="text-2xl font-black text-emerald-600">PKR {balance.advance.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Net Balance</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">PKR {Math.abs(balance.netBalance).toLocaleString()}</div>
              <div className="text-sm font-medium text-slate-500 mt-1">{balance.status}</div>
            </div>
          </div>
        )}

        {/* Party Info */}
        {selectedParty && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">{partyType} Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Code</div>
                <div className="text-slate-600 dark:text-slate-400">{selectedParty.code || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Name</div>
                <div className="text-slate-600 dark:text-slate-400">{selectedParty.companyName || selectedParty.name}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Telephone</div>
                <div className="text-slate-600 dark:text-slate-400">{selectedParty.phone || "N/A"}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Address</div>
                <div className="text-slate-600 dark:text-slate-400">{selectedParty.address || "N/A"}</div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {selectedPartyId && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold">Transaction History</h3>
            </div>
            {isLoading ? (
              <div className="p-6 text-center text-slate-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Reference</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Debit</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Credit</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {transactions.map((t: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{t.date}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{t.type || "Payment"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{t.invoiceNo || t.voucherNo || t.reference || "-"}</td>
                        <td className="px-6 py-4 text-sm text-right text-slate-700 dark:text-slate-300">{t.amount ? `PKR ${t.amount.toLocaleString()}` : "-"}</td>
                        <td className="px-6 py-4 text-sm text-right text-slate-700 dark:text-slate-300">-</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 dark:text-white">-</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
