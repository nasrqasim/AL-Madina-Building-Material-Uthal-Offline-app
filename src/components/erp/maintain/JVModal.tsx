"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface JVModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: any;
  allAccounts: any[];
  parties: any[];
  onSave: (payload: any) => Promise<void>;
  editingJV: any;
}

export default function JVModal({
  isOpen,
  onClose,
  activeAccount,
  allAccounts,
  parties,
  onSave,
  editingJV,
}: JVModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [voucherNo, setVoucherNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState<number | "">("");
  const [oppositeCode, setOppositeCode] = useState("");
  const [partyType, setPartyType] = useState<"none" | "customer" | "vendor">("none");
  const [partyId, setPartyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load editing data or reset form
  useEffect(() => {
    if (editingJV) {
      setDate(editingJV.date ? new Date(editingJV.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
      setVoucherNo(editingJV.voucherNo || "");
      setRemarks(editingJV.remarks || "");
      setType(editingJV.debit > 0 ? "debit" : "credit");
      setAmount(editingJV.debit > 0 ? editingJV.debit : editingJV.credit);
      setPartyType(editingJV.partyType || "none");
      setPartyId(editingJV.partyId?._id || editingJV.partyId || "");

      // Fetch counterpart entry to get oppositeCode
      fetch(`/api/journal-entries?voucherNo=${editingJV.voucherNo}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.ok && Array.isArray(json.data)) {
            // Find counterpart leg (where accountCode is different from activeAccount.code)
            const counterpart = json.data.find((e: any) => e.accountCode !== activeAccount.code);
            if (counterpart) {
              setOppositeCode(counterpart.accountCode);
            }
          }
        })
        .catch(console.error);
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setVoucherNo("");
      setRemarks("");
      setType(activeAccount?.rawAccount?.type === "expense" ? "debit" : "debit");
      setAmount("");
      setOppositeCode("");
      setPartyType("none");
      setPartyId("");
    }
  }, [editingJV, isOpen, activeAccount]);

  if (!isOpen) return null;

  // Filter accounts for opposite select (exclude active account itself)
  const availableOppositeAccounts = allAccounts.filter(
    (acc) => acc.code !== activeAccount?.code
  );

  // Filter parties based on type
  const filteredParties = parties.filter(
    (p) => p.type?.toLowerCase() === partyType
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert("Please enter a valid amount");
    if (!oppositeCode) return alert("Please select an opposite counterpart account");
    if (partyType !== "none" && !partyId) return alert("Please select a party");

    setIsSubmitting(true);
    try {
      const oppositeAcc = allAccounts.find((a) => a.code === oppositeCode);
      const oppositeTitle = oppositeAcc ? oppositeAcc.title || oppositeAcc.name : "Opposite Account";

      const finalVoucherNo = voucherNo.trim() || `JV-${Date.now().toString().slice(-6)}`;

      const payload = {
        voucherNo: finalVoucherNo,
        date,
        remarks,
        amount: Number(amount),
        partyId: partyType !== "none" ? partyId : null,
        partyType: partyType !== "none" ? partyType : null,
        entries: [
          {
            voucherNo: finalVoucherNo,
            date,
            remarks,
            accountCode: activeAccount.code,
            accountTitle: activeAccount.name,
            debit: type === "debit" ? Number(amount) : 0,
            credit: type === "credit" ? Number(amount) : 0,
            partyId: partyType !== "none" ? partyId : null,
            partyType: partyType !== "none" ? partyType : "",
          },
          {
            voucherNo: finalVoucherNo,
            date,
            remarks,
            accountCode: oppositeCode,
            accountTitle: oppositeTitle,
            debit: type === "credit" ? Number(amount) : 0,
            credit: type === "debit" ? Number(amount) : 0,
            partyId: partyType !== "none" ? partyId : null,
            partyType: partyType !== "none" ? partyType : "",
          },
        ],
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {editingJV ? "Edit Ledger Entry" : "Add Entry"}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Account: <span className="text-maroon-800 font-black">{activeAccount?.code} — {activeAccount?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 focus:outline-none transition-all"
              />
            </div>

            {/* Voucher No */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Voucher # (JV)</label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                placeholder="Auto-generated"
                disabled={!!editingJV}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type Toggle */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</label>
              <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setType("debit")}
                  className={`py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    type === "debit"
                      ? "bg-white dark:bg-slate-950 text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Debit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setType("credit")}
                  className={`py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    type === "credit"
                      ? "bg-white dark:bg-slate-950 text-rose-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Credit (-)
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount (PKR)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Counterpart Account Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Opposite / Counterpart Account
            </label>
            <select
              required
              value={oppositeCode}
              onChange={(e) => setOppositeCode(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 focus:outline-none transition-all"
            >
              <option value="">Select Account...</option>
              {availableOppositeAccounts.map((acc) => (
                <option key={acc._id} value={acc.code}>
                  {acc.code} — {acc.title || acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Party Type Toggle */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Party Association</label>
            <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => { setPartyType("none"); setPartyId(""); }}
                className={`py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  partyType === "none"
                    ? "bg-white dark:bg-slate-950 text-maroon-850 dark:text-maroon-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => { setPartyType("customer"); setPartyId(""); }}
                className={`py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  partyType === "customer"
                    ? "bg-white dark:bg-slate-950 text-maroon-850 dark:text-maroon-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => { setPartyType("vendor"); setPartyId(""); }}
                className={`py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  partyType === "vendor"
                    ? "bg-white dark:bg-slate-950 text-maroon-850 dark:text-maroon-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Vendor
              </button>
            </div>
          </div>

          {/* Select Party */}
          {partyType !== "none" && (
            <div className="space-y-1 animate-slide-in">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Select {partyType === "customer" ? "Customer" : "Vendor"}
              </label>
              <select
                required
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 focus:outline-none transition-all"
              >
                <option value="">Select {partyType === "customer" ? "Customer" : "Vendor"}...</option>
                {filteredParties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.companyName ? `(${p.companyName})` : ""} — Bal: PKR {p.balance?.toLocaleString() || 0}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks / Description</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Dokan maintenance office repair work"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 focus:outline-none transition-all"
            />
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-maroon-800 text-white text-xs font-black rounded-xl hover:bg-maroon-900 shadow-md shadow-maroon-800/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
