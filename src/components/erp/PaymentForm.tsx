"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  X, 
  Save, 
  CheckCircle2, 
  User, 
  Banknote,
  Calendar,
  FileText,
  CreditCard,
  Building
} from "lucide-react";

interface PaymentFormProps {
  type: "Payment" | "Receipt";
  method: "Cash" | "Bank";
  onClose: () => void;
}

export default function PaymentForm({ type, method, onClose }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    docNo: "Auto-generated",
    date: new Date().toISOString().split("T")[0],
    partyId: "",
    accountId: "",
    amount: 0,
    reference: "",
    notes: "",
    status: "draft"
  });

  const title = `${method} ${type}`;

  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300 dark:text-slate-400 dark:text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{type}s / {title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/20">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/20">
            <CheckCircle2 size={16} className="mr-2" /> Post {type}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-4 rounded-2xl ${type === "Payment" ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"}`}>
              {method === "Cash" ? <Banknote size={24} /> : <Building size={24} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{title} Details</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">Record a new {type.toLowerCase()} transaction.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Document No</label>
              <input value={formData.docNo} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl text-sm font-black text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Date *
              </label>
              <input type="date" value={formData.date} className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reference</label>
              <input placeholder="Cheque # / Slip #" className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User size={14} /> {type === "Payment" ? "Pay To" : "Receive From"} *
              </label>
              <select className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white">
                <option value="">Select Party</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14} /> {method} Account *
              </label>
              <select className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">Select Account</option>
              </select>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 dark:border-slate-700 shadow-inner flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Transaction Amount</label>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">Enter the total amount in PKR.</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">Rs.</span>
              <input 
                type="number" 
                placeholder="0.00" 
                className="pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 dark:border-slate-700 rounded-2xl text-3xl font-black text-maroon-800 dark:text-maroon-400 w-64 focus:border-maroon-800 transition-all outline-none" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Internal Notes
            </label>
            <textarea rows={3} className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl text-sm font-medium resize-none dark:text-white" placeholder="Add any internal remarks..."></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
