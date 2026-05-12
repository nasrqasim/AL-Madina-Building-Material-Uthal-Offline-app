"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  X, 
  Save, 
  CheckCircle2, 
  User, 
  Banknote,
  FileText,
  Printer
} from "lucide-react";
import { printPage } from "@/lib/excel";

interface SalarySubModuleFormProps {
  title: string;
  onClose: () => void;
}

export default function SalarySubModuleForm({ title, onClose }: SalarySubModuleFormProps) {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "-- Select Staff --",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    payFrom: "Cash",
    accountId: "",
    accountName: "-- Select Account --",
    reason: "",
    notes: "",
    repaymentMonths: 1,
    status: "draft"
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Salary {title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Salary / {title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg">Cancel</button>
          <button onClick={printPage} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center border border-slate-200 dark:border-slate-800">
            <Printer size={16} className="mr-2" /> Print
          </button>
          <button className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/20">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/20">
            <CheckCircle2 size={16} className="mr-2" /> Save & Issue
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6 pb-24">
        {/* Main Details Section */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title} Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Doc Date *
              </label>
              <input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-maroon-800/20 transition-all" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Salary Staff *
              </label>
              <select 
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value, employeeName: e.target.options[e.target.selectedIndex].text})}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold"
              >
                <option value="">-- Select Staff --</option>
                <option value="e1">Ahmed Khan (STF-0001)</option>
                <option value="e2">Sarah Ali (STF-0002)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Amount *
              </label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                placeholder="0" 
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-maroon-800" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Pay From
              </label>
              <div className="flex items-center gap-4 py-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="payFrom" 
                    value="Cash" 
                    checked={formData.payFrom === "Cash"}
                    onChange={(e) => setFormData({...formData, payFrom: e.target.value})}
                    className="w-4 h-4 text-maroon-800 border-slate-300 focus:ring-maroon-800/20" 
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Cash</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="payFrom" 
                    value="Bank" 
                    checked={formData.payFrom === "Bank"}
                    onChange={(e) => setFormData({...formData, payFrom: e.target.value})}
                    className="w-4 h-4 text-maroon-800 border-slate-300 focus:ring-maroon-800/20" 
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Bank</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                {formData.payFrom} Account *
              </label>
              <select 
                value={formData.accountId}
                onChange={(e) => setFormData({...formData, accountId: e.target.value, accountName: e.target.options[e.target.selectedIndex].text})}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold"
              >
                <option value="">-- Select {formData.payFrom} Account --</option>
                {formData.payFrom === "Cash" ? (
                  <option value="c1">Petty Cash</option>
                ) : (
                  <option value="b1">HBL Main Account</option>
                )}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Reason
              </label>
              <input 
                placeholder="e.g. Medical emergency, festival, etc." 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium" 
              />
            </div>

            {title === "Loan" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Repayment Period (Months)
                </label>
                <input 
                  type="number" 
                  value={formData.repaymentMonths}
                  onChange={(e) => setFormData({...formData, repaymentMonths: parseInt(e.target.value) || 1})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black" 
                />
              </div>
            )}
          </div>

          <div className="mt-6 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Notes
            </label>
            <textarea 
              rows={3} 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-maroon-800/20 transition-all" 
              placeholder="Additional notes (printed on summary)..." 
            />
          </div>
        </section>

        {/* Summary Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff</span>
            <div className="text-sm font-black text-slate-900 dark:text-white truncate">{formData.employeeName}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pay From</span>
            <div className="text-sm font-black text-slate-900 dark:text-white truncate">{formData.payFrom} ({formData.accountName})</div>
          </div>
          <div className="md:col-span-2 bg-maroon-800 p-6 rounded-2xl shadow-lg shadow-maroon-800/20 space-y-1">
            <span className="text-[10px] font-black text-maroon-200 uppercase tracking-widest">{title} Amount</span>
            <div className="text-2xl font-black text-white leading-none">Rs.{formData.amount.toLocaleString()}</div>
          </div>
        </div>

        {/* Information Alert */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
          <div className="p-1 bg-blue-100 text-blue-600 rounded">
            <FileText size={14} />
          </div>
          <div className="text-xs font-medium text-blue-700 leading-relaxed">
            <strong>How recovery works:</strong> when this {title.toLowerCase()} is issued, the system posts <span className="font-bold text-rose-700 underline">Dr Staff Account / Cr {formData.payFrom}</span>. The full amount auto-deducts from the staff&apos;s next Payroll Run (you can edit/skip the deduction on that run if needed). Status flips to <em>Recovered</em> automatically when the outstanding hits zero.
          </div>
        </div>
      </div>
    </div>
  );
}
