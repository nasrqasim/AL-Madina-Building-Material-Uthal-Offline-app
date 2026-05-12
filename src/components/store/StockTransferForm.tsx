"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Truck,
  Building,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  Package,
  User,
  Navigation
} from "lucide-react";

interface StockLine {
  id: string;
  itemId: string;
  qty: number;
  uom: string;
  cost: number;
  total: number;
}

interface StockTransferFormProps {
  onClose: () => void;
  initialData?: any;
}

export default function StockTransferForm({ onClose, initialData }: StockTransferFormProps) {
  const [items, setItems] = useState<StockLine[]>(() => {
    if (initialData?.lines?.length > 0) {
      return initialData.lines.map((l: any, i: number) => ({
        id: i.toString(),
        itemId: l.itemId?._id || l.itemId || "",
        qty: l.qty || 1,
        uom: l.uom || "",
        cost: l.rate || 0,
        total: (l.qty || 0) * (l.rate || 0)
      }));
    }
    return [{ id: "1", itemId: "", qty: 1, uom: "", cost: 0, total: 0 }];
  });
  
  const [formData, setFormData] = useState({
    docNo: initialData?.invoiceNo || "Auto-generated",
    date: initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split("T")[0],
    fromLocationId: initialData?.locationId?._id || initialData?.locationId || "",
    toLocationId: initialData?.toLocationId?._id || initialData?.toLocationId || "",
    driverName: initialData?.driverName || "",
    vehicleNo: initialData?.vehicleNo || "",
    reason: initialData?.notes || "",
    status: initialData?.status || "Draft"
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
    if (!formData.fromLocationId || !formData.toLocationId) return window.alert("Please select both locations");
    
    setIsSaving(true);
    try {
      const payload = {
        invoiceNo: formData.docNo === "Auto-generated" ? `STK-TRF-${Date.now()}` : formData.docNo,
        type: "stock_transfer",
        date: formData.date,
        locationId: formData.fromLocationId,
        toLocationId: formData.toLocationId,
        driverName: formData.driverName,
        vehicleNo: formData.vehicleNo,
        partyId: "000000000000000000000000",
        notes: formData.reason,
        status: submitStatus,
        totalAmount: items.reduce((sum, i) => sum + i.total, 0),
        lines: items.map(i => ({
          itemId: i.itemId || "000000000000000000000000",
          description: "Stock Transfer",
          qty: i.qty,
          uom: i.uom,
          rate: i.cost,
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

  const addItem = () => setItems([...items, { id: Date.now().toString(), itemId: "", qty: 1, uom: "", cost: 0, total: 0 }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const updateItem = (id: string, field: keyof StockLine, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };
        
        if (field === "itemId") {
          const selected = availableItems.find(ai => ai._id === value);
          if (selected) {
            updated.cost = selected.purchaseRate || 0;
            updated.uom = "Ctns";
          }
        }

        updated.total = updated.qty * updated.cost;
        return updated;
      }
      return i;
    }));
  };

  const grandTotal = items.reduce((sum, i) => sum + i.total, 0);

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
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight text-blue-600">Stock Transfer Request</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Draft")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all disabled:opacity-50">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("Dispatched")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center shadow-lg shadow-blue-600/10 transition-all disabled:opacity-50">
            <Truck size={16} className="mr-2" /> Dispatch Now
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Transfer Route & Info */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Route & Logistics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transfer Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-maroon-800">From Location *</label>
              <select value={formData.fromLocationId} onChange={(e) => setFormData({...formData, fromLocationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all border-l-4 border-l-maroon-800">
                <option value="">Select Warehouse...</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-emerald-600">To Location *</label>
              <select value={formData.toLocationId} onChange={(e) => setFormData({...formData, toLocationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all border-l-4 border-l-emerald-600">
                <option value="">Select Destination...</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vehicle / Driver</label>
               <div className="flex gap-2">
                 <input placeholder="Vehicle #" value={formData.vehicleNo} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})} className="w-1/2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all" />
                 <input placeholder="Driver" value={formData.driverName} onChange={(e) => setFormData({...formData, driverName: e.target.value})} className="w-1/2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all" />
               </div>
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason / Memo</label>
              <input placeholder="Internal replenishment / Branch request..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all" />
            </div>
          </div>
        </section>

        {/* Section 2: Items List */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Items to Transfer</h3>
            <button onClick={addItem} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-blue-600" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Item Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-center">UOM</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-center">Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Unit Value</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Subtotal</th>
                  <th className="px-8 py-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30 transition-colors group">
                    <td className="px-8 py-4 text-xs font-bold text-slate-300 text-center">{index + 1}</td>
                    <td className="px-8 py-4">
                      <select value={item.itemId} onChange={(e) => updateItem(item.id, "itemId", e.target.value)} className="w-full bg-transparent text-sm font-bold focus:outline-none border-b border-transparent focus:border-blue-600/30 py-2 transition-all">
                        <option value="">Select Item...</option>
                        {availableItems.map(ai => (
                          <option key={ai._id} value={ai._id}>{ai.code} - {ai.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <input placeholder="Carton/Pcs" value={item.uom} onChange={(e) => updateItem(item.id, "uom", e.target.value)} className="w-full bg-transparent text-sm font-bold text-center focus:outline-none border-b border-transparent focus:border-blue-600/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-center">
                      <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center text-blue-600 focus:outline-none border-b border-transparent focus:border-blue-600/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-right">
                      <input type="number" value={item.cost} onChange={(e) => updateItem(item.id, "cost", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-right focus:outline-none border-b border-transparent focus:border-blue-600/30 py-2 transition-all" />
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
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <div className="w-full md:w-[400px] flex justify-between items-center px-4 border-l border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Valuation</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
