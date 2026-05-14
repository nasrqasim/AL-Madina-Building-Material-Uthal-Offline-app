"use client";

import { useState, useEffect } from "react";
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

interface ItemUSD {
  id: string;
  itemId: string;
  itemCode?: string;
  description: string;
  cartons: number;
  gallons: number;
  liters: number;
  unitPriceUSD: number;
  foreignTotal: number;
  pkrTotal: number;
}

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

export default function ImportPurchaseInvoiceForm({ onClose, onSave, initialData }: ImportPurchaseInvoiceFormProps) {
  const [items, setItems] = useState<ItemUSD[]>(initialData?.items?.map((l: any, i: number) => ({
    id: i.toString(),
    itemId: l.itemId?._id || l.itemId || "",
    itemCode: l.itemId?.code || "",
    description: l.description || "",
    cartons: l.cartons || l.qty || 0,
    gallons: l.gallons || 0,
    liters: l.liters || 0,
    unitPriceUSD: l.rate || 0,
    foreignTotal: l.foreignNetAmount || 0,
    pkrTotal: l.netAmount || 0
  })) || [
    { id: "1", itemId: "", itemCode: "", description: "", cartons: 1, gallons: 4, liters: 16, unitPriceUSD: 0, foreignTotal: 0, pkrTotal: 0 }
  ]);
  
  const [charges, setCharges] = useState<ImportCharge[]>(initialData?.charges || []);
  
  const [formData, setFormData] = useState({
    docDate: initialData?.date || new Date().toISOString().split("T")[0],
    vendorId: initialData?.vendor || "",
    vendorInvoiceNo: initialData?.vendorInvoiceNo || "",
    vendorInvoiceDate: initialData?.vendorInvoiceDate || "",
    currency: initialData?.currency || "USD",
    exchangeRate: initialData?.exchangeRate || 278.50,
    gdNumber: initialData?.gdNo || "",
    gdDate: initialData?.gdDate || "",
    blAwbNo: initialData?.blAwbNo || "",
    containerNo: initialData?.containerNo || "",
    shipmentMode: initialData?.shipmentMode || "Sea",
    incoterms: initialData?.incoterms || "CIF",
    countryOfOrigin: initialData?.countryOfOrigin || "",
    portOfLoading: initialData?.portOfLoading || "",
    portOfDischarge: initialData?.portOfDischarge || "",
    estimatedArrival: initialData?.estimatedArrival || "",
    actualArrival: initialData?.actualArrival || "",
    locationId: initialData?.locationId || "",
    employeeId: initialData?.employeeId || "",
    jobId: initialData?.jobId || "",
    notes: initialData?.notes || "",
    internalNotes: initialData?.internalNotes || ""
  });

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

  const addItem = () => setItems([...items, { id: Date.now().toString(), itemId: "", itemCode: "", description: "", cartons: 1, gallons: 4, liters: 16, unitPriceUSD: 0, foreignTotal: 0, pkrTotal: 0 }]);
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

  const updateItem = (id: string, field: keyof ItemUSD, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };
        
        if (field === "cartons") {
          updated.gallons = value * 4;
          updated.liters = value * 16;
        } else if (field === "gallons") {
          updated.cartons = value / 4;
          updated.liters = value * 4;
        } else if (field === "liters") {
          updated.cartons = value / 16;
          updated.gallons = value / 4;
        }

        if (field === "itemId") {
          const selected = availableItems.find(ai => ai._id === value);
          if (selected) {
            updated.itemCode = selected.code;
            updated.description = selected.name;
          }
        }

        updated.foreignTotal = (updated.cartons || 0) * (updated.unitPriceUSD || 0);
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
    const isEdit = initialData && initialData._id;
    const payload = {
      invoiceNo: formData.vendorInvoiceNo || `IMP-${Date.now().toString().slice(-6)}`,
      type: "import_purchase",
      date: formData.docDate,
      partyId: formData.vendorId,
      vendorInvNo: formData.vendorInvoiceNo,
      currency: formData.currency,
      exchangeRate: formData.exchangeRate,
      gdNo: formData.gdNumber,
      blAwbNo: formData.blAwbNo,
      totalAmount: grandTotalOwed,
      status: status.toLowerCase(),
      employeeId: formData.employeeId || null,
      jobId: formData.jobId || null,
      locationId: formData.locationId || null,
      items: items.map(i => ({
        itemId: i.itemId,
        description: i.description,
        cartons: i.cartons,
        gallons: i.gallons,
        liters: i.liters,
        qty: i.cartons,
        rate: i.unitPriceUSD,
        foreignNetAmount: i.foreignTotal,
        netAmount: i.pkrTotal
      })),
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
        alert(`Import Purchase Invoice ${isEdit ? "updated" : "saved"} successfully!`);
        onClose();
      } else {
        const json = await res.json();
        alert("Error: " + json.error);
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
          <div className="overflow-x-auto">
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
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30 transition-colors group">
                    <td className="px-8 py-4 text-xs font-bold text-slate-300 text-center">{index + 1}</td>
                    <td className="px-4 py-4 relative">
                      <input 
                        type="text" 
                        value={item.itemCode} 
                        placeholder="Search Item..."
                        onChange={e => { updateItem(item.id, "itemCode", e.target.value); setShowItemSearch(item.id); setActiveIndex(0); }} 
                        onFocus={() => { setShowItemSearch(item.id); setActiveIndex(0); }}
                        onKeyDown={(e) => handleItemKeyDown(e, item.id, filteredItems)}
                        className="w-full bg-transparent text-sm font-bold focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" 
                      />
                      {showItemSearch === item.id && (
                        <div className="absolute top-full left-0 w-[450px] bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-auto py-2">
                          {filteredItems.map((i, idx) => (
                            <div 
                              key={i._id} 
                              className={`px-4 py-3 cursor-pointer border-b border-slate-800 transition-all ${idx === activeIndex ? 'bg-maroon-800 text-white' : 'hover:bg-slate-800'}`}
                              onClick={() => { updateItem(item.id, "itemId", i._id); setShowItemSearch(null); }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{i.code}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 rounded text-slate-400">{i.category || "Lubricants"}</span>
                                  </div>
                                  <div className="text-sm font-black mb-2">{i.name}</div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black uppercase text-slate-500">Cartons</span>
                                      <span className="text-xs font-black text-emerald-400">{i.stockQtyCartons || 0}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black uppercase text-slate-500">Gallons</span>
                                      <span className="text-xs font-black text-blue-400">{(i.stockQtyCartons || 0) * 4}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[8px] font-black uppercase text-slate-500">Price</span>
                                      <span className="text-xs font-black text-yellow-400">Rs. {i.purchaseRate || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <input placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.cartons} onChange={(e) => updateItem(item.id, "cartons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.gallons} onChange={(e) => updateItem(item.id, "gallons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.liters} onChange={(e) => updateItem(item.id, "liters", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input type="number" value={item.unitPriceUSD} onChange={(e) => updateItem(item.id, "unitPriceUSD", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
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
