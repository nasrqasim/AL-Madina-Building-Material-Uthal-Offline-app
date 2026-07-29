"use client";

import { useState } from "react";
import { DollarSign, User, Calendar, CreditCard, Landmark, Save, X } from "lucide-react";

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
  const [employeeId, setEmployeeId] = useState(preselectedStaff?.id || "");
  const [employeeName, setEmployeeName] = useState(preselectedStaff?.name || "");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank">("Cash");
  const [bankId, setBankId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !amount || amount <= 0) {
      alert("Please enter employee name and valid salary amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payrolls/pay-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          employeeName,
          amount: Number(amount),
          paymentMethod,
          bankId,
          date,
          remarks,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        alert(`Salary payment of PKR ${amount.toLocaleString()} posted successfully.`);
        onSuccess();
        onClose();
      } else {
        alert("Failed to post salary payment: " + (json.error || json.message));
      }
    } catch (err: any) {
      alert("Error posting salary payment: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800 dark:text-white">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Pay Employee Salary
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Employee</label>
            <select
              value={employeeId}
              onChange={(e) => {
                const id = e.target.value;
                setEmployeeId(id);
                const found = staffList.find((s) => s.id === id || s._id === id);
                if (found) setEmployeeName(found.name);
              }}
              className="w-full rounded-lg border p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
              required
            >
              <option value="">-- Choose Employee --</option>
              {staffList.map((s) => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.name} ({s.designation || "Staff"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Salary Amount (PKR)</label>
            <input
              type="number"
              min="1"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g. 45000"
              className="w-full rounded-lg border p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-lg border p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks / Month</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. July 2026 Salary"
              className="w-full rounded-lg border p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium border hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
