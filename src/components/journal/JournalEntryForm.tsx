"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, X, CheckCircle2, FileText, AlertCircle, Printer } from "lucide-react";
import { printPage } from "@/lib/excel";

interface JournalLine {
  id: string;
  accountId: string;
  narration: string;
  debit: number;
  credit: number;
}

interface JournalEntryFormProps {
  onClose: () => void;
}

export default function JournalEntryForm({ onClose }: JournalEntryFormProps) {
  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", accountId: "", narration: "", debit: 0, credit: 0 },
    { id: "2", accountId: "", narration: "", debit: 0, credit: 0 }
  ]);
  
  const [formData, setFormData] = useState({
    voucherNo: "Auto-generated",
    date: new Date().toISOString().split("T")[0],
    type: "Journal",
    status: "draft",
    employeeId: "",
    jobId: "",
    reference: "",
    narration: "",
    notes: ""
  });

  const addLine = () => setLines([...lines, { id: Date.now().toString(), accountId: "", narration: "", debit: 0, credit: 0 }]);
  const removeLine = (id: string) => setLines(lines.filter(l => l.id !== id));
  
  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        return { ...l, [field]: value };
      }
      return l;
    }));
  };

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Journal Voucher</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Journal / General Journal</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={printPage} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800">
            <Printer size={16} className="mr-2" /> Print
          </button>
          <button type="button" className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/20">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" disabled={!isBalanced} className={`px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center shadow-lg transition-all ${isBalanced ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-slate-300 cursor-not-allowed shadow-none"}`}>
            <CheckCircle2 size={16} className="mr-2" /> Save & Post
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
        {/* Section 1: Voucher Details */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-maroon-100 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-maroon-800" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Voucher Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc No</label>
              <input value={formData.voucherNo} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-maroon-800/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Voucher Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="Journal">Journal</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Opening">Opening</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <input value={formData.status} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase" />
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reference</label>
              <input placeholder="Reference number" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
            </div>
          </div>
          <div className="mt-6 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Narration *</label>
            <input placeholder="Narration / description of journal entry" value={formData.narration} onChange={(e) => setFormData({...formData, narration: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-maroon-800/20 transition-all" />
          </div>
        </section>

        {/* Section 2: Journal Entries */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Journal Entries</h3>
            <button onClick={addLine} className="px-4 py-2 text-xs font-black bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-maroon-800 border border-slate-200 dark:border-slate-800 rounded-lg uppercase tracking-wider flex items-center transition-all">
              <Plus size={14} className="mr-1.5" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Narration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Debit (DR)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Credit (CR)</th>
                  <th className="px-6 py-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lines.map((line, index) => (
                  <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-6 py-4">
                      <select value={line.accountId} onChange={(e) => updateLine(line.id, "accountId", e.target.value)} className="w-full bg-transparent text-sm font-bold focus:outline-none">
                        <option value="">-- Select Account --</option>
                        <option value="a1">Cash in Hand</option>
                        <option value="a2">Sales Income</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input placeholder="Line narration" value={line.narration} onChange={(e) => updateLine(line.id, "narration", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={line.debit} onChange={(e) => updateLine(line.id, "debit", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-bold focus:outline-none text-right text-emerald-600" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={line.credit} onChange={(e) => updateLine(line.id, "credit", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-bold focus:outline-none text-right text-rose-600" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => removeLine(line.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50/50 flex flex-col items-end space-y-3">
            <div className="flex justify-between w-full md:w-80 text-sm">
              <span className="font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Total Debit (PKR)</span>
              <span className="font-black text-emerald-600">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between w-full md:w-80 text-sm">
              <span className="font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Total Credit (PKR)</span>
              <span className="font-black text-rose-600">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full md:w-80 border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
              <span className={`text-sm font-black uppercase tracking-tighter ${difference === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {difference === 0 ? "Balanced" : "Difference"}
              </span>
              <span className={`text-xl font-black leading-none ${difference === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {!isBalanced && totalDebit > 0 && (
              <div className="flex items-center text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <AlertCircle size={12} className="mr-1.5" /> Entry must be balanced to post
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Notes */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Notes</h2>
          </div>
          <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-800/20 transition-all resize-none" />
        </section>
      </div>
    </div>
  );
}
