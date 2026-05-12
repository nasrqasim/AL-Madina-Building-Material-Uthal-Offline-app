"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import ERPModal from "../ui/ERPModal";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: any;
  onSave: (data: any) => void;
}

export default function AccountModal({ isOpen, onClose, account, onSave }: AccountModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    type: "cash",
    openingBalance: 0
  });

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code || "",
        title: account.title || "",
        type: account.type || "cash",
        openingBalance: account.openingBalance || 0
      });
    } else {
      setFormData({
        code: "",
        title: "",
        type: "cash",
        openingBalance: 0
      });
    }
  }, [account, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? "Edit Account" : "Create New Account"}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-black text-slate-500 hover:text-slate-700 transition-all">
            Discard
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-maroon-800 text-white rounded-2xl font-black text-sm shadow-xl shadow-maroon-900/20 hover:bg-maroon-900 transition-all flex items-center gap-2"
          >
            <Save size={18} />
            {account ? "Update Account" : "Create Account"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Code</label>
            <input 
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})}
              placeholder="e.g. 1104" 
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 outline-none transition-all" 
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 outline-none transition-all"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="expense">Expense</option>
              <option value="receivable">Receivable</option>
              <option value="payable">Payable</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
          <input 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="e.g. Petty Cash" 
            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 outline-none transition-all" 
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opening Balance</label>
          <input 
            type="number"
            value={formData.openingBalance}
            onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})}
            placeholder="0" 
            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 outline-none transition-all" 
          />
        </div>
      </form>
    </ERPModal>
  );
}
