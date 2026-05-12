"use client";

import { useState, useEffect } from "react";
import { 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Wallet,
  FileText
} from "lucide-react";

interface CashPaymentFormProps {
  onClose: () => void;
}

export default function CashPaymentForm({ onClose }: CashPaymentFormProps) {
  const [formData, setFormData] = useState({
    paymentType: "Party Payment",
    voucherNo: "Auto-generated",
    date: new Date().toISOString().split("T")[0],
    vendorId: "",
    cashAccountId: "",
    reference: "",
    narration: "",
    employeeId: "",
    jobId: "",
    totalAmount: 0,
    whtRate: 0,
    whtAmount: 0,
    internalNotes: ""
  });

  const [vendors, setVendors] = useState<any[]>([]);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/parties").then(res => res.json()).then(json => {
      if (json.ok) setVendors(json.data.filter((p: any) => p.type === "Vendor"));
    });
    fetch("/api/accounts").then(res => res.json()).then(json => {
      if (json.ok) setCashAccounts(json.data.filter((a: any) => a.type === "cash"));
    });
  }, []);

  const handlePost = async () => {
    if (!formData.vendorId || !formData.cashAccountId || formData.totalAmount <= 0) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/cash-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.ok) {
        alert("Payment posted successfully!");
        onClose();
      } else {
        alert("Error: " + json.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to post payment");
    }
  };

  const handleWhtRateChange = (rate: number) => {
    const whtAmount = (formData.totalAmount * rate) / 100;
    setFormData({ ...formData, whtRate: rate, whtAmount });
  };

  const handleTotalAmountChange = (amount: number) => {
    const whtAmount = (amount * formData.whtRate) / 100;
    setFormData({ ...formData, totalAmount: amount, whtAmount });
  };

  const netAmount = formData.totalAmount - formData.whtAmount;

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen font-sans">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">New Cash Payment</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Payments / Cash Payment</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button 
            type="button" 
            onClick={handlePost}
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all"
          >
            <CheckCircle2 size={16} className="mr-2" /> Save & Post
          </button>
        </div>
      </div>


      <div className="max-w-4xl mx-auto p-6 space-y-8 pb-24">
        {/* Payment Type Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          {["Party Payment", "Petty Payment", "Multi-Party"].map(type => (
            <button 
              key={type}
              onClick={() => setFormData({ ...formData, paymentType: type })}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${formData.paymentType === type ? "bg-maroon-800 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50"}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Section 1: Payment Details */}
        <section className="bg-slate-50 dark:bg-slate-800/50/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Payment Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Voucher No</label>
              <input value={formData.voucherNo} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cash Account * (with Balance)</label>
              <select value={formData.cashAccountId} onChange={(e) => setFormData({...formData, cashAccountId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 transition-all">
                <option value="">Search cash accounts...</option>
                {cashAccounts.map(a => <option key={a._id} value={a._id}>{a.code} - {a.title}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor *</label>
              <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 transition-all">
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Narration *</label>
              <input placeholder="Payment description (required)" value={formData.narration} onChange={(e) => setFormData({...formData, narration: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reference</label>
              <input placeholder="Reference number" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</label>
              <select value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">-- Select Employee --</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job</label>
              <select value={formData.jobId} onChange={(e) => setFormData({...formData, jobId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">-- Select Job --</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Amount Details */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/30">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-emerald-600" />
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Amount Details</h3>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Amount *</label>
              <input type="number" value={formData.totalAmount} onChange={(e) => handleTotalAmountChange(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black focus:ring-4 focus:ring-emerald-600/5 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">WHT Rate %</label>
              <input type="number" value={formData.whtRate} onChange={(e) => handleWhtRateChange(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black focus:ring-4 focus:ring-emerald-600/5 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">WHT Amount</label>
              <input type="number" value={formData.whtAmount} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Amount to Pay</label>
              <input type="number" value={netAmount} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50/50 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Total Amount (PKR)</span>
                <span className="font-black text-slate-900 dark:text-white">{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-tighter">WHT @ {formData.whtRate}% (PKR)</span>
                <span className="font-black text-slate-900 dark:text-white">{formData.whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-base font-black text-maroon-800 uppercase tracking-tighter">Net Amount to Pay (PKR)</span>
                <span className="text-xl font-black text-maroon-800 tracking-tighter">{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Notes */}
        <section className="bg-slate-50 dark:bg-slate-800/50/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <FileText size={20} className="text-slate-600 dark:text-slate-300" />
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Internal Notes</h2>
          </div>
          <div className="space-y-1.5">
            <textarea rows={4} value={formData.internalNotes} onChange={(e) => setFormData({...formData, internalNotes: e.target.value})} placeholder="Internal notes (not printed)..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-4 focus:ring-maroon-800/5 transition-all resize-none" />
          </div>
        </section>
      </div>
    </div>
  );
}
