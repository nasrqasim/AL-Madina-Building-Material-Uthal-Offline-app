"use client";

import { useState, useEffect, useMemo } from "react";
import ItemSearchInput from "@/components/erp/ui/ItemSearchInput";
import ItemDetailsPanel from "@/components/erp/ui/ItemDetailsPanel";
import {
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  ShoppingCart,
  MapPin,
  User,
  Calendar,
  FileText,
  CreditCard,
  Building
} from "lucide-react";

interface POItem {
  id: string;
  itemId: string;
  itemCode?: string;
  description: string;
  cartons: number;
  gallons: number;
  liters: number;
  unitPrice: number;
  discPercent: number;
  isTaxable: boolean;
  taxPercent: number;
  total: number;
}

interface PurchaseOrderFormProps {
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

export default function PurchaseOrderForm({ onClose, onSave, initialData }: PurchaseOrderFormProps) {
  const [items, setItems] = useState<POItem[]>(initialData?.lines?.map((l: any, i: number) => ({
    id: i.toString(),
    itemId: l.itemId?._id || l.itemId || "",
    itemCode: l.itemId?.code || "",
    description: l.description || "",
    cartons: l.cartons || l.qty || 0,
    gallons: l.gallons || 0,
    liters: l.liters || 0,
    unitPrice: l.rate || 0,
    discPercent: l.discountPercent || 0,
    isTaxable: (l.taxPercent || 0) > 0,
    taxPercent: l.taxPercent || 0,
    total: l.netAmount || 0
  })) || [
    { id: "1", itemId: "", itemCode: "", description: "", cartons: 1, gallons: 4, liters: 16, unitPrice: 0, discPercent: 0, isTaxable: false, taxPercent: 0, total: 0 }
  ]);
  
  const [formData, setFormData] = useState({
    poNumber: initialData?.docNo || "Auto-generated",
    poDate: initialData?.date || new Date().toISOString().split("T")[0],
    status: initialData?.status || "Draft",
    currency: initialData?.currency || "PKR",
    vendorId: initialData?.vendor || "",
    referenceNo: initialData?.reference || "",
    deliveryDate: initialData?.deliveryDate || "",
    paymentTerms: initialData?.paymentTerms || "",
    deliveryAddress: initialData?.deliveryAddress || "",
    employeeId: initialData?.employeeId || "",
    jobId: initialData?.jobId || "",
    locationId: initialData?.locationId || "",
    amountPaid: initialData?.amountReceived || 0,
    paymentMethod: initialData?.paymentMethod || "Cash",
    notes: initialData?.notes || "",
    termsAndConditions: initialData?.termsAndConditions || ""
  });

  const [selectedLineId, setSelectedLineId] = useState<string | null>(items[0]?.id || "1");
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);



  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items");
      const json = await res.json();
      if (json.ok) setAvailableItems(json.data);
    } catch (e) { console.error(e); }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/parties");
      const json = await res.json();
      if (json.ok) setVendors(json.data.filter((p: any) => p.type === "Vendor"));
    } catch (e) { console.error(e); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (json.ok) setEmployees(json.data);
    } catch (e) { console.error(e); }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const json = await res.json();
      if (json.ok) setJobs(json.data);
    } catch (e) { console.error(e); }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      const json = await res.json();
      if (json.ok) setLocations(json.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchItems();
    fetchVendors();
    fetchEmployees();
    fetchJobs();
    fetchLocations();
  }, []);

  const addItem = () => {
    const newId = Date.now().toString();
    setItems([...items, { id: newId, itemId: "", itemCode: "", description: "", cartons: 1, gallons: 4, liters: 16, unitPrice: 0, discPercent: 0, isTaxable: false, taxPercent: 0, total: 0 }]);
    setSelectedLineId(newId);
  };
  
  const removeItem = (id: string) => {
    const filtered = items.filter(i => i.id !== id);
    setItems(filtered);
    if (selectedLineId === id && filtered.length > 0) {
      setSelectedLineId(filtered[0].id);
    }
  };
  
  const selectedItemDetails = useMemo(() => {
    const line = items.find(l => l.id === selectedLineId);
    if (!line || !line.itemId) return null;
    return availableItems.find(i => i._id === line.itemId);
  }, [selectedLineId, items, availableItems]);

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

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };
        
        if (field === "cartons" || field === "gallons" || field === "liters") {
          const selItem = availableItems.find(ai => ai._id === i.itemId);
          const isFltr = selItem?.name?.toLowerCase().includes("filter") || selItem?.name?.toLowerCase().includes("fliter");
          const galsInCtn = isFltr ? 1 : (selItem?.gallonsInCtn || 4);
          const ltrsInCtn = isFltr ? 1 : (selItem?.litersInCtn || 16);
          if (field === "cartons") {
            updated.gallons = value * galsInCtn;
            updated.liters = value * ltrsInCtn;
          } else if (field === "gallons") {
            updated.cartons = galsInCtn > 0 ? value / galsInCtn : 0;
            updated.liters = galsInCtn > 0 ? (value / galsInCtn) * ltrsInCtn : 0;
          } else if (field === "liters") {
            updated.cartons = ltrsInCtn > 0 ? value / ltrsInCtn : 0;
            updated.gallons = ltrsInCtn > 0 ? (value / ltrsInCtn) * galsInCtn : 0;
          }
        }

        if (field === "itemId") {
          const selected = availableItems.find(ai => ai._id === value);
          if (selected) {
            updated.itemCode = selected.code;
            updated.description = selected.name;
            updated.unitPrice = selected.purchaseRate || selected.rate || 0;
            const isFilter = selected.name?.toLowerCase().includes("filter") || selected.name?.toLowerCase().includes("fliter");
            const gallonsInCtn = isFilter ? 1 : (selected.gallonsInCtn || 4);
            const litersInCtn = isFilter ? 1 : (selected.litersInCtn || 16);
            updated.cartons = 1;
            updated.gallons = gallonsInCtn;
            updated.liters = litersInCtn;
          }
        }

        const base = (updated.cartons || 0) * (updated.unitPrice || 0);
        const afterDisc = base - (base * (updated.discPercent || 0) / 100);
        const tax = updated.isTaxable ? (afterDisc * (updated.taxPercent || 0) / 100) : 0;
        updated.total = afterDisc + tax;
        return updated;
      }
      return i;
    }));
  };

  const subTotal = items.reduce((sum, i) => sum + ((i.cartons || 0) * (i.unitPrice || 0)), 0);
  const totalDiscount = items.reduce((sum, i) => sum + (((i.cartons || 0) * (i.unitPrice || 0)) * (i.discPercent || 0) / 100), 0);
  const totalTax = items.reduce((sum, i) => sum + (i.isTaxable ? (((i.cartons || 0) * (i.unitPrice || 0) - ((i.cartons || 0) * (i.unitPrice || 0) * (i.discPercent || 0) / 100)) * (i.taxPercent || 0) / 100) : 0), 0);
  const grandTotal = subTotal - totalDiscount + totalTax;

  const handleSave = async (status: "Draft" | "Approved") => {
    const isEdit = initialData && initialData._id;
    const balance = grandTotal - formData.amountPaid;
    const payload = {
      invoiceNo: formData.poNumber === "Auto-generated" ? `PO-${Date.now().toString().slice(-6)}` : formData.poNumber,
      type: "purchase_order",
      date: formData.poDate,
      partyId: formData.vendorId,
      reference: formData.referenceNo,
      lines: items.map(i => ({
        itemId: i.itemId,
        description: i.description,
        cartons: i.cartons,
        gallons: i.gallons,
        liters: i.liters,
        qty: i.cartons,
        rate: i.unitPrice,
        discountPercent: i.discPercent,
        taxPercent: i.taxPercent,
        netAmount: i.total
      })),
      subTotal,
      discountAmount: totalDiscount,
      taxAmount: totalTax,
      totalAmount: grandTotal,
      balance,
      amountReceived: formData.amountPaid,
      paymentMethod: formData.paymentMethod,
      status: balance <= 0 && status === "Approved" ? "paid" : status.toLowerCase(),
      employeeId: formData.employeeId || null,
      jobId: formData.jobId || null,
      locationId: formData.locationId || null,
      notes: formData.notes
    };

    try {
      const url = isEdit ? `/api/invoices/${initialData._id}` : "/api/invoices";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Purchase Order ${isEdit ? "updated" : "saved"} successfully!`);
        onClose();
      } else {
        const json = await res.json();
        alert("Error: " + (json.error || json.message));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save purchase order");
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen font-sans">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Purchase Order</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Draft")} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("Approved")} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
            <CheckCircle2 size={16} className="mr-2" /> Save & Approve
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Order Details */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Order Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">PO Number</label>
              <input value={formData.poNumber} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">PO Date *</label>
              <input type="date" value={formData.poDate} onChange={(e) => setFormData({...formData, poDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <input value={formData.status} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Currency</label>
              <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="PKR">PKR</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor *</label>
              <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 focus:border-maroon-800 transition-all outline-none">
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>{v.companyName || v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reference No.</label>
              <input placeholder="Vendor quotation ref" value={formData.referenceNo} onChange={(e) => setFormData({...formData, referenceNo: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Delivery Date</label>
              <input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Terms</label>
              <input placeholder="e.g., 30 days" value={formData.paymentTerms} onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Delivery Address</label>
              <input placeholder="Delivery location" value={formData.deliveryAddress} onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
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
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</label>
              <select value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Line Items */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Line Items</h3>
            <button onClick={addItem} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:border-slate-300 shadow-sm">
              <Plus size={14} className="mr-1.5 text-maroon-800" /> Add Row
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
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-28 text-center">Unit Price</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Disc %</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Tax?</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Tax %</th>
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
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedLineId(item.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30 transition-colors group ${selectedLineId === item.id ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                    >
                      <td className="px-8 py-4 text-xs font-bold text-slate-300 text-center">{index + 1}</td>
                      <td className="px-4 py-4">
                        <ItemSearchInput
                          value={item.itemCode || ""}
                          availableItems={availableItems}
                          onSelect={(selected) => {
                            updateItem(item.id, "itemId", selected._id);
                            setSelectedLineId(item.id);
                          }}
                          onChange={(val) => updateItem(item.id, "itemCode", val)}
                          placeholder="Search item..."
                        />
                      </td>
                      <td className="px-8 py-4">
                        <input placeholder="Item description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <input type="number" value={item.cartons} onChange={(e) => updateItem(item.id, "cartons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <input type="number" value={item.gallons} onChange={(e) => updateItem(item.id, "gallons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <input type="number" value={item.liters} onChange={(e) => updateItem(item.id, "liters", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-4 py-4">
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-4 py-4">
                        <input type="number" value={item.discPercent} onChange={(e) => updateItem(item.id, "discPercent", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                      </td>
                      <td className="px-8 py-4 text-center">
                        <input type="checkbox" checked={item.isTaxable} onChange={(e) => updateItem(item.id, "isTaxable", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-maroon-800 focus:ring-maroon-800/20" />
                      </td>
                      <td className="px-4 py-4">
                        <input type="number" value={item.taxPercent} disabled={!item.isTaxable} onChange={(e) => updateItem(item.id, "taxPercent", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all disabled:opacity-20" />
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
            <div className="col-span-12 lg:col-span-3">
              <ItemDetailsPanel item={selectedItemDetails} type="purchase" />
            </div>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white">{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Discount</span>
                <span className="font-bold text-rose-600">-{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Tax</span>
                <span className="font-bold text-slate-900 dark:text-white">+{totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Total (PKR)</span>
                <span className="text-3xl font-black text-maroon-800 tracking-tighter">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section Payment Details */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Payment Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Method</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:border-maroon-800 transition-all outline-none">
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Credit">Credit (On Account)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount Paid (PKR)</label>
              <input type="number" value={formData.amountPaid} onChange={(e) => setFormData({...formData, amountPaid: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:border-maroon-800 transition-all outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remaining Balance (PKR)</label>
              <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-black text-maroon-800">
                {(grandTotal - formData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Additional Information */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Notes</label>
            <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes for team..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Terms & Conditions</label>
            <textarea rows={4} value={formData.termsAndConditions} onChange={(e) => setFormData({...formData, termsAndConditions: e.target.value})} placeholder="Standard terms for vendor..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
          </div>
        </section>
      </div>
    </div>
  );
}
