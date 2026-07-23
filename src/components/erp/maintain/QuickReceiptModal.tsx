"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Wallet, Calendar, FileText } from "lucide-react";

interface QuickReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSuccess: () => void;
}

export default function QuickReceiptModal({ isOpen, onClose, customer, onSuccess }: QuickReceiptModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    type: "cash", // cash or bank
    bankAccountId: "",
    narration: "",
  });

  const [banks, setBanks] = useState<any[]>([]);

  useEffect(() => {
    if (formData.type === "bank") {
      fetch("/api/banks").then(res => res.json()).then(json => {
        if (json.ok) setBanks(json.data || []);
      });
    }
  }, [formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return alert("Please enter a valid amount");

    const endpoint = formData.type === "cash" ? "/api/cash-receipts" : "/api/bank-receipts";
    const payload = {
      customerId: customer._id,
      partyId: customer._id,
      party: customer._id,
      totalAmount: formData.amount,
      amount: formData.amount,
      date: formData.date,
      narration: formData.narration || `Payment received from ${customer.companyName || customer.name}`,
      bankAccountId: formData.bankAccountId,
      status: "Posted"
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        alert("Receipt posted successfully!");
        onSuccess();
        onClose();
      } else {
        alert("Error: " + (json.message || "Something went wrong"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to post receipt");
    }
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Payment - ${customer?.companyName}`}
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
          <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20">
            <Save size={18} /> Post Receipt
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} className="text-emerald-600" /> Date
          </label>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white outline-none" required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Wallet size={14} className="text-emerald-600" /> Amount (PKR)
          </label>
          <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-black dark:text-white outline-none" placeholder="0.00" required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Payment Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={formData.type === "cash"} onChange={() => setFormData({...formData, type: "cash"})} />
              <span className="text-sm font-bold">Cash</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={formData.type === "bank"} onChange={() => setFormData({...formData, type: "bank"})} />
              <span className="text-sm font-bold">Bank</span>
            </label>
          </div>
        </div>

        {formData.type === "bank" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Bank Account</label>
            <select value={formData.bankAccountId} onChange={e => setFormData({...formData, bankAccountId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white outline-none" required>
              <option value="">Select Bank Account</option>
              {(banks || []).map(b => <option key={b._id} value={b._id}>{b.name} - {b.accountNo}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} className="text-emerald-600" /> Narration
          </label>
          <input type="text" value={formData.narration} onChange={e => setFormData({...formData, narration: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white outline-none" placeholder="Payment received..." />
        </div>
      </form>
    </ERPModal>
  );
}
