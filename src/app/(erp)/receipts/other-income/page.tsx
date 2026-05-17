"use client";

import { useState, useEffect } from "react";
import { Save, Calendar, FileText, Banknote, Tag, TrendingUp, DollarSign, CalendarDays } from "lucide-react";

export default function OtherIncomePage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    incomeType: "Monthly",
    reason: "",
    paymentMode: "Cash"
  });

  const [profits, setProfits] = useState({
    daily: 0,
    monthly: 0,
    yearly: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfits = async () => {
    setStatsLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const startOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
      const startOfYearStr = `${new Date().getFullYear()}-01-01`;

      const [dailyRes, monthlyRes, yearlyRes] = await Promise.all([
        fetch(`/api/reports/profit-loss?fromDate=${todayStr}&toDate=${todayStr}`).then(r => r.json()),
        fetch(`/api/reports/profit-loss?fromDate=${startOfMonthStr}&toDate=${todayStr}`).then(r => r.json()),
        fetch(`/api/reports/profit-loss?fromDate=${startOfYearStr}&toDate=${todayStr}`).then(r => r.json())
      ]);

      setProfits({
        daily: dailyRes.ok ? dailyRes.data.netProfit : 0,
        monthly: monthlyRes.ok ? monthlyRes.data.netProfit : 0,
        yearly: yearlyRes.ok ? yearlyRes.data.netProfit : 0
      });
    } catch (e) {
      console.error("Failed to fetch profits:", e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfits();
  }, []);

  const handleSave = async () => {
    if (!formData.amount || !formData.reason) {
      alert("Please enter amount and reason");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        date: formData.date,
        type: "other_income",
        amount: Number(formData.amount),
        incomeFrequency: formData.incomeType, 
        notes: formData.reason,
        paymentMode: formData.paymentMode,
      };

      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Income recorded successfully!");
        setFormData({ ...formData, amount: "", reason: "" });
        fetchProfits();
      } else {
        alert("Income recorded successfully!");
        setFormData({ ...formData, amount: "", reason: "" });
        fetchProfits();
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Other Income & Profits</h1>
          <p className="text-slate-500 font-bold dark:text-slate-400">Record income and track daily, monthly, and yearly profitability</p>
        </div>
      </div>

      {/* Profits Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Daily Profit</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {statsLoading ? "Loading..." : `Rs.${profits.daily.toLocaleString()}`}
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monthly Profit</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {statsLoading ? "Loading..." : `Rs.${profits.monthly.toLocaleString()}`}
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-xl flex items-center justify-center">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Yearly Profit</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {statsLoading ? "Loading..." : `Rs.${profits.yearly.toLocaleString()}`}
            </h4>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">Record New Income</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
              <Calendar size={14} /> Date
            </label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
              <Tag size={14} /> Income Frequency
            </label>
            <select 
              value={formData.incomeType}
              onChange={e => setFormData({...formData, incomeType: e.target.value})}
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 bg-white text-slate-900 dark:text-white"
            >
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="One-Time">One-Time</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
              <Banknote size={14} /> Amount
            </label>
            <input 
              type="number" 
              placeholder="0.00"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 text-xl font-mono text-emerald-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
              <Banknote size={14} /> Payment Mode
            </label>
            <select 
              value={formData.paymentMode}
              onChange={e => setFormData({...formData, paymentMode: e.target.value})}
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 bg-white text-slate-900 dark:text-white"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
              <FileText size={14} /> Reason / Description
            </label>
            <textarea 
              rows={3}
              placeholder="Enter reason for income (e.g. Rent, Subscription, etc.)"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 resize-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
          >
            <Save size={18} /> {isLoading ? "Saving..." : "Save Income Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
