"use client";

import { useState, useEffect } from "react";
import { DollarSign, User, Calendar, CreditCard, Landmark, Save, X } from "lucide-react";

interface ReceiveLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: any[];
  loansList?: any[];
  onSuccess: () => void;
  preselectedLoan?: any;
}

export default function ReceiveLoanModal({
  isOpen,
  onClose,
  staffList,
  loansList = [],
  onSuccess,
  preselectedLoan,
}: ReceiveLoanModalProps) {
  const [loanId, setLoanId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank">("Cash");
  const [bankId, setBankId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("Loan Repayment");
  const [banks, setBanks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/banks")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setBanks(data.data || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (preselectedLoan) {
      setLoanId(preselectedLoan._id || preselectedLoan.id || "");
      setEmployeeName(preselectedLoan.employee || "");
      setAmount(Number(preselectedLoan.monthlyDeduction || preselectedLoan.amount) || 0);
    } else {
      setLoanId("");
      setEmployeeName("");
      setAmount(0);
    }
  }, [preselectedLoan, isOpen]);

  if (!isOpen) return null;

  const handleLoanChange = (id: string) => {
    setLoanId(id);
    const loan = (loansList || []).find(l => (l._id === id || l.id === id));
    if (loan) {
      setEmployeeName(loan.employee || "");
      setAmount(Number(loan.monthlyDeduction || loan.amount) || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName) {
      alert("Please select an employee / loan");
      return;
    }
    if (amount <= 0) {
      alert("Please enter a valid repayment amount");
      return;
    }
    if (paymentMethod === "Bank" && !bankId) {
      alert("Please select a bank account");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/salary-loans/repay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: loanId || undefined,
          employee: employeeName,
          amount,
          paymentMethod,
          bankId: paymentMethod === "Bank" ? bankId : undefined,
          date,
          remarks,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        alert("Loan repayment received successfully! Cash & Banks updated.");
        onSuccess();
        onClose();
      } else {
        alert(json.message || "Failed to record loan repayment");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error occurred: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-emerald-700 p-4 text-white flex justify-between items-center">
          <h2 className="text-base font-black tracking-wide flex items-center gap-2">
            <DollarSign size={20} /> Receive Loan Repayment
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-emerald-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <User size={12} /> Select Loan / Employee *
            </label>
            <select
              value={loanId}
              onChange={e => handleLoanChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none"
              required
            >
              <option value="">-- Select Active Loan --</option>
              {(loansList || []).map(l => (
                <option key={l._id || l.id} value={l._id || l.id}>
                  {l.voucherNo} - {l.employee} (Loan: PKR {l.amount}, Monthly: PKR {l.monthlyDeduction})
                </option>
              ))}
              {(staffList || []).map(s => (
                <option key={s._id || s.id} value={`EMP-${s._id || s.id}`}>
                  Employee: {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <DollarSign size={12} /> Repayment Amount (PKR) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black text-emerald-600 focus:outline-none font-mono"
              required
              min={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <CreditCard size={12} /> Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as "Cash" | "Bank")}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} /> Repayment Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none"
                required
              />
            </div>
          </div>

          {paymentMethod === "Bank" && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Landmark size={12} /> Select Bank Account *
              </label>
              <select
                value={bankId}
                onChange={e => setBankId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none"
                required
              >
                <option value="">-- Select Bank Account --</option>
                {(banks || []).map(b => (
                  <option key={b._id || b.id} value={b._id || b.id}>
                    {b.name} ({b.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Monthly Loan Installment Paid"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-xl font-black uppercase tracking-wider hover:bg-emerald-800 transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
            >
              <Save size={16} />
              {isSubmitting ? "Processing..." : "Receive Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
