"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Calendar, Tag, Banknote, FileText, Bookmark, ClipboardList } from "lucide-react";

interface OtherIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income?: any;
  onSave: (data: any) => Promise<void>;
  mode?: "create" | "edit" | "view";
}

export default function OtherIncomeModal({
  isOpen,
  onClose,
  income,
  onSave,
  mode = "create"
}: OtherIncomeModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    incomeType: "One Time",
    paymentMethod: "Cash",
    reference: "",
    date: new Date().toISOString().split("T")[0]
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (income) {
      setFormData({
        title: income.title || "",
        description: income.description || "",
        amount: income.amount?.toString() || "",
        incomeType: income.incomeType || "One Time",
        paymentMethod: income.paymentMethod || "Cash",
        reference: income.reference || "",
        date: income.date ? new Date(income.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
      });
    } else {
      setFormData({
        title: "",
        description: "",
        amount: "",
        incomeType: "One Time",
        paymentMethod: "Cash",
        reference: "",
        date: new Date().toISOString().split("T")[0]
      });
    }
  }, [income, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") return;

    if (!formData.title.trim()) {
      alert("Income Title is required");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Please enter a valid amount greater than zero");
      return;
    }
    if (!formData.incomeType) {
      alert("Income Type is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        amount: Number(formData.amount)
      });
      onClose();
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isView = mode === "view";

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "view" ? "View Other Income" : mode === "edit" ? "Edit Other Income" : "Add Other Income"}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all"
          >
            {isView ? "Close" : "Cancel"}
          </button>
          {!isView && (
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-800/20 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Title */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Bookmark size={14} /> Income Title
            </label>
            <input
              type="text"
              disabled={isView}
              placeholder="e.g. Shop Rent, Scrap Sale"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-maroon-800 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-950/30"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} /> Date
            </label>
            <input
              type="date"
              disabled={isView}
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-maroon-800 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-950/30"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Banknote size={14} /> Amount (PKR)
            </label>
            <input
              type="number"
              disabled={isView}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 rounded-xl px-4 py-3 font-black text-xl font-mono text-emerald-600 outline-none focus:border-maroon-800 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-950/30"
            />
          </div>

          {/* Income Type */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={14} /> Income Type
            </label>
            <select
              disabled={isView}
              value={formData.incomeType}
              onChange={e => setFormData({ ...formData, incomeType: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white bg-white outline-none focus:border-maroon-800 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-950/30"
            >
              <option value="One Time">One Time</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={14} /> Payment Method
            </label>
            <select
              disabled={isView}
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white bg-white outline-none focus:border-maroon-800 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-950/30"
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Reference Number (Optional)
            </label>
            <input
              type="text"
              disabled={isView}
              placeholder="e.g. Transaction ID, Slip #"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-maroon-800 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-950/30"
            />
          </div>

          {/* Reason / Description */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Reason / Description (Optional)
            </label>
            <textarea
              rows={3}
              disabled={isView}
              placeholder="Describe detail about this income..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-maroon-800 transition-all resize-none disabled:bg-slate-50 dark:disabled:bg-slate-950/30"
            />
          </div>
        </div>
      </form>
    </ERPModal>
  );
}
