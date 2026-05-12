"use client";

import { useState } from "react";
import { Save, User, Calendar, Hash, DollarSign, FileText, ArrowLeft, X, CheckCircle2, LayoutGrid, Users, Briefcase } from "lucide-react";

interface CashReceiptFormProps {
  onClose: () => void;
}

export default function CashReceiptForm({ onClose }: CashReceiptFormProps) {
  const [activeTab, setActiveTab] = useState<"party" | "petty" | "multi">("party");
  const [formData, setFormData] = useState({
    voucherNo: "Auto-generated",
    date: new Date().toISOString().split("T")[0],
    partyId: "",
    cashAccountId: "",
    reference: "",
    narration: "",
    employeeId: "",
    jobId: "",
    amount: 0,
    notes: ""
  });

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Cash Receipt</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Receipts / Cash Receipt</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/20">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/20">
            <CheckCircle2 size={16} className="mr-2" /> Save & Post
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8 pb-24">
        {/* Tabs */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <button onClick={() => setActiveTab("party")} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "party" ? "bg-maroon-800 text-white shadow-md" : "text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200"}`}>Party Receipt</button>
          <button onClick={() => setActiveTab("petty")} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "petty" ? "bg-maroon-800 text-white shadow-md" : "text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200"}`}>Petty Receipt</button>
          <button onClick={() => setActiveTab("multi")} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "multi" ? "bg-maroon-800 text-white shadow-md" : "text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200"}`}>Multi-Party</button>
        </div>

        {/* Section 1: Receipt Details */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-maroon-100 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-maroon-800" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Receipt Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Voucher No</label>
              <input value={formData.voucherNo} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/10 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer *</label>
              <select value={formData.partyId} onChange={(e) => setFormData({...formData, partyId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/10 transition-all">
                <option value="">-- Select Customer --</option>
                <option value="c1">General Customer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cash Account * (with Balance)</label>
              <select value={formData.cashAccountId} onChange={(e) => setFormData({...formData, cashAccountId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/10 transition-all">
                <option value="">Search cash accounts...</option>
                <option value="cash_in_hand">Cash in Hand - Balance: 50,000</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reference</label>
              <input placeholder="Reference number" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Narration *</label>
              <input placeholder="Receipt description (required)" value={formData.narration} onChange={(e) => setFormData({...formData, narration: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/10 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</label>
              <select value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">-- Select Employee --</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job</label>
              <select value={formData.jobId} onChange={(e) => setFormData({...formData, jobId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">-- Select Job --</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Amount Details */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Amount Details</h2>
          </div>
          
          <div className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Amount (PKR) *</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-2xl font-black text-maroon-800 focus:ring-4 focus:ring-maroon-800/10 focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 transition-all text-right" />
            </div>
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Amount (PKR)</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{formData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* Section 3: Internal Notes */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
              <Hash size={18} className="text-slate-600 dark:text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Internal Notes</h2>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Notes (not printed)</label>
            <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes (not printed)..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-4 focus:ring-slate-800/10 transition-all resize-none" />
          </div>
        </section>
      </div>
    </div>
  );
}
