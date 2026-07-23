"use client";

import { 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight 
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { offlineDB } from "@/lib/dexie";
import { calculateCustomerBalance, calculateBalanceFromTransactions } from "@/lib/customerBalance";
import { calculateVendorBalance, calculateVendorBalanceFromTransactions } from "@/lib/vendorBalance";

interface StatsCardsProps {
  selectedDate?: string;
}

export default function StatsCards({ selectedDate }: StatsCardsProps) {
  const [data, setData] = useState({
    cashBank: { opening: 0, receipts: 0, payments: 0, current: 0 },
    receivables: { opening: 0, sales: 0, receipts: 0, current: 0 },
    payables: { opening: 0, purchases: 0, payments: 0, current: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Accounts & Banks initial opening balances
        const cashBankAccs = await offlineDB.accounts
          .filter(acc => acc && (acc.type === "cash" || acc.type === "bank" || ["1111", "1110", "1000", "1010"].includes(acc.code)))
          .toArray();
        const banksList = await offlineDB.banks.toArray();

        const accountsOpening = cashBankAccs.reduce((sum, acc) => sum + (Number(acc.openingBalance) || 0), 0);
        const banksOpening = banksList.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
        const baseInitialOpening = accountsOpening + banksOpening;

        // Known cash/bank codes
        const knownCashBankCodes = ["1111", "1110", "1000", "1010"];
        const accountCodes = cashBankAccs.map(a => a.code);
        const cashBankCodes = Array.from(new Set([...knownCashBankCodes, ...accountCodes]));

        const allJournalEntries = await offlineDB.journalEntries.toArray();

        // Include all cash/bank transactions (Walk-in sales, cash invoices, receipts, payments)
        // Exclude customer advance opening entries
        const validJournalEntries = allJournalEntries.filter(entry => 
          cashBankCodes.includes(entry.accountCode) && 
          !entry.voucherNo?.startsWith("OPBAL-")
        );

        const cashBankTxBefore = validJournalEntries.filter(entry => 
          entry.date && new Date(entry.date) < startOfDay
        );
        const cashBankOpening = baseInitialOpening + cashBankTxBefore.reduce((sum, entry) => 
          sum + (Number(entry.debit) || 0) - (Number(entry.credit) || 0), 0);

        const cashBankTxToday = validJournalEntries.filter(entry => 
          entry.date && new Date(entry.date) >= startOfDay && new Date(entry.date) <= endOfDay
        );

        const cashBankReceipts = cashBankTxToday.reduce((sum, entry) => 
          sum + (Number(entry.debit) || 0), 0);
        const cashBankPayments = cashBankTxToday.reduce((sum, entry) => 
          sum + (Number(entry.credit) || 0), 0);

        const cashBankCurrent = cashBankOpening + cashBankReceipts - cashBankPayments;

        // Receivables calculation using unified balance helper
        const customers = await offlineDB.parties
          .filter(p => p.type === "Customer")
          .toArray();
        
        // Fetch all transactions for unified calculation
        const [allSales, allCashReceipts, allBankReceipts, allCashPayments, allBankPayments] = await Promise.all([
          offlineDB.invoices.where("type").anyOf(["sale", "non_tax_sale", "pos", "challan"]).toArray(),
          offlineDB.cashReceipts.toArray(),
          offlineDB.bankReceipts.toArray(),
          offlineDB.cashPayments.toArray(),
          offlineDB.bankPayments.toArray()
        ]);

        // Filter transactions for receivables
        const salesBefore = allSales.filter(s => s.date && new Date(s.date) < startOfDay);
        const cashRecBefore = allCashReceipts.filter(r => r.date && new Date(r.date) < startOfDay);
        const bankRecBefore = allBankReceipts.filter(r => r.date && new Date(r.date) < startOfDay);
        const cashPayBefore = allCashPayments.filter(p => p.date && new Date(p.date) < startOfDay);
        const bankPayBefore = allBankPayments.filter(p => p.date && new Date(p.date) < startOfDay);

        const salesToday = allSales.filter(s => s.date && new Date(s.date) >= startOfDay && new Date(s.date) <= endOfDay);
        const cashRecToday = allCashReceipts.filter(r => r.date && new Date(r.date) >= startOfDay && new Date(r.date) <= endOfDay);
        const bankRecToday = allBankReceipts.filter(r => r.date && new Date(r.date) >= startOfDay && new Date(r.date) <= endOfDay);
        const cashPayToday = allCashPayments.filter(p => p.date && new Date(p.date) >= startOfDay && new Date(p.date) <= endOfDay);
        const bankPayToday = allBankPayments.filter(p => p.date && new Date(p.date) >= startOfDay && new Date(p.date) <= endOfDay);

        // Calculate receivables opening and current dynamically
        let openingReceivables = 0;
        let totalReceivables = 0;
        for (const customer of customers) {
          const balanceBefore = calculateBalanceFromTransactions(customer, salesBefore, cashRecBefore, bankRecBefore, cashPayBefore, bankPayBefore);
          openingReceivables += balanceBefore.receivable;

          const balanceCurrent = calculateBalanceFromTransactions(customer, allSales, allCashReceipts, allBankReceipts, allCashPayments, allBankPayments);
          totalReceivables += balanceCurrent.receivable;
        }

        const salesTodayTotal = salesToday.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
        const receiptsTodayTotal = cashRecToday.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) +
                                   bankRecToday.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) +
                                   cashPayToday.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                                   bankPayToday.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Payables calculation using unified balance helper
        const vendors = await offlineDB.parties
          .filter(p => p.type === "Vendor")
          .toArray();
        
        // Fetch all transactions for unified calculation
        const [allPurchases, allCashReceiptsV, allBankReceiptsV] = await Promise.all([
          offlineDB.invoices.where("type").anyOf(["purchase", "non_tax_purchase", "import_purchase"]).toArray(),
          offlineDB.cashReceipts.toArray(),
          offlineDB.bankReceipts.toArray()
        ]);

        // Filter transactions for payables
        const purchasesBefore = allPurchases.filter(p => p.date && new Date(p.date) < startOfDay);
        const cashPayBeforeV = allCashPayments.filter(p => p.date && new Date(p.date) < startOfDay);
        const bankPayBeforeV = allBankPayments.filter(p => p.date && new Date(p.date) < startOfDay);
        const cashRecBeforeV = allCashReceiptsV.filter(r => r.date && new Date(r.date) < startOfDay);
        const bankRecBeforeV = allBankReceiptsV.filter(r => r.date && new Date(r.date) < startOfDay);

        const purchasesToday = allPurchases.filter(p => p.date && new Date(p.date) >= startOfDay && new Date(p.date) <= endOfDay);
        const cashPayTodayV = allCashPayments.filter(p => p.date && new Date(p.date) >= startOfDay && new Date(p.date) <= endOfDay);
        const bankPayTodayV = allBankPayments.filter(p => p.date && new Date(p.date) >= startOfDay && new Date(p.date) <= endOfDay);
        const cashRecTodayV = allCashReceiptsV.filter(r => r.date && new Date(r.date) >= startOfDay && new Date(r.date) <= endOfDay);
        const bankRecTodayV = allBankReceiptsV.filter(r => r.date && new Date(r.date) >= startOfDay && new Date(r.date) <= endOfDay);

        // Calculate payables opening and current dynamically
        let openingPayables = 0;
        let totalPayables = 0;
        for (const vendor of vendors) {
          const balanceBefore = calculateVendorBalanceFromTransactions(vendor, purchasesBefore, [], cashPayBeforeV, bankPayBeforeV, cashRecBeforeV, bankRecBeforeV);
          openingPayables += balanceBefore.payable;

          const balanceCurrent = calculateVendorBalanceFromTransactions(vendor, allPurchases, [], allCashPayments, allBankPayments, allCashReceiptsV, allBankReceiptsV);
          totalPayables += balanceCurrent.payable;
        }

        const purchasesTodayTotal = purchasesToday.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
        const paymentsTodayTotal = cashPayTodayV.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                                   bankPayTodayV.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                                   cashRecTodayV.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) +
                                   bankRecTodayV.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

        setData({
          cashBank: { opening: Math.max(0, cashBankOpening), receipts: cashBankReceipts, payments: cashBankPayments, current: Math.max(0, cashBankCurrent) },
          receivables: { opening: openingReceivables, sales: salesTodayTotal, receipts: receiptsTodayTotal, current: totalReceivables },
          payables: { opening: openingPayables, purchases: purchasesTodayTotal, payments: paymentsTodayTotal, current: totalPayables }
        });
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const fmt = (n: number) => Math.round(n).toLocaleString();

  const stats = [
    {
      title: "CASH & BANK",
      value: `Rs.${fmt(data.cashBank.current)}`,
      icon: DollarSign,
      color: data.cashBank.current >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      bg: data.cashBank.current >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-rose-50 dark:bg-rose-950/20",
      borderColor: data.cashBank.current >= 0 ? "border-emerald-600" : "border-rose-600",
      href: "/dashboard/cash-banks",
      opening: data.cashBank.opening,
      middleLabel: "Receipts",
      middleValue: data.cashBank.receipts,
      bottomLabel: "Payments",
      bottomValue: data.cashBank.payments
    },
    {
      title: "RECEIVABLES / CUSTOMERS",
      value: `Rs.${fmt(data.receivables.current)}`,
      icon: ArrowDownLeft,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-500",
      href: "/dashboard/receivables",
      opening: data.receivables.opening,
      middleLabel: "Sales (Debits)",
      middleValue: data.receivables.sales,
      bottomLabel: "Receipts (Credits)",
      bottomValue: data.receivables.receipts
    },
    {
      title: "PAYABLES / VENDORS",
      value: `Rs.${fmt(data.payables.current)}`,
      icon: ArrowUpRight,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-500",
      href: "/dashboard/payables",
      opening: data.payables.opening,
      middleLabel: "Purchases (Credits)",
      middleValue: data.payables.purchases,
      bottomLabel: "Payments (Debits)",
      bottomValue: data.payables.payments
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <Link 
          href={stat.href}
          key={stat.title}
          className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border-b-4 ${stat.borderColor} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 block cursor-pointer`}
        >
          <div className="flex items-center justify-between mb-5">
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.title}</span>
          </div>
          
          <div className="space-y-2 text-xs font-bold mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex justify-between text-slate-500">
              <span>Opening Balance:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">PKR {fmt(stat.opening)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{stat.middleLabel}:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">PKR {fmt(stat.middleValue)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{stat.bottomLabel}:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">PKR ({fmt(stat.bottomValue)})</span>
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Balance</p>
            <h3 className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
          </div>
          
          {/* Decorative background icon */}
          <stat.icon size={80} className={`absolute -right-4 -bottom-4 opacity-5 ${stat.color} pointer-events-none`} />
        </Link>
      ))}
    </div>
  );
}
