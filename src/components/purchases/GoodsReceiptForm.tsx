"use client";

import { useState, useEffect } from "react";
import ItemSearchInput from "@/components/erp/ui/ItemSearchInput";
import {
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Truck,
  Package,
  MapPin,
  User,
  Calendar,
  FileText
} from "lucide-react";

interface GRNItem {
  id: string;
  itemId: string;
  itemCode?: string;
  description: string;
  orderedCartons: number;
  orderedGallons: number;
  orderedLiters: number;
  receivedCartons: number;
  receivedGallons: number;
  receivedLiters: number;
  unitCost: number;
  total: number;
}

interface GoodsReceiptFormProps {
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

export default function GoodsReceiptForm({ onClose, onSave, initialData }: GoodsReceiptFormProps) {
  const [items, setItems] = useState<GRNItem[]>(initialData?.lines?.map((l: any, i: number) => ({
    id: i.toString(),
    itemId: l.itemId?._id || l.itemId || "",
    itemCode: l.itemId?.code || "",
    description: l.description || "",
    orderedCartons: l.orderedCartons || 0,
    orderedGallons: l.orderedGallons || 0,
    orderedLiters: l.orderedLiters || 0,
    receivedCartons: l.cartons || l.qty || 0,
    receivedGallons: l.gallons || 0,
    receivedLiters: l.liters || 0,
    unitCost: l.rate || 0,
    total: l.netAmount || 0
  })) || [
    { id: "1", itemId: "", itemCode: "", description: "", orderedCartons: 0, orderedGallons: 0, orderedLiters: 0, receivedCartons: 1, receivedGallons: 4, receivedLiters: 16, unitCost: 0, total: 0 }
  ]);
  
  const [formData, setFormData] = useState({
    grnNumber: initialData?.docNo || "Auto-generated",
    grnDate: initialData?.date || new Date().toISOString().split("T")[0],
    status: initialData?.status || "Draft",
    linkToPO: initialData?.poRef || "",
    vendorId: initialData?.vendor || "",
    vendorInvoiceNo: initialData?.vendorInvoiceNo || "",
    receivingLocationId: initialData?.receivingLocationId || "",
    vehicleNo: initialData?.vehicleNo || "",
    driverName: initialData?.driverName || "",
    employeeId: initialData?.employeeId || "",
    jobId: initialData?.jobId || "",
    locationId: initialData?.locationId || initialData?.receivingLocationId || "",
    notes: initialData?.notes || ""
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

  const addItem = () => setItems([...items, { id: Date.now().toString(), itemId: "", description: "", orderedCartons: 0, orderedGallons: 0, orderedLiters: 0, receivedCartons: 0, receivedGallons: 0, receivedLiters: 0, unitCost: 0, total: 0 }]);
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

  const updateItem = (id: string, field: keyof GRNItem, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };

        // Conversion for Received
        if (field === "receivedCartons") {
          updated.receivedGallons = value * 4;
          updated.receivedLiters = value * 16;
        } else if (field === "receivedGallons") {
          updated.receivedCartons = value / 4;
          updated.receivedLiters = value * 4;
        } else if (field === "receivedLiters") {
          updated.receivedCartons = value / 16;
          updated.receivedGallons = value / 4;
        }

        // Conversion for Ordered
        if (field === "orderedCartons") {
          updated.orderedGallons = value * 4;
          updated.orderedLiters = value * 16;
        } else if (field === "orderedGallons") {
          updated.orderedCartons = value / 4;
          updated.orderedLiters = value * 4;
        } else if (field === "orderedLiters") {
          updated.orderedCartons = value / 16;
          updated.orderedGallons = value / 4;
        }

        if (field === "itemId") {
          const selected = availableItems.find(ai => ai._id === value);
          if (selected) {
            updated.itemCode = selected.code;
            updated.description = selected.name;
            updated.unitCost = selected.purchaseRate || 0;
          }
        }
        updated.total = (Number(updated.receivedCartons) || 0) * (updated.unitCost || 0);
        return updated;
      }
      return i;
    }));
  };

  const totalReceivedCtns = items.reduce((sum, i) => sum + (Number(i.receivedCartons) || 0), 0);
  const totalAmount = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

  const handleSave = async (status: "Draft" | "Received") => {
    const isEdit = initialData && initialData._id;
    const payload = {
      invoiceNo: formData.grnNumber === "Auto-generated" ? `GRN-${Date.now().toString().slice(-6)}` : formData.grnNumber,
      type: "grn",
      date: formData.grnDate,
      partyId: formData.vendorId,
      reference: formData.linkToPO || formData.vendorInvoiceNo,
      lines: items.map(i => ({
        itemId: i.itemId,
        description: i.description,
        cartons: i.receivedCartons,
        gallons: i.receivedGallons,
        liters: i.receivedLiters,
        orderedCartons: i.orderedCartons,
        orderedGallons: i.orderedGallons,
        orderedLiters: i.orderedLiters,
        qty: i.receivedCartons,
        rate: i.unitCost,
        netAmount: i.total
      })),
      totalAmount: totalAmount,
      status: status.toLowerCase(),
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
        alert(`Goods Receipt ${isEdit ? "updated" : "saved"} successfully!`);
        onClose();
      } else {
        const json = await res.json();
        alert("Error: " + (json.error || json.message));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save goods receipt");
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
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Goods Receipt Note</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Draft")} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("Received")} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
            <CheckCircle2 size={16} className="mr-2" /> Save & Receive
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Receipt Details */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Receipt Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">GRN Number</label>
              <input value={formData.grnNumber} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">GRN Date *</label>
              <input type="date" value={formData.grnDate} onChange={(e) => setFormData({...formData, grnDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <input value={formData.status} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Link to PO</label>
              <select value={formData.linkToPO} onChange={(e) => setFormData({...formData, linkToPO: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Direct GRN (No PO) --</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor *</label>
              <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>{v.companyName || v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Invoice No.</label>
              <input placeholder="Enter invoice #" value={formData.vendorInvoiceNo} onChange={(e) => setFormData({...formData, vendorInvoiceNo: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location *</label>
              <select value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none">
                <option value="">-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vehicle No.</label>
              <input placeholder="Vehicle #" value={formData.vehicleNo} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Driver Name</label>
              <input placeholder="Driver name" value={formData.driverName} onChange={(e) => setFormData({...formData, driverName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
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
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Line Items</h3>
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
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Description</th>
                  <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ord (Ctn)</th>
                  <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Rec (Ctn)</th>
                  <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Rec (Gal)</th>
                  <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Rec (Ltr)</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-center">Unit Cost</th>
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
                        onSelect={(selected) => {
                          updateItem(item.id, "itemId", selected._id);
                          updateItem(item.id, "itemCode", selected.code);
                          updateItem(item.id, "description", selected.name);
                        }}
                        onChange={(val) => updateItem(item.id, "itemCode", val)}
                        placeholder="Search item..."
                      />
                    </td>
                    <td className="px-8 py-4">
                      <input placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.orderedCartons} onChange={(e) => updateItem(item.id, "orderedCartons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.receivedCartons} onChange={(e) => updateItem(item.id, "receivedCartons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all text-emerald-600 font-black" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.receivedGallons} onChange={(e) => updateItem(item.id, "receivedGallons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.receivedLiters} onChange={(e) => updateItem(item.id, "receivedLiters", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-center">
                      <input type="number" value={item.unitCost} onChange={(e) => updateItem(item.id, "unitCost", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
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
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Total Items</span>
                <span className="font-bold text-slate-900 dark:text-white">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Total Received (Ctns)</span>
                <span className="font-bold text-emerald-600 font-black">{totalReceivedCtns}</span>
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Total Value (PKR)</span>
                <span className="text-3xl font-black text-maroon-800 tracking-tighter">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Additional Information */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Notes & Remarks</label>
          <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Any specific remarks about the received goods..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
        </section>
      </div>
    </div>
  );
}
