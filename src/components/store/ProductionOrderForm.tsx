"use client";

import { useState, useEffect, useMemo } from "react";
import ItemSearchInput from "@/components/erp/ui/ItemSearchInput";
import ItemDetailsPanel from "@/components/erp/ui/ItemDetailsPanel";
import { Plus, Trash2, Save, ArrowLeft, X, CheckCircle2, Package, Settings, Activity, DollarSign, Clock, Layers } from "lucide-react";

interface ComponentLine {
  id: string;
  itemId: string;
  itemCode?: string;
  description?: string;
  uom: string;
  isCritical: boolean;
  estQty: number;
  estCost: number;
  estTotal: number;
  actQty: number;
  actCost: number;
  actTotal: number;
}

interface ProductionOrderFormProps {
  onClose: () => void;
  initialData?: any;
}

export default function ProductionOrderForm({ onClose, initialData }: ProductionOrderFormProps) {
  const [components, setComponents] = useState<ComponentLine[]>(() => {
    if (initialData?.lines?.length > 0) {
      return initialData.lines.map((l: any, i: number) => ({
        id: i.toString(),
        itemId: l.itemId?._id || l.itemId || "",
        itemCode: l.itemId?.code || "",
        description: l.description || "",
        uom: l.uom || "",
        isCritical: l.isCritical || false,
        estQty: l.estQty !== undefined ? l.estQty : (l.qty || 0),
        estCost: l.estCost !== undefined ? l.estCost : (l.rate || 0),
        estTotal: l.estTotal !== undefined ? l.estTotal : ((l.qty || 0) * (l.rate || 0)),
        actQty: l.actQty !== undefined ? l.actQty : (l.qty || 0),
        actCost: l.actCost !== undefined ? l.actCost : (l.rate || 0),
        actTotal: l.actTotal !== undefined ? l.actTotal : ((l.qty || 0) * (l.rate || 0))
      }));
    }
    return [{ id: "1", itemId: "", uom: "", isCritical: false, estQty: 0, estCost: 0, estTotal: 0, actQty: 0, actCost: 0, actTotal: 0 }];
  });
  
  const [selectedLineId, setSelectedLineId] = useState<string | null>(initialData?.lines?.[0]?._id || "1");
  
  const [formData, setFormData] = useState({
    docNo: initialData?.invoiceNo || "Auto-generated",
    date: initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split("T")[0],
    bomId: initialData?.bomId?._id || initialData?.bomId || "",
    locationId: initialData?.locationId?._id || initialData?.locationId || "",
    plannedQty: initialData?.plannedQty || initialData?.qty || 0,
    actualQty: initialData?.actualQty || 0,
    status: initialData?.status || "Planned",
    notes: initialData?.notes || "",
    productionType: "In-House",
    completionDate: "",
    finishedItem: ""
  });

  const [boms, setBoms] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  
  const [prevBomId, setPrevBomId] = useState(formData.bomId);
  const [prevPlannedQty, setPrevPlannedQty] = useState(formData.plannedQty);

  useEffect(() => {
    fetch("/api/invoices?type=bill_of_materials")
      .then(r => r.json())
      .then(data => { if (data.ok) setBoms(data.data); });
    
    fetch("/api/locations")
      .then(r => r.json())
      .then(data => { if (data.ok) setLocations(data.data); });

    fetch("/api/items")
      .then(r => r.json())
      .then(data => { if (data.ok) setAvailableItems(data.data); });
  }, []);

  useEffect(() => {
    if (!formData.bomId) return;
    const selectedBOM = boms.find(b => b._id === formData.bomId);
    if (selectedBOM && selectedBOM.lines) {
      const isBomChanged = formData.bomId !== prevBomId;
      const isQtyChanged = formData.plannedQty !== prevPlannedQty;
      
      if (isBomChanged || isQtyChanged) {
        setPrevBomId(formData.bomId);
        setPrevPlannedQty(formData.plannedQty);
        
        const mapped = selectedBOM.lines.map((l: any, idx: number) => {
          const itemObj = availableItems.find(ai => ai._id === (l.itemId?._id || l.itemId));
          const estQty = (l.qty || 0) * (formData.plannedQty || 0);
          const estCost = l.rate || 0;
          const estTotal = estQty * estCost;
          return {
            id: idx.toString(),
            itemId: l.itemId?._id || l.itemId || "",
            itemCode: itemObj?.code || "",
            description: itemObj?.name || l.description || "",
            uom: l.uom || itemObj?.unit?.name || itemObj?.unit || "Units",
            isCritical: false,
            estQty,
            estCost,
            estTotal,
            actQty: estQty,
            actCost: estCost,
            actTotal: estTotal
          };
        });
        setComponents(mapped);
        if (mapped.length > 0) {
          setSelectedLineId(mapped[0].id);
        }
      }
    }
  }, [formData.bomId, formData.plannedQty, boms, availableItems, prevBomId, prevPlannedQty]);

  const selectedItemDetails = useMemo(() => {
    const activeLine = components.find(c => c.id === selectedLineId);
    if (!activeLine || !activeLine.itemId) return null;
    return availableItems.find(ai => ai._id === activeLine.itemId) || null;
  }, [selectedLineId, components, availableItems]);

  const handleSave = async (submitStatus: string) => {
    if (!formData.bomId) return window.alert("Please select BOM");
    if (formData.plannedQty <= 0) return window.alert("Please enter Planned Qty");
    
    setIsSaving(true);
    try {
      const selectedBOM = boms.find(b => b._id === formData.bomId);
      const payload = {
        invoiceNo: formData.docNo === "Auto-generated" ? `PROD-${Date.now()}` : formData.docNo,
        type: "production_order",
        date: formData.date,
        bomId: formData.bomId,
        itemId: selectedBOM?.itemId?._id || selectedBOM?.itemId || null,
        locationId: formData.locationId || null,
        plannedQty: formData.plannedQty,
        actualQty: formData.actualQty,
        partyId: "000000000000000000000000",
        notes: formData.notes,
        status: submitStatus.toLowerCase(),
        lines: components.map(c => ({
          itemId: c.itemId,
          description: c.description || "",
          qty: c.estQty,
          uom: c.uom,
          rate: c.estCost,
          netAmount: c.estTotal,
          estQty: c.estQty,
          estCost: c.estCost,
          estTotal: c.estTotal,
          actQty: c.actQty,
          actCost: c.actCost,
          actTotal: c.actTotal
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
  
  const addComponent = () => {
    const newId = Date.now().toString();
    setComponents([...components, { 
      id: newId, itemId: "", uom: "", isCritical: false, estQty: 0, estCost: 0, estTotal: 0, actQty: 0, actCost: 0, actTotal: 0 
    }]);
    setSelectedLineId(newId);
  };
  
  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedLineId === id) setSelectedLineId(null);
  };
  
  const updateComponent = (id: string, field: keyof ComponentLine, value: any) => {
    setComponents(components.map(c => {
      if (c.id === id) {
        let updated = { ...c, [field]: value };
        
        if (field === "itemId") {
          const selected = availableItems.find(ai => ai._id === value);
          if (selected) {
            updated.itemCode = selected.code;
            updated.description = selected.name;
            updated.uom = selected.unit?.name || selected.unit || "Units";
            updated.estCost = selected.purchaseRate || selected.rate || 0;
            updated.actCost = selected.purchaseRate || selected.rate || 0;
            updated.estTotal = (updated.estQty || 0) * updated.estCost;
            updated.actTotal = (updated.actQty || 0) * updated.actCost;
          }
        }

        if (field === "estQty" || field === "estCost") {
          updated.estTotal = (updated.estQty || 0) * (updated.estCost || 0);
        }
        if (field === "actQty" || field === "actCost") {
          updated.actTotal = (updated.actQty || 0) * (updated.actCost || 0);
        }
        return updated;
      }
      return c;
    }));
  };

  const totals = {
    estMaterial: components.reduce((sum, c) => sum + c.estTotal, 0),
    actMaterial: components.reduce((sum, c) => sum + c.actTotal, 0),
    overheadEst: 0,
    overheadAct: 0,
    outsourcingEst: 0,
    outsourcingAct: 0,
  };

  const finalTotals = {
    est: totals.estMaterial + totals.overheadEst + totals.outsourcingEst,
    act: totals.actMaterial + totals.overheadAct + totals.outsourcingAct,
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Production Order</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Store / Production Order</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" onClick={() => handleSave("Planned")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all disabled:opacity-50">
            <Save size={16} className="mr-2" /> Save Order
          </button>
          <button type="button" onClick={() => handleSave("In-Progress")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all disabled:opacity-50">
            <CheckCircle2 size={16} className="mr-2" /> Start Production
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-maroon-100 rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-maroon-800" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Production Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc No</label>
              <input value={formData.docNo} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completion Date</label>
              <input type="date" value={formData.completionDate} onChange={(e) => setFormData({...formData, completionDate: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select BOM (Recipe) *</label>
              <select value={formData.bomId} onChange={(e) => setFormData({...formData, bomId: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-maroon-800 outline-none transition-all">
                <option value="">-- Select Recipe --</option>
                {boms.map(b => (
                  <option key={b._id} value={b._id}>{b.bomName || b.docNo} (v{b.version})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Planned Qty *</label>
              <input type="number" value={formData.plannedQty} onChange={(e) => setFormData({...formData, plannedQty: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actual Output Qty</label>
              <input type="number" value={formData.actualQty} onChange={(e) => setFormData({...formData, actualQty: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</label>
              <select value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">-- Select Location --</option>
                {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <input value={formData.status} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase" />
            </div>
          </div>
        </section>

        {/* Section 2: Components */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers size={18} className="text-maroon-800" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Components (Estimated vs Actual)</h3>
            </div>
            <button onClick={addComponent} className="px-4 py-2 text-xs font-black bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-maroon-800 border border-slate-200 dark:border-slate-800 rounded-lg uppercase tracking-wider flex items-center transition-all">
              <Plus size={14} className="mr-1.5" /> Add Row
            </button>
          </div>
          <div className="grid grid-cols-12 gap-6 p-6">
            <div className="col-span-12 lg:col-span-9 overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th rowSpan={2} className="px-4 py-4 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8 text-center">#</th>
                    <th rowSpan={2} className="px-4 py-4 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[150px]">Component</th>
                    <th rowSpan={2} className="px-4 py-4 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-16 text-center">UOM</th>
                    <th rowSpan={2} className="px-2 py-4 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8 text-center">C</th>
                    <th colSpan={3} className="px-4 py-2 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center border-l border-slate-100 dark:border-slate-800">Estimated</th>
                    <th colSpan={3} className="px-4 py-2 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center border-l border-slate-100 dark:border-slate-800">Actual</th>
                    <th rowSpan={2} className="px-4 py-4 w-8 text-center"></th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/50/30 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-2 py-2 font-bold text-slate-400 dark:text-slate-500 text-center border-l border-slate-100 dark:border-slate-800">QTY</th>
                    <th className="px-2 py-2 font-bold text-slate-400 dark:text-slate-500 text-center">COST</th>
                    <th className="px-2 py-2 font-bold text-slate-400 dark:text-slate-500 text-center">TOTAL</th>
                    <th className="px-2 py-2 font-bold text-slate-400 dark:text-slate-500 text-center border-l border-slate-100 dark:border-slate-800">QTY</th>
                    <th className="px-2 py-2 font-bold text-slate-400 dark:text-slate-500 text-center">COST</th>
                    <th className="px-2 py-2 font-bold text-slate-400 dark:text-slate-500 text-center">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold">
                  {components.map((item, index) => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedLineId(item.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors cursor-pointer ${selectedLineId === item.id ? "bg-slate-100/80 dark:bg-slate-800/80" : ""}`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                      <td className="px-4 py-3">
                        <ItemSearchInput
                          value={availableItems.find(ai => ai._id === item.itemId)?.code || item.itemCode || ""}
                          availableItems={availableItems}
                          onSelect={(selected) => {
                            updateComponent(item.id, "itemId", selected._id);
                          }}
                          onChange={(val) => {
                            const matched = availableItems.find(ai => ai.code === val);
                            if (matched) updateComponent(item.id, "itemId", matched._id);
                          }}
                          placeholder="Search item..."
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input value={item.uom} onChange={(e) => updateComponent(item.id, "uom", e.target.value)} onFocus={() => setSelectedLineId(item.id)} className="w-full bg-transparent text-center focus:outline-none" placeholder="-" />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input type="checkbox" checked={item.isCritical} onChange={(e) => updateComponent(item.id, "isCritical", e.target.checked)} className="rounded border-slate-300 text-maroon-800" />
                      </td>
                      <td className="px-2 py-3 text-center border-l border-slate-100 dark:border-slate-800">
                        <input type="number" value={item.estQty} onChange={(e) => updateComponent(item.id, "estQty", parseFloat(e.target.value) || 0)} onFocus={() => setSelectedLineId(item.id)} className="w-full bg-transparent text-center focus:outline-none" />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input type="number" value={item.estCost} onChange={(e) => updateComponent(item.id, "estCost", parseFloat(e.target.value) || 0)} onFocus={() => setSelectedLineId(item.id)} className="w-full bg-transparent text-center focus:outline-none" />
                      </td>
                      <td className="px-2 py-3 text-right bg-slate-50 dark:bg-slate-800/50/20">
                        <span className="text-slate-900 dark:text-white">{item.estTotal.toLocaleString()}</span>
                      </td>
                      <td className="px-2 py-3 text-center border-l border-slate-100 dark:border-slate-800">
                        <input type="number" value={item.actQty} onChange={(e) => updateComponent(item.id, "actQty", parseFloat(e.target.value) || 0)} onFocus={() => setSelectedLineId(item.id)} className="w-full bg-transparent text-center focus:outline-none text-maroon-800 font-black" />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input type="number" value={item.actCost} onChange={(e) => updateComponent(item.id, "actCost", parseFloat(e.target.value) || 0)} onFocus={() => setSelectedLineId(item.id)} className="w-full bg-transparent text-center focus:outline-none" />
                      </td>
                      <td className="px-2 py-3 text-right bg-maroon-50/20">
                        <span className="text-maroon-800 font-black">{item.actTotal.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeComponent(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="col-span-12 lg:col-span-3">
              <ItemDetailsPanel item={selectedItemDetails} type="store" />
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50/50 flex flex-col items-end space-y-1 font-black uppercase tracking-tighter text-[10px]">
            <div className="flex justify-between w-64 text-slate-400 dark:text-slate-500">
              <span>Estimated Material</span>
              <span className="text-slate-900 dark:text-white">{totals.estMaterial.toLocaleString()}</span>
            </div>
            <div className="flex justify-between w-64 text-maroon-800">
              <span>Actual Material</span>
              <span className="text-maroon-800">{totals.actMaterial.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Section 3: Cost Summary */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cost Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cost Component</th>
                  <th className="px-6 py-4 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Estimated</th>
                  <th className="px-6 py-4 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actual</th>
                  <th className="px-6 py-4 font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {[
                  { label: "Material Cost", est: totals.estMaterial, act: totals.actMaterial },
                  { label: "Overhead Cost", est: totals.overheadEst, act: totals.overheadAct },
                  { label: "Outsourcing Cost", est: totals.outsourcingEst, act: totals.outsourcingAct },
                  { label: "Total Cost", est: finalTotals.est, act: finalTotals.act, isTotal: true },
                  { label: "Cost Per Unit", est: finalTotals.est / (formData.plannedQty || 1), act: finalTotals.act / (formData.actualQty || 1), isTotal: true },
                ].map((row, idx) => (
                  <tr key={idx} className={`${row.isTotal ? "bg-slate-50 dark:bg-slate-800/50/50" : ""} transition-colors`}>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 uppercase tracking-tighter text-xs">{row.label}</td>
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 dark:text-slate-500 font-mono">{row.est.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-mono">{row.act.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`px-6 py-4 text-right font-mono ${row.act - row.est > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {(row.act - row.est).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Notes */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Notes</h2>
          </div>
          <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional production notes..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-800/20 transition-all resize-none" />
        </section>
      </div>
    </div>
  );
}
