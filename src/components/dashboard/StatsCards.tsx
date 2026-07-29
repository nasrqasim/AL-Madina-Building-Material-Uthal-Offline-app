"use client";

import { 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight 
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

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
        const query = selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : "";
        const res = await fetch(`/api/dashboard${query}`);
        const json = await res.json();
        if (json.ok && json.data) {
          setData({
            cashBank: json.data.cashBank || { opening: 0, receipts: 0, payments: 0, current: 0 },
            receivables: json.data.receivables || { opening: 0, sales: 0, receipts: 0, current: 0 },
            payables: json.data.payables || { opening: 0, purchases: 0, payments: 0, current: 0 }
          });
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  const cards = [
    {
      title: "TOTAL CASH & BANK",
      openingLabel: "Opening Cash/Bank",
      openingValue: data.cashBank.opening,
      inLabel: "Cash Received Today",
      inValue: data.cashBank.receipts,
      outLabel: "Cash Paid Today",
      outValue: data.cashBank.payments,
      currentLabel: "Current Cash/Bank Balance",
      currentValue: data.cashBank.current,
      color: "from-emerald-600 to-teal-700",
      accentBg: "bg-emerald-500/20",
      accentText: "text-emerald-300",
      link: "/vouchers/cash-bank-book",
      icon: DollarSign
    },
    {
      title: "CUSTOMER RECEIVABLES",
      openingLabel: "Opening Receivables",
      openingValue: data.receivables.opening,
      inLabel: "Sales Today (+)",
      inValue: data.receivables.sales,
      outLabel: "Received Today (-)",
      outValue: data.receivables.receipts,
      currentLabel: "Total Customer Receivables",
      currentValue: data.receivables.current,
      color: "from-blue-600 to-indigo-700",
      accentBg: "bg-blue-500/20",
      accentText: "text-blue-300",
      link: "/maintain/customer-balances",
      icon: ArrowDownLeft
    },
    {
      title: "VENDOR PAYABLES",
      openingLabel: "Opening Payables",
      openingValue: data.payables.opening,
      inLabel: "Purchases Today (+)",
      inValue: data.payables.purchases,
      outLabel: "Paid Today (-)",
      outValue: data.payables.payments,
      currentLabel: "Total Vendor Payables",
      currentValue: data.payables.current,
      color: "from-rose-600 to-pink-700",
      accentBg: "bg-rose-500/20",
      accentText: "text-rose-300",
      link: "/maintain/vendor-balances",
      icon: ArrowUpRight
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.color} p-6 text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/80">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-2xl ${card.accentBg} ${card.accentText} backdrop-blur-md`}>
                <Icon size={20} />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs text-white/90">
                <span>{card.openingLabel}:</span>
                <span className="font-bold">Rs. {card.openingValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-emerald-200">
                <span>{card.inLabel}:</span>
                <span className="font-bold">+ Rs. {card.inValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-rose-200">
                <span>{card.outLabel}:</span>
                <span className="font-bold">- Rs. {card.outValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-white/20 pt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider mb-1">
                  {card.currentLabel}
                </p>
                <p className="text-2xl font-black tracking-tight">
                  Rs. {card.currentValue.toLocaleString()}
                </p>
              </div>
              <Link 
                href={card.link}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors backdrop-blur-sm"
              >
                View Ledger &rarr;
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
