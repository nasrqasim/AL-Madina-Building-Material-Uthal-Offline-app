"use client";

import { 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight 
} from "lucide-react";

import { useState, useEffect } from "react";

export default function StatsCards() {
  const [data, setData] = useState({
    cash: 0,
    receivable: 0,
    payable: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.ok) {
          setData({
            cash: json.data.cashBankBalance || 0,
            receivable: json.data.receivables || 0,
            payable: json.data.payables || 0
          });
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      }
    };
    fetchData();
  }, []);


  const stats = [
    {
      title: "CASH & BANK",
      value: `Rs.${data.cash.toLocaleString()}`,
      icon: DollarSign,
      color: data.cash >= 0 ? "text-emerald-500" : "text-rose-500",
      bg: data.cash >= 0 ? "bg-emerald-50" : "bg-rose-50",
      borderColor: data.cash >= 0 ? "border-emerald-500" : "border-rose-500",
    },
    {
      title: "RECEIVABLE",
      value: `Rs.${data.receivable.toLocaleString()}`,
      icon: ArrowDownLeft,
      color: "text-orange-500",
      bg: "bg-orange-50",
      borderColor: "border-orange-500",
    },
    {
      title: "PAYABLE",
      value: `Rs.${data.payable.toLocaleString()}`,
      icon: ArrowUpRight,
      color: "text-purple-500",
      bg: "bg-purple-50",
      borderColor: "border-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <div 
          key={stat.title}
          className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border-b-4 ${stat.borderColor} hover:shadow-md transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.bg} dark:bg-slate-800/50 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 dark:text-white">{stat.value}</h3>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{stat.title}</p>
          </div>
          
          {/* Decorative background icon */}
          <stat.icon size={80} className={`absolute -right-4 -bottom-4 opacity-5 ${stat.color}`} />
        </div>
      ))}
    </div>
  );
}
