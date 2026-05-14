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
  Building2,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  Package,
  User,
  Navigation,
  Globe,
  MapPin
} from "lucide-react";

interface StockLine {
  id: string;
  itemId: string;
  itemCode?: string;
  cartons: number;
  gallons: number;
  liters: number;
  uom: string;
  cost: number;
  total: number;
}

interface BranchTransferFormProps {
  onClose: () => void;
  initialData?: any;
}

export default function BranchTransferForm({ onClose, initialData }: BranchTransferFormProps) {
  const [items, setItems] = useState<StockLine[]>(() => {
    if (initialData?.lines?.length > 0) {
      return initialData.lines.map((l: any, i: number) => ({
        id: i.toString(),
        itemId: l.itemId?._id || l.itemId || "",
        itemCode: l.itemId?.code || "",
        cartons: l.cartons || l.qty || 0,
        gallons: l.gallons || 0,
        liters: l.liters || 0,
        uom: l.uom || "",
        cost: l.rate || 0,
        total: (l.qty || 0) * (l.rate || 0)
      }));
    }
    return [{ id: "1", itemId: "", itemCode: "", cartons: 1, gallons: 4, liters: 16, uom: "", cost: 0, total: 0 }];
  });
  
  const [formData, setFormData] = useState({
    docNo: initialData?.invoiceNo || "Auto-generated",
    date: initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split("T")[0],
    fromBranchId: initialData?.branchId || "",
    toBranchId: initialData?.targetBranchId || "",
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
        invoiceNo: formData.docNo === "Auto-generated" ? `BR-TRF-${Date.now()}` : formData.docNo,
        type: "branch_transfer",
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
          description: "Branch Transfer",
          cartons: i.cartons,
          gallons: i.gallons,
          liters: i.liters,
          qty: i.cartons,
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

  const addItem = () => setItems([...items, { id: Date.now().toString(), itemId: "", itemCode: "", cartons: 1, gallons: 4, liters: 16, uom: "", cost: 0, total: 0 }]);
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

  const updateItem = (id: string, field: keyof StockLine, value: any) => {
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
            updated.cost = selected.purchaseRate || 0;
            updated.uom = "Ctns";
          }
        }

        updated.total = (Number(updated.cartons) || 0) * (updated.cost || 0);
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
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight text-rose-800 uppercase">Inter-Branch Stock Transfer</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Draft")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all disabled:opacity-50">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSave("Dispatched")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center shadow-lg shadow-rose-600/10 transition-all disabled:opacity-50">
            <Truck size={16} className="mr-2" /> Issue Stock
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Branch Selection & Logistics */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-2 h-full bg-rose-800" />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Issuing Side */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-50 text-rose-800 rounded-lg flex items-center justify-center">
                       <Building2 size={18} />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Issuing Branch Info</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source Branch *</label>
                        <select value={formData.fromLocationId} onChange={(e) => setFormData({...formData, fromLocationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-rose-800 outline-none transition-all">
                           <option value="">Select Location...</option>
                           {locations.map(l => (
                             <option key={l._id} value={l._id}>{l.name}</option>
                           ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Issuing Hub *</label>
                        <select value={formData.fromLocationId} onChange={(e) => setFormData({...formData, fromLocationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-rose-800 outline-none transition-all">
                           <option value="">-- No Source Hub --</option>
                           {locations.map(l => (
                             <option key={l._id} value={l._id}>{l.name}</option>
                           ))}
                        </select>
                    </div>
                 </div>
              </div>

              {/* Transit Logic */}
              <div className="flex flex-col items-center justify-center space-y-4 bg-slate-50 dark:bg-slate-800/50/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 border-dashed">
                  <div className="w-12 h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-300">
                     <ArrowRightLeft size={24} />
                  </div>
                  <div className="w-full space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center block">Transfer Date</label>
                        <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-center focus:border-rose-800 outline-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center block">Driver / Vehicle</label>
                        <input placeholder="Ex: Ali / LHR-901" value={formData.driverName} onChange={(e) => setFormData({...formData, driverName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-center focus:border-rose-800 outline-none" />
                     </div>
                  </div>
              </div>

              {/* Receiving Side */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 justify-end">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target Branch Info</h3>
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                       <MapPin size={18} />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right block">Receiving Branch *</label>
                        <select value={formData.toLocationId} onChange={(e) => setFormData({...formData, toLocationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-emerald-600 outline-none transition-all">
                           <option value="">Select Target Location...</option>
                           {locations.map(l => (
                             <option key={l._id} value={l._id}>{l.name}</option>
                           ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right block">Destination Hub *</label>
                        <select value={formData.toLocationId} onChange={(e) => setFormData({...formData, toLocationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-emerald-600 outline-none transition-all">
                           <option value="">-- No Destination Hub --</option>
                           {locations.map(l => (
                             <option key={l._id} value={l._id}>{l.name}</option>
                           ))}
                        </select>
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-8 pt-8 border-t border-slate-50">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Memo / Notes</label>
              <input placeholder="Reason for transfer (Stock replenishment, branch request, etc.)" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-rose-800 outline-none transition-all mt-1.5" />
           </div>
        </section>

        {/* Items Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Inventory Breakdown</h3>
            <button onClick={addItem} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-rose-800" /> Add Item
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
                              className={`px-4 py-3 cursor-pointer border-b border-slate-800 transition-all ${idx === activeIndex ? 'bg-rose-800 text-white' : 'hover:bg-slate-800'}`}
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
                      <input placeholder="Description" value={item.uom} onChange={(e) => updateItem(item.id, "uom", e.target.value)} className="w-full bg-transparent text-sm font-bold focus:outline-none border-b border-transparent focus:border-rose-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.cartons} onChange={(e) => updateItem(item.id, "cartons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center text-rose-800 focus:outline-none border-b border-transparent focus:border-rose-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.gallons} onChange={(e) => updateItem(item.id, "gallons", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center text-rose-800 focus:outline-none border-b border-transparent focus:border-rose-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="number" value={item.liters} onChange={(e) => updateItem(item.id, "liters", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center text-rose-800 focus:outline-none border-b border-transparent focus:border-rose-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-center text-slate-400">
                      Ctns
                    </td>
                    <td className="px-8 py-4 text-right">
                      <input type="number" value={item.cost} onChange={(e) => updateItem(item.id, "cost", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-right focus:outline-none border-b border-transparent focus:border-rose-800/30 py-2 transition-all" />
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
            <div className="w-full md:w-[400px] flex justify-between items-center px-4 border-l border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Grand Total Value</span>
              <span className="text-3xl font-black text-rose-800 tracking-tighter">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
