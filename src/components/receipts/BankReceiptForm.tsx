"use client";

import { useState, useEffect } from "react";
import { Save, User, Calendar, Hash, DollarSign, FileText, Landmark, X } from "lucide-react";

interface BankReceiptFormProps {
  onClose: () => void;
}

export default function BankReceiptForm({ onClose }: BankReceiptFormProps) {
  const [formData, setFormData] = useState({
    customerId: "",
    bankAccountId: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    totalAmount: 0,
    narration: "",
  });

  const [banks, setBanks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/banks").then(res => res.json()).then(json => {
      if (json.ok) setBanks(json.data);
    });
    fetch("/api/parties?type=Customer").then(res => res.json()).then(json => {
      if (json.ok) setCustomers(json.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.bankAccountId || formData.totalAmount <= 0) {
      return alert("Please fill all required fields (*) and enter a valid amount.");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bank-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.ok) {
        alert("Bank Receipt saved and posted successfully!");
        onClose();
      } else {
        alert("Error: " + (json.message || "Something went wrong"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save receipt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">New Bank Receipt</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center">
              <User size={12} className="mr-1" /> Customer *
            </label>
            <select 
              value={formData.customerId}
              onChange={(e) => setFormData({...formData, customerId: e.target.value})}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-800 transition-all text-sm font-bold"
            >
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.companyName})</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center">
              <Landmark size={12} className="mr-1" /> Deposit To *
            </label>
            <select 
              value={formData.bankAccountId}
              onChange={(e) => setFormData({...formData, bankAccountId: e.target.value})}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-800 transition-all text-sm font-bold"
            >
              <option value="">Select Bank Account</option>
              {banks.map(b => <option key={b._id} value={b._id}>{b.name} - {b.accountNo} (Rs.{b.balance.toLocaleString()})</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center">
              <Calendar size={12} className="mr-1" /> Receipt Date *
            </label>
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-800 transition-all text-sm font-bold" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center">
              <Hash size={12} className="mr-1" /> Ref / Cheque #
            </label>
            <input 
              type="text" 
              placeholder="e.g. CHQ-55221" 
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-800 transition-all text-sm font-bold" 
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center">
              <DollarSign size={12} className="mr-1" /> Amount Received *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">PKR</span>
              <input 
                type="number" 
                placeholder="0.00" 
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                required
                className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-800 transition-all text-sm font-black text-slate-900 dark:text-white" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center">
            <FileText size={12} className="mr-1" /> Description / Narration *
          </label>
          <textarea 
            placeholder="Enter bank transaction details..." 
            value={formData.narration}
            onChange={(e) => setFormData({...formData, narration: e.target.value})}
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-800 transition-all text-sm min-h-[100px] font-bold"
          ></textarea>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Save size={18} className="mr-2" /> {isSubmitting ? "Saving..." : "Save Bank Receipt"}
          </button>
        </div>
      </form>
    </div>
  );
}
