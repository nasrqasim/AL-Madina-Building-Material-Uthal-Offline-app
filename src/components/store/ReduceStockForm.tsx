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
  ClipboardList,
  Package,
  TrendingDown,
  MapPin,
  Calendar,
  Building,
  AlertCircle,
  FileText,
  XCircle
} from "lucide-react";

interface AdjustmentItem {
  description?: string;
  id: string;
  itemId: string;
  itemCode?: string;
  cartons: number;
  gallons: number;
  liters: number;
  uom: string;
  unitValue: number;
  total: number;
}

interface ReduceStockFormProps {
  onClose: () => void;
  initialData?: any;
}

export default function ReduceStockForm({ onClose, initialData }: ReduceStockFormProps) {
  const [items, setItems] = useState<AdjustmentItem[]>(() => {
    if (initialData?.lines?.length > 0) {
      return initialData.lines.map((l: any, i: number) => ({
        id: i.toString(),
        itemId: l.itemId?._id || l.itemId || "",
        itemCode: l.itemId?.code || "",
        cartons: l.cartons || l.qty || 0,
        gallons: l.gallons || 0,
        liters: l.liters || 0,
        uom: l.uom || "",
        unitValue: l.rate || 0,
        total: (l.qty || 0) * (l.rate || 0)
      }));
    }
    return [{ id: "1", itemId: "", itemCode: "", cartons: 1, gallons: 4, liters: 16, uom: "", unitValue: 0, total: 0 }];
  });
  
  const [formData, setFormData] = useState({
    docNo: initialData?.invoiceNo || "Auto-generated",
    date: initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split("T")[0],
    type: initialData?.purpose || "Damaged",
    locationId: initialData?.locationId?._id || initialData?.locationId || "",
    status: initialData?.status || "Draft",
    reason: initialData?.notes || ""
  });

  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/items")
      .then(r => r.json())
      .then(data => { if (data.ok) setAvailableItems(data.data); });
    
    fetch("/api/locations")
      .then(r => r.json())
      .then(data => { if (data.ok) setLocations(data.data); });
  }, []);

  const handleSave = async (submitStatus: string) => {
    setIsSaving(true);
    try {
      const payload = {
        invoiceNo: formData.docNo === "Auto-generated" ? `STK-RED-${Date.now()}` : formData.docNo,
        type: "reduce_stock",
        date: formData.date,
        purpose: formData.type,
        locationId: formData.locationId || null,
        partyId: "000000000000000000000000",
        notes: formData.reason,
        status: submitStatus,
        totalAmount: items.reduce((sum: number, i: AdjustmentItem) => sum + i.total, 0),
        lines: items.map(i => ({
          itemId: i.itemId || "000000000000000000000000",
          description: "Stock Reduction",
          cartons: i.cartons,
          gallons: i.gallons,
          liters: i.liters,
          qty: i.cartons,
          uom: i.uom,
          rate: i.unitValue,
          netAmount: i.total
        }))
      };

      const url = initialData?._id ? `/api/invoices/${initialData._id}` : "/api/invoices";
      const method = initialData?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.ok) {
        onClose();
      } else {
        window.alert(json.message || "Failed to save");
      }
    } catch (e) {
      console.error(e);
      window.alert("Error saving");
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = () => setItems([...items, { id: Date.now().toString(), itemId: "", cartons: 0, gallons: 0, liters: 0, uom: "", unitValue: 0, total: 0 }]);
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

  const updateItem = (id: string, field: keyof AdjustmentItem, value: any) => {
    setItems(items.map((i: AdjustmentItem) => {
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
            updated.unitValue = selected.purchaseRate || 0;
            updated.uom = "Ctns";
          }
        }

        updated.total = (Number(updated.cartons) || 0) * (updated.unitValue || 0);
        return updated;
      }
      return i;
    }));
  };

  const grandTotal = items.reduce((sum: number, i: AdjustmentItem) => sum + i.total, 0);

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
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Manual Stock Reduction</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Draft")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all disabled:opacity-50">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("Posted")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center shadow-lg shadow-rose-600/10 transition-all disabled:opacity-50">
            <XCircle size={16} className="mr-2" /> Post Reduction
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Adjustment Context */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-600" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Reduction Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reduction Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="Damaged">Damaged Goods</option>
                <option value="Lost">Lost / Missing</option>
                <option value="Expired">Expired Stock</option>
                <option value="Theft">Theft / Pilferage</option>
                <option value="Other">Other Adjustment</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source Warehouse *</label>
              <select value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Location --</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason / Memo</label>
              <input placeholder="Explain why stock is being reduced..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
          </div>
        </section>

        {/* Section 2: Items List */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Items to Deduct</h3>
            <button onClick={addItem} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-rose-600" /> Add Row
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
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Unit Value</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Subtotal</th>
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
                      <input placeholder="Description" value={item.uom} onChange={(e) => updateItem(item.id, "uom", e.target.value)} className="w-full bg-transparent text-sm font-bold focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.cartons} onChange={(e) => updateItem(item.id, "cartons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center text-rose-600 focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.gallons} onChange={(e) => updateItem(item.id, "gallons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center text-rose-600 focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.liters} onChange={(e) => updateItem(item.id, "liters", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center text-rose-600 focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-center text-slate-400">
                      Ctns
                    </td>
                    <td className="px-8 py-4 text-right">
                      <input type="number" value={item.unitValue} onChange={(e) => updateItem(item.id, "unitValue", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-right focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.total.toLocaleString()}</span>
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
          
          <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <div className="w-full md:w-[400px] flex justify-between items-center px-4">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Total Valuation Loss</span>
              <span className="text-3xl font-black text-rose-700 tracking-tighter">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
