"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, Calendar, Hash, DollarSign, FileText, Landmark, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import PartyLookupSelect from "@/components/erp/ui/PartyLookupSelect";
import PartyDetailsCard, { type PartyLike } from "@/components/erp/ui/PartyDetailsCard";

interface BankReceiptFormProps {
  onClose: () => void;
}

export default function BankReceiptForm({ onClose }: BankReceiptFormProps) {
  const [formData, setFormData] = useState({
    partyId: "",
    bankAccountId: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    totalAmount: 0,
    narration: "",
  });

  const [banks, setBanks] = useState<any[]>([]);
  const [parties, setParties] = useState<PartyLike[]>([]);
  const [partyType, setPartyType] = useState<"Customer" | "Vendor">("Customer");
  const [previewParty, setPreviewParty] = useState<PartyLike | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/banks")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setBanks(json.data || []);
      });
    fetch("/api/parties")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setParties(json.data || []);
      });
  }, []);

  const selectedParty = useMemo(
    () => (parties || []).find((p) => p._id === formData.partyId) || previewParty,
    [parties, formData.partyId, previewParty]
  );

  const selectedBank = useMemo(
    () => (banks || []).find((b) => b._id === formData.bankAccountId) || null,
    [banks, formData.bankAccountId]
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.partyId || !formData.bankAccountId || formData.totalAmount <= 0) {
      return alert("Please fill all required fields (*) and enter a valid amount.");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bank-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          customerId: formData.partyId,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        alert("Bank Receipt saved and posted successfully!");
        onClose();
      } else {
        alert("Error: " + (json.message || "Something went wrong"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save receipt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Bank Receipt</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Receipts / Bank Receipt</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold border rounded-lg flex items-center">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit()}
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg flex items-center disabled:opacity-50"
          >
            <CheckCircle2 size={16} className="mr-2" /> {isSubmitting ? "Saving..." : "Save & Post"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <form className="md:col-span-2 space-y-6 order-2 md:order-1" onSubmit={handleSubmit}>
            <section className="bg-slate-50 rounded-2xl p-6 border space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText size={18} /> Receipt Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <PartyLookupSelect
                    parties={parties}
                    value={formData.partyId}
                    partyType={partyType}
                    onPartyTypeChange={(t) => {
                      setPartyType(t);
                      setFormData((prev) => ({ ...prev, partyId: "" }));
                      setPreviewParty(null);
                    }}
                    onChange={(id, party) => {
                      setFormData((prev) => ({ ...prev, partyId: id }));
                      setPreviewParty(party);
                    }}
                    onPreview={setPreviewParty}
                    label="Receive From (Customer / Vendor)"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                    <Landmark size={12} /> Deposit To *
                  </label>
                  <select
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  >
                    <option value="">Select Bank Account</option>
                    {(banks || []).map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} - {b.accountNo} (Rs.{(b.balance || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                    <Calendar size={12} /> Receipt Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                    <Hash size={12} /> Ref / Cheque #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-55221"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                    <DollarSign size={12} /> Amount Received *
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.totalAmount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full px-4 py-3 border rounded-xl text-sm font-black text-right"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Narration *</label>
                  <textarea
                    placeholder="Enter bank transaction details..."
                    value={formData.narration}
                    onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                    required
                    className="w-full px-4 py-3 border rounded-xl text-sm min-h-[100px] font-bold"
                  />
                </div>
              </div>
            </section>
          </form>

          <div className="md:col-span-1 order-1 md:order-2">
            <PartyDetailsCard
              party={selectedParty}
              account={
                selectedBank
                  ? {
                      _id: selectedBank._id,
                      title: selectedBank.name,
                      code: selectedBank.accountNo,
                      openingBalance: selectedBank.balance,
                    }
                  : null
              }
              title="Party Details"
              emptyMessage="Select or search a customer/vendor — scroll the list to preview balance, or pick one to load live ledger balance."
              refreshLive={!!formData.partyId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
