"use client";

import { useState, useEffect, useMemo } from "react";
import ItemSearchInput from "@/components/erp/ui/ItemSearchInput";
import ItemDetailsPanel from "@/components/erp/ui/ItemDetailsPanel";
import {
  buildPersistedLines,
  mapImportLinesToRows,
  resolveRefId,
  toIdString,
  type ImportLineRow,
} from "@/lib/purchaseFormUtils";
import { mapRecordToLineRows, resolvePartyIdWithLookup } from "@/lib/purchaseFormHydrate";
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
  Globe,
  Ship,
  Truck,
  Anchor,
  Calculator,
  FileText,
  Link2,
  Building,
  MapPin,
  Currency
} from "lucide-react";

interface ImportCharge {
  id: string;
  name: string;
  amount: number;
  isCapitalized: boolean;
}

interface ImportPurchaseInvoiceFormProps {
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

function buildImportFormState(
  initialData?: Record<string, unknown> | null,
  vendors: Array<{ _id: string; companyName?: string; name?: string }> = []
) {
  return {
    docDate: initialData?.date
      ? new Date(String(initialData.date)).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    vendorId: resolvePartyIdWithLookup(initialData, vendors),
    vendorInvoiceNo: String(initialData?.vendorInvNo || initialData?.vendorInvoiceNo || ""),
    vendorInvoiceDate: initialData?.vendorInvoiceDate
      ? new Date(String(initialData.vendorInvoiceDate)).toISOString().split("T")[0]
      : "",
    currency: String(initialData?.currency || "USD"),
    exchangeRate: Number(initialData?.exchangeRate || 278.5),
    gdNumber: String(initialData?.gdNo || ""),
    gdDate: initialData?.gdDate ? new Date(String(initialData.gdDate)).toISOString().split("T")[0] : "",
    blAwbNo: String(initialData?.blAwbNo || ""),
    containerNo: String(initialData?.containerNo || ""),
    shipmentMode: String(initialData?.shipmentMode || "Sea"),
    incoterms: String(initialData?.incoterms || "CIF"),
    countryOfOrigin: String(initialData?.countryOfOrigin || ""),
    portOfLoading: String(initialData?.portOfLoading || ""),
    portOfDischarge: String(initialData?.portOfDischarge || ""),
    estimatedArrival: initialData?.estimatedArrival
      ? new Date(String(initialData.estimatedArrival)).toISOString().split("T")[0]
      : "",
    actualArrival: initialData?.actualArrival
      ? new Date(String(initialData.actualArrival)).toISOString().split("T")[0]
      : "",
    locationId: resolveRefId(initialData, "locationId"),
    employeeId: resolveRefId(initialData, "employeeId"),
    jobId: resolveRefId(initialData, "jobId"),
    notes: String(initialData?.notes || ""),
    internalNotes: String(initialData?.internalNotes || ""),
  };
}

export default function ImportPurchaseInvoiceForm({ onClose, onSave, initialData }: ImportPurchaseInvoiceFormProps) {
  const isEdit = Boolean(initialData?._id);
  const mapToImportRows = (data?: Record<string, unknown> | null): ImportLineRow[] => {
    const fromApi = mapImportLinesToRows(data);
    const src = data?.lines ?? data?.items;
    if (Array.isArray(src) && src.length > 0) return fromApi;
    const legacy = mapRecordToLineRows(data);
    const rate = Number(data?.exchangeRate || 278.5);
    return legacy.map((r) => ({
      ...r,
      unitPriceUSD: r.unitPrice,
      foreignTotal: r.total,
      pkrTotal: r.total * rate,
    })) as ImportLineRow[];
  };

  const [items, setItems] = useState<ImportLineRow[]>(() => mapToImportRows(initialData));
  const [charges, setCharges] = useState<ImportCharge[]>(initialData?.charges || []);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(items[0]?.id || "1");
  const [formData, setFormData] = useState(() => buildImportFormState(initialData, []));

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
    setFormData(buildImportFormState(initialData, vendors));
    setItems(mapToImportRows(initialData));
  }, [isEdit, invoiceId, vendors.length]);

  useEffect(() => {
    setItems(prev => prev.map(i => ({
      ...i,
      pkrTotal: i.foreignTotal * (formData.exchangeRate || 1)
    })));
  }, [formData.exchangeRate]);

  const selectedItemDetails = useMemo(() => {
    const activeLine = items.find(i => i.id === selectedLineId);
    if (!activeLine || !activeLine.itemId) return null;
    return availableItems.find(ai => ai._id === activeLine.itemId) || null;
  }, [selectedLineId, items, availableItems]);

  const addItem = () => {
    const newId = Date.now().toString();
    setItems([...items, { id: newId, itemId: "", itemCode: "", description: "", cartons: 1, gallons: 4, liters: 16, unitPrice: 0, discPercent: 0, total: 0, unitPriceUSD: 0, foreignTotal: 0, pkrTotal: 0 }]);
    setSelectedLineId(newId);
  };
  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    if (selectedLineId === id) setSelectedLineId(null);
  };
  
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

  const updateItem = (id: string, field: keyof ImportLineRow, value: unknown) => {
    setItems((prev) => prev.map((i) => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };
        
        if (field === "itemId") {
          const selected = availableItems.find((ai) => ai._id === value);
          if (selected) {
            updated.itemCode = selected.code;
            updated.description = selected.name;
            updated = defaultPurchaseUnitsForItem(updated, selected);
          }
        }

        if (field === "cartons" || field === "gallons" || field === "liters") {
          const selItem = resolveCatalogItem(availableItems, updated);
          updated = applyPurchaseUnitFieldUpdate(updated, field, value as number | string, selItem);
        }

        updated.foreignTotal = (Number(updated.cartons) || 0) * (updated.unitPriceUSD || 0);
        updated.pkrTotal = updated.foreignTotal * (formData.exchangeRate || 1);
        return updated;
      }
      return i;
    }));
  };

  const addCharge = () => setCharges([...charges, { id: Date.now().toString(), name: "", amount: 0, isCapitalized: true }]);
  const removeCharge = (id: string) => setCharges(charges.filter(c => c.id !== id));
  const updateCharge = (id: string, field: keyof ImportCharge, value: any) => {
    setCharges(charges.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const foreignSubtotal = items.reduce((sum, i) => sum + ((i.cartons || 0) * (i.unitPriceUSD || 0)), 0);
  const pkrSubtotal = foreignSubtotal * formData.exchangeRate;
  const capitalizedCharges = charges.filter(c => c.isCapitalized).reduce((sum, c) => sum + c.amount, 0);
  const nonCapitalizedCharges = charges.filter(c => !c.isCapitalized).reduce((sum, c) => sum + c.amount, 0);
  const grandTotalOwed = pkrSubtotal + capitalizedCharges + nonCapitalizedCharges;

  const handleSave = async (status: "Draft" | "Posted") => {
    const lines: Record<string, unknown>[] = [];
    for (const row of items) {
      const rowsForPersist = [{ ...row, unitPrice: row.unitPriceUSD, total: row.pkrTotal }];
      const persisted = await buildPersistedLines(rowsForPersist, availableItems);
      if (!persisted.length) continue;
      lines.push({
        ...persisted[0],
        rate: row.unitPriceUSD,
        ratePerCarton: row.unitPriceUSD,
        foreignNetAmount: row.foreignTotal,
        netAmount: row.pkrTotal,
      });
    }

    const payload = {
      invoiceNo: formData.vendorInvoiceNo || `IMP-${Date.now().toString().slice(-6)}`,
      type: "import_purchase",
      date: formData.docDate,
      partyId: formData.vendorId || null,
      vendorInvNo: formData.vendorInvoiceNo,
      vendorInvoiceDate: formData.vendorInvoiceDate || undefined,
      currency: formData.currency,
      exchangeRate: formData.exchangeRate,
      gdNo: formData.gdNumber,
      blAwbNo: formData.blAwbNo,
      totalAmount: grandTotalOwed || Number(isEdit ? initialData?.totalAmount : 0),
      status: status.toLowerCase(),
      employeeId: formData.employeeId || null,
      jobId: formData.jobId || null,
      locationId: formData.locationId || null,
      lines,
      notes: formData.notes,
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
        alert(`Import Purchase Invoice ${isEdit ? "updated" : "saved"} successfully!`);
        onSave?.(json.data);
        onClose();
      } else {
        alert("Error: " + (json.message || json.error || "Save failed"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save import invoice");
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
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Import Purchase Invoice</h1>
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
        {/* Section 1: Document & Shipment */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Document & Shipment</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc Date *</label>
              <input type="date" value={formData.docDate} onChange={(e) => setFormData({...formData, docDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Foreign Vendor *</label>
              <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>{v.companyName || v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Currency *</label>
              <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ex. Rate (PKR) *</label>
              <input type="number" step="0.01" value={formData.exchangeRate} onChange={(e) => setFormData({...formData, exchangeRate: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">GD Number</label>
              <input placeholder="Goods Declaration #" value={formData.gdNumber} onChange={(e) => setFormData({...formData, gdNumber: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">BL / AWB No</label>
              <input placeholder="Bill of Lading #" value={formData.blAwbNo} onChange={(e) => setFormData({...formData, blAwbNo: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Container No</label>
              <input placeholder="Container #" value={formData.containerNo} onChange={(e) => setFormData({...formData, containerNo: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shipment Mode</label>
              <select value={formData.shipmentMode} onChange={(e) => setFormData({...formData, shipmentMode: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="Sea">Sea</option>
                <option value="Air">Air</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</label>
              <select value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</label>
              <select value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job</label>
              <select value={formData.jobId} onChange={(e) => setFormData({...formData, jobId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Job --</option>
                {jobs.map(job => (
                  <option key={job._id} value={job._id}>{job.title || job.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Items (in Foreign Currency) */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Imported Items ({formData.currency})</h3>
            <button onClick={addItem} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-maroon-800" /> Add Line
            </button>
          </div>
          <div className="grid grid-cols-12 gap-6 p-8">
            <div className="col-span-12 lg:col-span-9 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-40">Item Code</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Description</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ctns</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Gals</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ltrs</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-center">Unit Price ({formData.currency})</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">FC Total</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">PKR Total</th>
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
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedLineId(item.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30 transition-colors group cursor-pointer ${selectedLineId === item.id ? "bg-slate-100/80 dark:bg-slate-800/80" : ""}`}
                    >
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
                        <input placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} onFocus={() => setSelectedLineId(item.id)} className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={item.cartons}
                          onChange={(e) => updateItem(item.id, "cartons", e.target.value === "" ? "" : Number(e.target.value))}
                          onBlur={(e) => updateItem(item.id, "cartons", Number(e.target.value) || 0)}
                          onFocus={() => setSelectedLineId(item.id)}
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
                          onFocus={() => setSelectedLineId(item.id)}
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
                          onFocus={() => setSelectedLineId(item.id)}
                          className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input type="number" value={item.unitPriceUSD} onChange={(e) => updateItem(item.id, "unitPriceUSD", parseFloat(e.target.value) || 0)} onFocus={() => setSelectedLineId(item.id)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-sm font-black text-slate-400 dark:text-slate-500">{item.foreignTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.pkrTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
            <div className="col-span-12 lg:col-span-3">
              <ItemDetailsPanel item={selectedItemDetails} type="purchase" />
            </div>
          </div>
        </section>

        {/* Section 3: Import Charges (Capitalized) */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Capitalized Charges (Duties, Freight, Taxes)</h3>
            <button onClick={addCharge} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-blue-600" /> Add Charge
            </button>
          </div>
          <div className="p-8 space-y-4">
            {charges.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-bold italic text-xs bg-slate-50 dark:bg-slate-800/50/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                No import charges added yet. Click &quot;Add Charge&quot; to include Customs Duty, Sales Tax, Freight, or Clearing Fees.
              </div>
            ) : (
              <div className="space-y-4">
                {charges.map((charge) => (
                  <div key={charge.id} className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group transition-all">
                    <input placeholder="Charge Name (e.g. Customs Duty)" value={charge.name} onChange={(e) => updateCharge(charge.id, "name", e.target.value)} className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-blue-600 text-sm font-bold outline-none py-1" />
                    <div className="flex items-center gap-4">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Amount (PKR)</label>
                      <input type="number" placeholder="0.00" value={charge.amount} onChange={(e) => updateCharge(charge.id, "amount", parseFloat(e.target.value) || 0)} className="w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-right px-4 py-2 focus:border-blue-600 outline-none" />
                    </div>
                    <button onClick={() => removeCharge(charge.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Totals Section */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks / GD Details</label>
              <textarea rows={6} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes regarding clearance, gd process or shipment quality..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
            </div>
          </div>
          
          <div className="w-full md:w-[450px] bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-maroon-800/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Foreign Subtotal</span>
                <span className="text-lg font-black">{formData.currency} {foreignSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 dark:text-slate-500 border-t border-white/5 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest">PKR Subtotal</span>
                <span className="text-sm font-black text-slate-300">Rs. {pkrSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-widest">+ Import Charges</span>
                <span className="text-sm font-black text-slate-300">Rs. {capitalizedCharges.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/20 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <Calculator size={18} className="text-maroon-500" />
                <p className="text-[10px] font-black text-maroon-500 uppercase tracking-[0.2em]">Grand Total Capitalized (PKR)</p>
              </div>
              <h3 className="text-5xl font-black text-white tracking-tighter">
                {grandTotalOwed.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest italic">Inventory unit cost will be adjusted based on total capitalized value.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
