"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Wallet, Calendar, FileText } from "lucide-react";

interface QuickPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: any;
  onSuccess: () => void;
}

export default function QuickPaymentModal({ isOpen, onClose, vendor, onSuccess }: QuickPaymentModalProps) {
  const [formData, setFormData] = useState({
    voucherNo: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    type: "cash", // cash or bank
    bankAccountId: "",
    cashAccountId: "",
    narration: "",
  });

  const [banks, setBanks] = useState<any[]>([]);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (formData.type === "bank") {
      fetch("/api/banks").then(res => res.json()).then(json => {
        if (json.ok) setBanks(json.data || []);
      });
    } else {
      fetch("/api/accounts").then(res => res.json()).then(json => {
        if (json.ok) setCashAccounts(json.data.filter((a: any) => a.type === "cash"));
      });
    }
  }, [formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return alert("Please enter a valid amount");

    const endpoint = formData.type === "cash" ? "/api/cash-payments" : "/api/bank-payments";
    const payload = {
      vendorId: vendor._id,
      totalAmount: formData.amount,
      date: formData.date,
      voucherNo: formData.voucherNo,
      narration: formData.narration || `Payment made to ${vendor.companyName}`,
      bankAccountId: formData.bankAccountId,
      cashAccountId: formData.cashAccountId
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        alert("Payment posted successfully!");
        onSuccess();
        onClose();
      } else {
        alert("Error: " + (json.message || "Something went wrong"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to post payment");
    }
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pay Vendor - ${vendor?.companyName}`}
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
          <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20">
            <Save size={18} /> Post Payment
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} className="text-maroon-800" /> Date
          </label>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Wallet size={14} className="text-maroon-800" /> Amount (PKR)
          </label>
          <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black outline-none" placeholder="0.00" required />
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

        {formData.type === "cash" ? (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Cash Account</label>
            <select value={formData.cashAccountId} onChange={e => setFormData({...formData, cashAccountId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" required>
              <option value="">Select Cash Account</option>
              {(cashAccounts || []).map(a => <option key={a._id} value={a._id}>{a.code} - {a.title || a.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Bank Account</label>
            <select value={formData.bankAccountId} onChange={e => setFormData({...formData, bankAccountId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" required>
              <option value="">Select Bank Account</option>
              {(banks || []).map(b => <option key={b._id} value={b._id}>{b.name} - {b.accountNo}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} className="text-maroon-800" /> Narration
          </label>
          <input type="text" value={formData.narration} onChange={e => setFormData({...formData, narration: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" placeholder="Payment made..." />
        </div>
      </form>
    </ERPModal>
  );
}
