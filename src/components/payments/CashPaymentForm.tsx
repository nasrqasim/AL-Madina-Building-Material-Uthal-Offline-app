"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Save,
  ArrowLeft,
  X,
  CheckCircle2,
  Wallet,
  FileText,
  Plus,
  Trash2,
  Landmark,
  DollarSign,
} from "lucide-react";
import PartyLookupSelect from "@/components/erp/ui/PartyLookupSelect";
import PartyDetailsCard, { type PartyLike, type AccountLike } from "@/components/erp/ui/PartyDetailsCard";
import { calculateCustomerBalance, calculateBalanceFromTransactions } from "@/lib/customerBalance";
import { calculateVendorBalance, calculateVendorBalanceFromTransactions } from "@/lib/vendorBalance";

interface CashPaymentFormProps {
  onClose: () => void;
  initialData?: Record<string, unknown>;
}

export default function CashPaymentForm({ onClose, initialData }: CashPaymentFormProps) {
  const isEdit = !!(initialData && initialData._id);
  const [activeTab, setActiveTab] = useState<"party" | "petty">(
    initialData?.paymentType === "petty" ? "petty" : "party"
  );
  const [partyType, setPartyType] = useState<"Customer" | "Vendor">("Vendor");
  const [pettySubTab, setPettySubTab] = useState<"general" | "customer" | "vendor">("general");
  const [previewParty, setPreviewParty] = useState<PartyLike | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    voucherNo: String(initialData?.voucherNo || "Auto-generated"),
    date: initialData?.date
      ? String(initialData.date).slice(0, 10)
      : new Date().toISOString().split("T")[0],
    partyId: (initialData?.partyId as { _id?: string })?._id || String(initialData?.partyId || initialData?.vendor || ""),
    cashAccountId: (initialData?.cashAccountId as { _id?: string })?._id || String(initialData?.cashAccountId || ""),
    reference: String(initialData?.reference || ""),
    narration: String(initialData?.narration || ""),
    jobId: (initialData?.jobId as { _id?: string })?._id || String(initialData?.jobId || ""),
    amount: Number(initialData?.amount ?? initialData?.totalAmount) || 0,
    whtRate: Number(initialData?.whtRate) || 0,
    whtAmount: Number(initialData?.whtAmount ?? initialData?.wht) || 0,
    notes: String(initialData?.notes || initialData?.internalNotes || ""),
  });

  const [contraLines, setContraLines] = useState<Record<string, unknown>[]>(
    (initialData?.contraLines as Record<string, unknown>[]) || []
  );

  const [availableAccounts, setAvailableAccounts] = useState<AccountLike[]>([]);
  const [availableParties, setAvailableParties] = useState<PartyLike[]>([]);
  const [jobs, setJobs] = useState<{ _id: string; title?: string; name?: string }[]>([]);

  // Transaction data for balance calculation
  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchasesData, setPurchasesData] = useState<any[]>([]);
  const [cashReceiptsData, setCashReceiptsData] = useState<any[]>([]);
  const [bankReceiptsData, setBankReceiptsData] = useState<any[]>([]);
  const [cashPaymentsData, setCashPaymentsData] = useState<any[]>([]);
  const [bankPaymentsData, setBankPaymentsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [acctRes, partyRes, jobRes, salesRes, purRes, cashRecRes, bankRecRes, cashPayRes, bankPayRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/parties"),
          fetch("/api/jobs"),
          fetch("/api/sales"),
          fetch("/api/purchases"),
          fetch("/api/cash-receipts"),
          fetch("/api/bank-receipts"),
          fetch("/api/cash-payments"),
          fetch("/api/bank-payments")
        ]);
        const [acctJson, partyJson, jobJson] = await Promise.all([
          acctRes.json(),
          partyRes.json(),
          jobRes.json()
        ]);
        const salesJson = await salesRes.json();
        const purJson = await purRes.json();
        const cashRecJson = await cashRecRes.json();
        const bankRecJson = await bankRecRes.json();
        const cashPayJson = await cashPayRes.json();
        const bankPayJson = await bankPayRes.json();
        
        if (acctJson.ok) setAvailableAccounts(acctJson.data || []);
        if (partyJson.ok) setAvailableParties(partyJson.data || []);
        if (jobJson.ok) setJobs(jobJson.data || []);
        
        // Store transaction data for balance calculation
        if (salesJson.ok) setSalesData(Array.isArray(salesJson.data) ? salesJson.data : []);
        if (purJson.ok) setPurchasesData(Array.isArray(purJson.data) ? purJson.data : []);
        if (cashRecJson.ok) setCashReceiptsData(Array.isArray(cashRecJson.data) ? cashRecJson.data : []);
        if (bankRecJson.ok) setBankReceiptsData(Array.isArray(bankRecJson.data) ? bankRecJson.data : []);
        if (cashPayJson.ok) setCashPaymentsData(Array.isArray(cashPayJson.data) ? cashPayJson.data : []);
        if (bankPayJson.ok) setBankPaymentsData(Array.isArray(bankPayJson.data) ? bankPayJson.data : []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (initialData?.partyId && (availableParties || []).length) {
      const p = initialData.partyId as PartyLike;
      const id = p._id || String(initialData.partyId);
      const found = (availableParties || []).find((x) => x._id === id);
      if (found) {
        setPartyType(found.type === "Customer" ? "Customer" : "Vendor");
        setPreviewParty(found);
      }
    }
  }, [initialData, availableParties]);

  const cashAccounts = useMemo(
    () => (availableAccounts || []).filter((a) => a.type === "cash" || a.type === "bank"),
    [availableAccounts]
  );

  const customers = useMemo(() => (availableParties || []).filter((p) => p.type === "Customer"), [availableParties]);
  const vendors = useMemo(() => (availableParties || []).filter((p) => p.type === "Vendor"), [availableParties]);

  const selectedParty = useMemo(
    () => (availableParties || []).find((p) => p._id === formData.partyId) || previewParty,
    [availableParties, formData.partyId, previewParty]
  );

  const selectedCashAccount = useMemo(
    () => cashAccounts.find((a) => a._id === formData.cashAccountId) || null,
    [cashAccounts, formData.cashAccountId]
  );

  const totalAmount = useMemo(() => {
    if (activeTab === "party") return formData.amount;
    if (activeTab === "petty") {
      if (pettySubTab === "general") {
        return contraLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
      }
      return formData.amount;
    }
    return 0;
  }, [activeTab, pettySubTab, formData.amount, contraLines]);

  const whtAmount = useMemo(() => {
    if (formData.whtAmount && activeTab === "party") return formData.whtAmount;
    return (totalAmount * formData.whtRate) / 100;
  }, [totalAmount, formData.whtRate, formData.whtAmount, activeTab]);

  const netPaid = totalAmount - whtAmount;

  // Helper function to get party balance based on type
  const getPartyBalance = useCallback((party: PartyLike, type: "Customer" | "Vendor"): { balance: number; label: string } => {
    if (!party) return { balance: 0, label: "0.00" };
    
    if (type === "Customer") {
      const balanceResult = calculateBalanceFromTransactions(party, salesData, cashReceiptsData, bankReceiptsData, cashPaymentsData, bankPaymentsData);
      return { 
        balance: balanceResult.receivable || 0, 
        label: balanceResult.receivable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      };
    } else {
      const balanceResult = calculateVendorBalanceFromTransactions(party, purchasesData, [], cashPaymentsData, bankPaymentsData, cashReceiptsData, bankReceiptsData);
      return { 
        balance: balanceResult.payable || 0, 
        label: balanceResult.payable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      };
    }
  }, [salesData, purchasesData, cashReceiptsData, bankReceiptsData, cashPaymentsData, bankPaymentsData]);

  // Display balance for selected party
  const displayPartyBalance = useMemo(() => {
    if (!selectedParty) return { balance: "0.00", label: "Balance" };
    return getPartyBalance(selectedParty, partyType);
  }, [selectedParty, partyType, getPartyBalance]);

  const handleWhtRateChange = (rate: number) => {
    setFormData({
      ...formData,
      whtRate: rate,
      whtAmount: (formData.amount * rate) / 100,
    });
  };

  const handleAmountChange = (amount: number) => {
    setFormData({
      ...formData,
      amount,
      whtAmount: (amount * formData.whtRate) / 100,
    });
  };

  const addContraLine = () =>
    setContraLines([...contraLines, { accountId: "", accountTitle: "", description: "", amount: 0 }]);

  const removeContraLine = (index: number) => setContraLines(contraLines.filter((_, i) => i !== index));

  const updateContraLine = (index: number, field: string, value: unknown) => {
    setContraLines(
      contraLines.map((line, idx) => {
        if (idx !== index) return line;
        const updated = { ...line, [field]: value };
        if (field === "accountId") {
          const acc = (availableAccounts || []).find((a) => a._id === value);
          updated.accountTitle = acc?.title || "";
        }
        return updated;
      })
    );
  };

  const handleSave = async (status: "Draft" | "Posted") => {
    if (!formData.date) return alert("Please select a date.");
    if (!formData.cashAccountId) return alert("Please select a cash account.");
    if (!formData.narration.trim()) return alert("Please enter narration.");

    if (activeTab === "party") {
      if (!formData.partyId) return alert(`Please select a ${partyType}.`);
      if (formData.amount <= 0) return alert("Please enter a valid amount.");
    }

    if (activeTab === "petty") {
      if (pettySubTab === "general") {
        if (!contraLines.length) return alert("Add at least one contra account line.");
        if (contraLines.some((l) => !l.accountId || Number(l.amount) <= 0)) {
          return alert("Fill all contra lines with account and amount.");
        }
      } else {
        if (!formData.partyId) return alert(`Please select a ${pettySubTab === "customer" ? "customer" : "vendor"}.`);
        if (formData.amount <= 0) return alert("Please enter a valid amount.");
      }
    }

    setSaving(true);
    try {
      const selectedCash = cashAccounts.find((a) => a._id === formData.cashAccountId);
      const payload: Record<string, unknown> = {
        voucherNo: formData.voucherNo,
        paymentType: activeTab,
        date: formData.date,
        cashAccountId: formData.cashAccountId,
        cashAccountTitle: selectedCash?.title || "",
        reference: formData.reference,
        narration: formData.narration,
        jobId: formData.jobId || null,
        amount: totalAmount,
        whtRate: formData.whtRate,
        whtAmount: activeTab === "party" ? whtAmount : (totalAmount * formData.whtRate) / 100,
        notes: formData.notes,
        status,
        contraLines: [],
        partyId: null,
      };

      if (activeTab === "party") {
        payload.partyId = formData.partyId;
      } else if (pettySubTab === "general") {
        payload.contraLines = contraLines.map((l) => ({
          accountId: l.accountId,
          accountTitle: l.accountTitle,
          description: l.description,
          amount: Number(l.amount) || 0,
        }));
      } else {
        payload.partyId = formData.partyId;
      }

      const url = isEdit ? `/api/cash-payments/${initialData!._id}` : "/api/cash-payments";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        alert(`Cash Payment ${isEdit ? "updated" : "saved"} successfully!`);
        onClose();
      } else {
        alert("Error: " + (json.message || json.error || "Save failed"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEdit ? `Edit Cash Payment: ${formData.voucherNo}` : "New Cash Payment"}
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Payments / Cash Payment</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold border rounded-lg flex items-center">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("Draft")}
            className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 rounded-lg flex items-center disabled:opacity-50"
          >
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("Posted")}
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg flex items-center disabled:opacity-50"
          >
            <CheckCircle2 size={16} className="mr-2" /> Save & Post
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8 pb-24">
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {(["party", "petty"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => !isEdit && setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold ${
                activeTab === tab ? "bg-maroon-800 text-white shadow-md" : "text-slate-500"
              }`}
            >
              {tab === "party" ? "Party Payment" : "Petty Payment"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8 order-2 md:order-1">
            <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <FileText size={18} /> Payment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Voucher No</label>
                  <input value={formData.voucherNo} disabled className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Cash Account *</label>
                  <select
                    value={formData.cashAccountId}
                    onChange={(e) => setFormData({ ...formData, cashAccountId: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  >
                    <option value="">Select cash account...</option>
                    {cashAccounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.code} - {a.title || a.name || "Cash Account"} (Rs. {(a.openingBalance || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {activeTab === "party" && (
                  <div className="md:col-span-2">
                    <PartyLookupSelect
                      parties={availableParties}
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
                      label="Pay To (Customer / Vendor)"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Narration *</label>
                  <input
                    value={formData.narration}
                    onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                    placeholder="Payment description"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Reference</label>
                  <input
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Job</label>
                  <select
                    value={formData.jobId}
                    onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  >
                    <option value="">-- Select Job --</option>
                    {(jobs || []).map((j) => (
                      <option key={j._id} value={j._id}>{j.title || j.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {activeTab === "petty" && (
              <div className="space-y-6">
                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                  {(["general", "customer", "vendor"] as const).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setPettySubTab(sub);
                        if (sub === "general") setFormData((p) => ({ ...p, partyId: "" }));
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                        pettySubTab === sub ? "bg-maroon-800 text-white" : "text-slate-500"
                      }`}
                    >
                      {sub === "general" ? "General (Contra)" : sub === "customer" ? "Customer" : "Vendor"}
                    </button>
                  ))}
                </div>

                {pettySubTab === "general" ? (
                  <section className="bg-white border rounded-2xl overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
                        <Landmark size={16} /> Contra Accounts
                      </h3>
                      <button type="button" onClick={addContraLine} className="text-xs font-bold text-maroon-800 flex items-center gap-1">
                        <Plus size={14} /> Add Line
                      </button>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Account</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Description</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Amount</th>
                          <th className="w-12" />
                        </tr>
                      </thead>
                      <tbody>
                        {contraLines.map((line, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2">
                              <select
                                value={String(line.accountId || "")}
                                onChange={(e) => updateContraLine(idx, "accountId", e.target.value)}
                                className="w-full px-2 py-2 border rounded-lg text-sm font-bold"
                              >
                                <option value="">Select account</option>
                                {availableAccounts
                                  .filter(a => !["1000", "1010", "1200", "1300", "2000", "3000", "4000"].includes(a.code || ""))
                                  .map((a) => (
                                    <option key={a._id} value={a._id}>{a.title || a.name || "Account"} ({a.code})</option>
                                  ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                value={String(line.description || "")}
                                onChange={(e) => updateContraLine(idx, "description", e.target.value)}
                                className="w-full px-2 py-2 border rounded-lg text-sm"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={Number(line.amount) || ""}
                                onChange={(e) => updateContraLine(idx, "amount", parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-2 border rounded-lg text-sm font-black text-right"
                              />
                            </td>
                            <td className="p-2">
                              <button type="button" onClick={() => removeContraLine(idx)} className="text-rose-500">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                ) : (
                  <section className="bg-white border rounded-2xl p-6 space-y-4">
                    <PartyLookupSelect
                      parties={pettySubTab === "customer" ? customers : vendors}
                      value={formData.partyId}
                      partyType={pettySubTab === "customer" ? "Customer" : "Vendor"}
                      onPartyTypeChange={() => {}}
                      showTypeToggle={false}
                      onChange={(id, party) => {
                        setFormData((p) => ({ ...p, partyId: id }));
                        setPreviewParty(party);
                      }}
                      onPreview={setPreviewParty}
                      label={pettySubTab === "customer" ? "Customer" : "Vendor"}
                      required
                    />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Amount (PKR) *</label>
                      <input
                        type="number"
                        value={formData.amount || ""}
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border rounded-xl text-sm font-black text-right"
                      />
                    </div>
                  </section>
                )}
              </div>
            )}

            <section className="bg-white border rounded-2xl p-8">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Wallet size={18} className="text-emerald-600" /> Amount Details
              </h2>
              {(activeTab === "party" || (activeTab === "petty" && pettySubTab !== "general")) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Total Amount *</label>
                    <input
                      type="number"
                      value={formData.amount || ""}
                      onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border rounded-xl text-sm font-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">WHT Rate %</label>
                    <input
                      type="number"
                      value={formData.whtRate}
                      onChange={(e) => handleWhtRateChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border rounded-xl text-sm font-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">WHT Amount</label>
                    <input type="number" value={whtAmount} disabled className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm font-black" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Net Paid</label>
                    <input type="number" value={netPaid} disabled className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm font-black" />
                  </div>
                </div>
              )}
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-sm font-black text-maroon-800 uppercase">Net Amount to Pay (PKR)</span>
                <span className="text-2xl font-black text-maroon-800">{netPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </section>

            <section className="bg-slate-50 rounded-2xl p-6 border">
              <label className="text-[10px] font-black text-slate-400 uppercase">Internal Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full mt-2 px-4 py-3 border rounded-xl text-sm"
              />
            </section>
          </div>

          <div className="md:col-span-1 order-1 md:order-2">
            <PartyDetailsCard
              party={selectedParty}
              account={selectedCashAccount}
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
