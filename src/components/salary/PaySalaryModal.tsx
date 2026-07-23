"use client";

import { useState, useEffect } from "react";
import { DollarSign, User, Calendar, CreditCard, Landmark, Save, X } from "lucide-react";
import { generateUniqueId } from "@/lib/dexie";

interface PaySalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: any[];
  onSuccess: () => void;
  preselectedStaff?: any;
}

export default function PaySalaryModal({
  isOpen,
  onClose,
  staffList,
  onSuccess,
  preselectedStaff,
}: PaySalaryModalProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank">("Cash");
  const [bankId, setBankId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("Salary Payment");
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
    if (preselectedStaff) {
      setEmployeeId(preselectedStaff._id || preselectedStaff.id || "");
      setEmployeeName(preselectedStaff.name || "");
      setAmount(Number(preselectedStaff.basicSalary) || Number(preselectedStaff.salary) || 0);
    } else {
      setEmployeeId("");
      setEmployeeName("");
      setAmount(0);
    }
  }, [preselectedStaff, isOpen]);

  if (!isOpen) return null;

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id);
    const emp = (staffList || []).find(s => (s._id === id || s.id === id));
    if (emp) {
      setEmployeeName(emp.name || "");
      setAmount(Number(emp.basicSalary) || Number(emp.salary) || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName) {
      alert("Please select an employee");
      return;
    }
    if (amount <= 0) {
      alert("Please enter a valid salary amount");
      return;
    }
    if (paymentMethod === "Bank" && !bankId) {
      alert("Please select a bank account");
      return;
    }

    setIsSubmitting(true);
    try {
      const voucherNo = `SAL-${generateUniqueId()}`;
      const payDate = date || new Date().toISOString().split("T")[0];
      const salaryAmount = Number(amount) || 0;

      // 1. Save directly to client IndexedDB for instant UI updates & offline support
      const salaryPayload = {
        id: voucherNo,
        voucherNo,
        employeeId,
        employeeName,
        amount: salaryAmount,
        paymentMethod,
        bankId: paymentMethod === "Bank" ? bankId : undefined,
        date: payDate,
        remarks: remarks || "Salary Payment",
        status: "Paid",
        createdAt: new Date().toISOString(),
      };

      try {
        const { offlineDB } = await import("@/lib/dexie");
        await offlineDB.settings.add({
          id: generateUniqueId(),
          key: "salary_payment",
          value: salaryPayload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any);

        // Record Journal Entry
        let cashCode = paymentMethod === "Bank" ? "1110" : "1111";
        let cashTitle = paymentMethod === "Bank" ? "Bank Account" : "Cash Hand";

        await offlineDB.journalEntries.bulkAdd([
          {
            id: generateUniqueId(),
            voucherNo,
            date: payDate,
            accountCode: "5200",
            accountTitle: "Salary Expense",
            debit: salaryAmount,
            credit: 0,
            remarks: `Salary paid to ${employeeName}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: generateUniqueId(),
            voucherNo,
            date: payDate,
            accountCode: cashCode,
            accountTitle: cashTitle,
            debit: 0,
            credit: salaryAmount,
            remarks: `Salary paid to ${employeeName}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ] as any);

        if (paymentMethod === "Bank") {
          await offlineDB.bankPayments.add({
            id: generateUniqueId(),
            voucherNo,
            date: payDate,
            amount: salaryAmount,
            bankAccountId: bankId,
            narration: `Salary paid to ${employeeName}`,
            notes: remarks || "Salary Payment",
            status: "Posted",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any);
        } else {
          await offlineDB.cashPayments.add({
            id: generateUniqueId(),
            voucherNo,
            date: payDate,
            amount: salaryAmount,
            narration: `Salary paid to ${employeeName}`,
            notes: remarks || "Salary Payment",
            status: "Posted",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any);
        }
      } catch (dbErr) {
        console.error("Local DB save error:", dbErr);
      }

      // 2. Call API route as well
      try {
        await fetch("/api/payrolls/pay-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            employeeName,
            amount: salaryAmount,
            paymentMethod,
            bankId: paymentMethod === "Bank" ? bankId : undefined,
            date: payDate,
            remarks,
          }),
        });
      } catch (apiErr) {
        console.error("API pay-staff call error:", apiErr);
      }

      alert("Salary paid successfully! Cash & Banks updated.");
      onSuccess();
      onClose();
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
        <div className="bg-maroon-800 p-4 text-white flex justify-between items-center">
          <h2 className="text-base font-black tracking-wide flex items-center gap-2">
            <DollarSign size={20} /> Pay Staff Salary
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-maroon-900 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <User size={12} /> Employee *
            </label>
            <select
              value={employeeId}
              onChange={e => handleEmployeeChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none"
              required
            >
              <option value="">-- Select Employee --</option>
              {(staffList || []).map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.code ? `${s.code} - ` : ""}{s.name} ({s.designation || "Staff"})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <DollarSign size={12} /> Salary Amount (PKR) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black text-maroon-800 focus:outline-none font-mono"
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
                <Calendar size={12} /> Payment Date *
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
              Remarks / Month
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Salary for July 2026"
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
              className="flex items-center gap-2 px-6 py-2.5 bg-maroon-800 text-white rounded-xl font-black uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-md shadow-maroon-800/20 disabled:opacity-50"
            >
              <Save size={16} />
              {isSubmitting ? "Processing..." : "Pay Salary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
