"use client";

import { useState, useEffect, useMemo } from "react";
import ItemSearchInput from "@/components/erp/ui/ItemSearchInput";
import {
  buildPersistedLines,
  resolveRefId,
  toIdString,
  type PurchaseLineRow,
} from "@/lib/purchaseFormUtils";
import {
  hydratePurchaseForm,
  mapRecordToLineRows,
  resolvePartyIdWithLookup,
} from "@/lib/purchaseFormHydrate";
import {
  applyPurchaseUnitFieldUpdate,
  defaultPurchaseUnitsForItem,
  resolveCatalogItem,
} from "@/lib/itemUnits";
import {
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  RotateCcw,
  Wallet,
  Receipt,
  User,
  Calendar,
  FileText,
  Link2,
  Building,
  MapPin
} from "lucide-react";

interface NonTaxPurchaseReturnFormProps {
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

function buildReturnFormState(
  initialData?: Record<string, unknown> | null,
  vendors: Array<{ _id: string; companyName?: string; name?: string }> = []
) {
  const linkedId =
    toIdString(initialData?.linkedInvoiceId) || String(initialData?.reference || "");

  return {
    returnNumber: String(initialData?.invoiceNo || "Auto-generated"),
    returnDate: initialData?.date
      ? new Date(String(initialData.date)).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: String(initialData?.status || "Draft"),
    vendorId: resolvePartyIdWithLookup(initialData, vendors),
    nonTaxPurchaseInvoiceId: linkedId,
    reason: String(initialData?.reason || initialData?.notes || ""),
    whtRate: Number(initialData?.whtRate || 0),
    employeeId: resolveRefId(initialData, "employeeId"),
    jobId: resolveRefId(initialData, "jobId"),
    locationId: resolveRefId(initialData, "locationId"),
    refundAmount: Number(initialData?.amountReceived || 0),
    refundAccountId: String(initialData?.refundAccountId || ""),
    notes: String(initialData?.notes || ""),
  };
}

export default function NonTaxPurchaseReturnForm({ onClose, onSave, initialData }: NonTaxPurchaseReturnFormProps) {
  const isEdit = Boolean(initialData?._id);
  const [items, setItems] = useState<PurchaseLineRow[]>(() => mapRecordToLineRows(initialData));
  const [formData, setFormData] = useState(() => buildReturnFormState(initialData, []));

  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [itemsRes, partiesRes, employeesRes, jobsRes, locationsRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/parties"),
        fetch("/api/employees"),
        fetch("/api/jobs"),
        fetch("/api/locations")
      ]);
      const [itemsJson, partiesJson, employeesJson, jobsJson, locationsJson] = await Promise.all([
        itemsRes.json(),
        partiesRes.json(),
        employeesRes.json(),
        jobsRes.json(),
        locationsRes.json()
      ]);
      
      if (itemsJson.ok) setAvailableItems(itemsJson.data);
      if (partiesJson.ok) setVendors(partiesJson.data.filter((p: any) => p.type === "Vendor"));
      if (employeesJson.ok) setEmployees(employeesJson.data);
      if (jobsJson.ok) setJobs(jobsJson.data);
      if (locationsJson.ok) setLocations(locationsJson.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const invoiceId = toIdString(initialData?._id);

  useEffect(() => {
    if (!isEdit || !invoiceId || !initialData) return;
    hydratePurchaseForm(initialData, vendors, buildReturnFormState, setFormData, setItems);
  }, [isEdit, invoiceId, vendors.length]);

  const addItem = () => setItems([...items, { id: Date.now().toString(), itemId: "", itemCode: "", description: "", cartons: 0, gallons: 0, liters: 0, unitPrice: 0, discPercent: 0, total: 0 }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const [showItemSearch, setShowItemSearch] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleItemKeyDown = (e: React.KeyboardEvent, lineId: string, filteredItems: any[]) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[activeIndex]) {
        updateItem(lineId, "itemId", filteredItems[activeIndex]._id);
        setShowItemSearch(null);
      }
    } else if (e.key === "Escape") {
      setShowItemSearch(null);
    }
  };

  const updateItem = (id: string, field: keyof PurchaseLineRow, value: unknown) => {
    setItems((prev) => prev.map((i) => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };


        if (field === "itemId") {
          const selected = availableItems.find((ai) => ai._id === value);
          if (selected) {
            updated.itemCode = selected.code;
            updated.description = selected.name;
            updated.unitPrice = selected.purchaseRate || selected.rate || 0;
            updated = defaultPurchaseUnitsForItem(updated, selected);
          }
        }

        if (field === "cartons" || field === "gallons" || field === "liters") {
          const selected = resolveCatalogItem(availableItems, updated);
          updated = applyPurchaseUnitFieldUpdate(updated, field, value as number | string, selected);
        }

        updated.total = (Number(updated.cartons) || 0) * (updated.unitPrice || 0);
        return updated;
      }
      return i;
    }));
  };

  const subTotal = items.reduce((sum, i) => sum + ((i.cartons || 0) * (i.unitPrice || 0)), 0);

  const handleSave = async (status: "Draft" | "Posted") => {
    const lines = await buildPersistedLines(items, availableItems);
    const totalAmount =
      subTotal > 0 ? subTotal : Number(isEdit ? initialData?.totalAmount : 0);

    const payload = {
      invoiceNo:
        formData.returnNumber === "Auto-generated"
          ? `NTPR-${Date.now().toString().slice(-6)}`
          : formData.returnNumber,
      type: "non_tax_purchase_return",
      date: formData.returnDate,
      partyId: formData.vendorId || null,
      reference: formData.nonTaxPurchaseInvoiceId,
      linkedInvoiceId: formData.nonTaxPurchaseInvoiceId || null,
      totalAmount,
      amountReceived: formData.refundAmount,
      status: status.toLowerCase(),
      employeeId: formData.employeeId || null,
      jobId: formData.jobId || null,
      locationId: formData.locationId || null,
      lines,
      notes: formData.reason || formData.notes,
    };

    try {
      const docId = toIdString(initialData?._id);
      const url = isEdit && docId ? `/api/invoices/${docId}` : "/api/invoices";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        alert(`Non-Tax Purchase Return ${isEdit ? "updated" : "saved"} successfully!`);
        onSave?.(json.data);
        onClose();
      } else {
        alert("Error: " + (json.message || json.error || "Save failed"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save return");
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen font-sans">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Non-Tax Purchase Return</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Draft")} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("Posted")} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
            <CheckCircle2 size={16} className="mr-2" /> Save & Post
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Return Details */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Return Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Return Number</label>
              <input value={formData.returnNumber} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Return Date *</label>
              <input type="date" value={formData.returnDate} onChange={(e) => setFormData({...formData, returnDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor *</label>
              <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>{v.companyName || v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Ref *</label>
              <select value={formData.nonTaxPurchaseInvoiceId} onChange={(e) => setFormData({...formData, nonTaxPurchaseInvoiceId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Invoice --</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason for Return *</label>
              <input placeholder="e.g. Quality issues, damaged on arrival..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location *</label>
              <select value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</label>
              <select value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job</label>
              <select value={formData.jobId} onChange={(e) => setFormData({...formData, jobId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Select Job --</option>
                {jobs.map(job => (
                  <option key={job._id} value={job._id}>{job.title || job.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Line Items */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Returned Items</h3>
            <button onClick={addItem} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-maroon-800" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-40">Item Code</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ctns</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Gals</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ltrs</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-center">Unit Price</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Total</th>
                  <th className="px-8 py-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item, index) => {
                  const query = (item.itemCode || "").toLowerCase();
                  const filteredItems = availableItems.filter(i => 
                    i.code.toLowerCase().includes(query) || i.name.toLowerCase().includes(query)
                  ).sort((a, b) => {
                    const aStart = a.name.toLowerCase().startsWith(query) || a.code.toLowerCase().startsWith(query);
                    const bStart = b.name.toLowerCase().startsWith(query) || b.code.toLowerCase().startsWith(query);
                    if (aStart && !bStart) return -1;
                    if (!aStart && bStart) return 1;
                    return 0;
                  });

                  return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30 transition-colors group">
                    <td className="px-8 py-4 text-xs font-bold text-slate-300 text-center">{index + 1}</td>
                    <td className="px-4 py-4">
                      <ItemSearchInput
                        value={item.itemCode || ""}
                        availableItems={availableItems}
                        onSelect={(selected) => updateItem(item.id, "itemId", selected._id)}
                        onChange={(val) => updateItem(item.id, "itemCode", val)}
                        placeholder="Search item..."
                      />
                    </td>
                    <td className="px-8 py-4">
                      <input placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.cartons}
                        onChange={(e) => updateItem(item.id, "cartons", e.target.value === "" ? "" : Number(e.target.value))}
                        onBlur={(e) => updateItem(item.id, "cartons", Number(e.target.value) || 0)}
                        className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all"
                      />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.gallons}
                        onChange={(e) => updateItem(item.id, "gallons", e.target.value === "" ? "" : Number(e.target.value))}
                        onBlur={(e) => updateItem(item.id, "gallons", Number(e.target.value) || 0)}
                        className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all"
                      />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.liters}
                        onChange={(e) => updateItem(item.id, "liters", e.target.value === "" ? "" : Number(e.target.value))}
                        onBlur={(e) => updateItem(item.id, "liters", Number(e.target.value) || 0)}
                        className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all text-maroon-800" />
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Total Return Value (PKR)</span>
                <span className="text-3xl font-black text-maroon-800 tracking-tighter">{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Refund Details */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Refund Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Refund Amount</label>
              <input type="number" value={formData.refundAmount} onChange={(e) => setFormData({...formData, refundAmount: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:border-maroon-800 transition-all outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Refund Account</label>
              <select value={formData.refundAccountId} onChange={(e) => setFormData({...formData, refundAccountId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 transition-all outline-none">
                <option value="">-- Select Account --</option>
                <option value="cash">Cash in Hand</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 4: Additional Information */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Remarks</label>
          <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Notes for audit or inspection..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
        </section>
      </div>
    </div>
  );
}
