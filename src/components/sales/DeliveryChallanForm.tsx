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
  User,
  Calendar,
  MapPin,
  ShoppingCart
} from "lucide-react";

interface DCItem {
  id: string;
  itemId: string;
  itemCode?: string;
  description: string;
  cartons: number;
  gallons: number;
  liters: number;
  uom: string;
  remarks: string;
}

interface DeliveryChallanFormProps {
  onClose: () => void;
  initialData?: any;
}

export default function DeliveryChallanForm({ onClose, initialData }: DeliveryChallanFormProps) {
  const [items, setItems] = useState<DCItem[]>(() => {
    if (initialData?.lines && initialData.lines.length > 0) {
      return initialData.lines.map((l: any, index: number) => ({
        id: index.toString(),
        itemId: l.itemId?._id || l.itemId || "",
        itemCode: l.itemId?.code || "",
        description: l.description,
        cartons: l.cartons || l.qty || 0,
        gallons: l.gallons || 0,
        liters: l.liters || 0,
        uom: l.uom || "Units",
        remarks: l.notes || ""
      }));
    }
    return [{ id: "1", itemId: "", itemCode: "", description: "", cartons: 1, gallons: 4, liters: 16, uom: "Units", remarks: "" }];
  });
  
  const [formData, setFormData] = useState({
    dcNumber: initialData?.invoiceNo || "Auto-generated",
    dcDate: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    status: initialData?.status || "draft",
    customerId: initialData?.partyId?._id || initialData?.partyId || "",
    orderRef: initialData?.reference || "",
    vehicleNo: initialData?.regNo || "",
    driverName: initialData?.driverName || "",
    warehouseId: initialData?.locationId?._id || initialData?.locationId || "",
    shippingAddress: initialData?.shippingAddress || "",
    notes: initialData?.notes || ""
  });

  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [itemsRes, partiesRes, locationsRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/parties"),
        fetch("/api/locations")
      ]);
      const [itemsJson, partiesJson, locationsJson] = await Promise.all([
        itemsRes.json(),
        partiesRes.json(),
        locationsRes.json()
      ]);
      
      if (itemsJson.ok) setAvailableItems(itemsJson.data);
      if (partiesJson.ok) setCustomers(partiesJson.data.filter((p: any) => p.type === "Customer"));
      if (locationsJson.ok) setLocations(locationsJson.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), itemId: "", description: "", cartons: 0, gallons: 0, liters: 0, uom: "Units", remarks: "" }]);
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

  const updateItem = (id: string, field: keyof DCItem, value: any) => {
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
        return updated;
      }
      return i;
    }));
  };

  const handleSave = async (status: string) => {
    if (!formData.customerId) return alert("Please select a customer");
    if (items.some(i => !i.itemId)) return alert("Please select items for all rows");

    const isEdit = initialData && initialData._id;
    const payload = {
      ...formData,
      type: "challan",
      invoiceNo: formData.dcNumber === "Auto-generated" ? `DC-${Date.now().toString().slice(-6)}` : formData.dcNumber,
      partyId: formData.customerId,
      reference: formData.orderRef,
      regNo: formData.vehicleNo,
      locationId: formData.warehouseId || undefined,
      lines: items.map(i => ({
        itemId: i.itemId,
        description: i.description,
        cartons: i.cartons,
        gallons: i.gallons,
        liters: i.liters,
        qty: i.cartons,
        uom: i.uom,
        notes: i.remarks
      })),
      status: status.toLowerCase()
    };

    try {
      const url = isEdit ? `/api/invoices/${initialData._id}` : "/api/invoices";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Delivery Challan ${isEdit ? "updated" : "saved"} successfully!`);
        onClose();
      } else {
        const json = await res.json();
        alert("Error: " + (json.message || json.error));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save challan");
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
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Delivery Challan</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("draft")} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("posted")} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
            <CheckCircle2 size={16} className="mr-2" /> Save & Dispatch
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Challan Details */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Dispatch Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">DC Number</label>
              <input value={formData.dcNumber} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">DC Date *</label>
              <input type="date" value={formData.dcDate} onChange={(e) => setFormData({...formData, dcDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <input value={formData.status} disabled className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Ref *</label>
              <input placeholder="Enter SO Ref #" value={formData.orderRef} onChange={(e) => setFormData({...formData, orderRef: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer *</label>
              <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Warehouse *</label>
              <select value={formData.warehouseId} onChange={(e) => setFormData({...formData, warehouseId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Location --</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vehicle No</label>
              <input placeholder="Enter Vehicle #" value={formData.vehicleNo} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shipping Address</label>
              <input placeholder="Delivery destination..." value={formData.shippingAddress} onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Driver Name</label>
              <input placeholder="Driver's Name" value={formData.driverName} onChange={(e) => setFormData({...formData, driverName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none" />
            </div>
          </div>
        </section>

        {/* Section 2: Line Items */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Dispatched Items</h3>
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
                  <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ctns</th>
                  <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Gals</th>
                  <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20 text-center">Ltrs</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-center">UOM</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks</th>
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
                      <input type="number" value={item.cartons} onChange={(e) => updateItem(item.id, "cartons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.gallons} onChange={(e) => updateItem(item.id, "gallons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.liters} onChange={(e) => updateItem(item.id, "liters", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black focus:outline-none text-center border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-center">
                      <input placeholder="UOM" value={item.uom} onChange={(e) => updateItem(item.id, "uom", e.target.value)} className="w-full bg-transparent text-sm font-bold text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4">
                      <input placeholder="Any remarks..." value={item.remarks} onChange={(e) => updateItem(item.id, "remarks", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
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

        {/* Section 3: Additional Information */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Notes</label>
          <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Notes for warehouse or logistics staff..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
        </section>
      </div>
    </div>
  );
}
