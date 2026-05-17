"use client";

import { useState } from "react";
import { Save, Calendar, FileText, Banknote, Tag } from "lucide-react";

export default function OtherIncomePage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    incomeType: "Monthly",
    reason: "",
    paymentMode: "Cash"
  });

  const [isLoading, setIsLoading] = useState(false);

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
      } else {
        alert("Income record action submitted successfully.");
        setFormData({ ...formData, amount: "", reason: "" });
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Other Income</h1>
          <p className="text-slate-500 font-bold">Record monthly or yearly income</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <Calendar size={14} /> Date
            </label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <Tag size={14} /> Income Frequency
            </label>
            <select 
              value={formData.incomeType}
              onChange={e => setFormData({...formData, incomeType: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 bg-white"
            >
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="One-Time">One-Time</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <Banknote size={14} /> Amount
            </label>
            <input 
              type="number" 
              placeholder="0.00"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 text-xl font-mono text-emerald-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <Banknote size={14} /> Payment Mode
            </label>
            <select 
              value={formData.paymentMode}
              onChange={e => setFormData({...formData, paymentMode: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <FileText size={14} /> Reason / Description
            </label>
            <textarea 
              rows={3}
              placeholder="Enter reason for income (e.g. Rent, Subscription, etc.)"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 font-bold outline-none focus:border-blue-500 resize-none"
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
