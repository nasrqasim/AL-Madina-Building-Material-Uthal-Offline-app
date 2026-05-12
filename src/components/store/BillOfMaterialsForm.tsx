"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Layers,
  Settings,
  Activity,
  Package,
  DollarSign,
  History,
  LayoutGrid,
  ClipboardList
} from "lucide-react";

interface BOMComponent {
  id: string;
  itemId: string;
  qty: number;
  uom: string;
  unitCost: number;
  total: number;
}

interface BillOfMaterialsFormProps {
  onClose: () => void;
  initialData?: any;
}

export default function BillOfMaterialsForm({ onClose, initialData }: BillOfMaterialsFormProps) {
  const [components, setComponents] = useState<BOMComponent[]>(() => {
    if (initialData?.lines?.length > 0) {
      return initialData.lines.map((l: any, i: number) => ({
        id: i.toString(),
        itemId: l.itemId?._id || l.itemId || "",
        qty: l.qty || 1,
        uom: l.uom || "",
        unitCost: l.rate || 0,
        total: (l.qty || 0) * (l.rate || 0)
      }));
    }
    return [{ id: "1", itemId: "", qty: 1, uom: "", unitCost: 0, total: 0 }];
  });
  
  const [formData, setFormData] = useState({
    docNo: initialData?.invoiceNo || "Auto-generated",
    bomName: initialData?.bomName || "",
    finishedItem: initialData?.itemId?._id || initialData?.itemId || "",
    version: initialData?.version || "1.0",
    locationId: initialData?.locationId?._id || initialData?.locationId || "",
    status: initialData?.status || "Draft",
    notes: initialData?.notes || ""
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (submitStatus: string) => {
    if (!formData.bomName) return window.alert("Please enter BOM Name");
    if (!formData.finishedItem) return window.alert("Please select Finished Item");
    
    setIsSaving(true);
    try {
      const payload = {
        invoiceNo: formData.docNo === "Auto-generated" ? `BOM-${Date.now()}` : formData.docNo,
        type: "bill_of_materials",
        date: new Date().toISOString(),
        bomName: formData.bomName,
        itemId: formData.finishedItem,
        version: formData.version,
        locationId: formData.locationId || null,
        partyId: "000000000000000000000000", // Dummy ID to pass cached schema validation
        notes: formData.notes,
        status: submitStatus,
        totalAmount: components.reduce((sum, c) => sum + c.total, 0),
        lines: components.map(c => ({
          itemId: c.itemId || "000000000000000000000000",
          description: "Component",
          qty: c.qty,
          uom: c.uom,
          rate: c.unitCost,
          netAmount: c.total
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

  const [availableItems, setAvailableItems] = useState<any[]>([]);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items");
      const json = await res.json();
      if (json.ok) setAvailableItems(json.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchItems();
    fetch("/api/locations")
      .then(r => r.json())
      .then(data => {
        if (data.ok) setLocations(data.data);
      });
  }, []);

  const addComponent = () => setComponents([...components, { id: Date.now().toString(), itemId: "", qty: 1, uom: "", unitCost: 0, total: 0 }]);
  const removeComponent = (id: string) => setComponents(components.filter(c => c.id !== id));
  
  const updateComponent = (id: string, field: keyof BOMComponent, value: any) => {
    setComponents(components.map(c => {
      if (c.id === id) {
        let updated = { ...c, [field]: value };
        
        if (field === "itemId") {
          const selected = availableItems.find(ai => ai._id === value);
          if (selected) {
            updated.unitCost = selected.purchaseRate || 0;
            updated.uom = "Units";
          }
        }

        updated.total = updated.qty * updated.unitCost;
        return updated;
      }
      return c;
    }));
  };

  const totalCost = components.reduce((sum, c) => sum + c.total, 0);

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
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Create Bill of Materials</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Draft")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all disabled:opacity-50">
            <Save size={16} className="mr-2" /> Save BOM
          </button>
          <button type="button" onClick={() => handleSave("Active")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all disabled:opacity-50">
            <CheckCircle2 size={16} className="mr-2" /> Activate Version
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
        {/* Section 1: Recipe Identity */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
          <div className="flex items-center space-x-2 mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">BOM Identity & Versioning</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">BOM Name *</label>
              <input placeholder="e.g. Premium Synthetic 4L Recipe" value={formData.bomName} onChange={(e) => setFormData({...formData, bomName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Finished Item *</label>
              <select 
                value={formData.finishedItem} 
                onChange={(e) => setFormData({...formData, finishedItem: e.target.value})} 
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all appearance-none"
              >
                <option value="">-- Select Product --</option>
                {availableItems.map(ai => (
                  <option key={ai._id} value={ai._id}>{ai.code} - {ai.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Version No</label>
              <input value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Production Unit</label>
              <select value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Location --</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Components List */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-400/20" />
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Material Components (Recipe)</h3>
            <button onClick={addComponent} className="px-4 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl uppercase tracking-widest flex items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 shadow-sm">
              <Plus size={14} className="mr-1.5 text-maroon-800" /> Add Component
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Component Item</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-center">UOM</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-center">Qty / Unit</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Unit Cost</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Subtotal</th>
                  <th className="px-8 py-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {components.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30 transition-colors group">
                    <td className="px-8 py-4 text-xs font-bold text-slate-300 text-center">{index + 1}</td>
                    <td className="px-8 py-4">
                      <select 
                        value={item.itemId} 
                        onChange={(e) => updateComponent(item.id, "itemId", e.target.value)} 
                        className="w-full bg-transparent text-sm font-bold focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all appearance-none"
                      >
                        <option value="">Select Item...</option>
                        {availableItems.map(ai => (
                          <option key={ai._id} value={ai._id}>{ai.code} - {ai.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-4">
                      <input placeholder="Litre/Pcs" value={item.uom} onChange={(e) => updateComponent(item.id, "uom", e.target.value)} className="w-full bg-transparent text-sm font-bold text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-center">
                      <input type="number" value={item.qty} onChange={(e) => updateComponent(item.id, "qty", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4">
                      <input type="number" value={item.unitCost} onChange={(e) => updateComponent(item.id, "unitCost", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-right focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all" />
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button onClick={() => removeComponent(item.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full md:w-[450px] space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Estimated Production Cost (per Unit)</span>
                <span className="text-4xl font-black text-maroon-800 tracking-tighter">Rs. {totalCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Notes */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recipe Notes / Special Instructions</label>
          <textarea rows={6} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Specify blending instructions or quality control parameters..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:border-maroon-800 transition-all resize-none outline-none" />
        </section>
      </div>
    </div>
  );
}
