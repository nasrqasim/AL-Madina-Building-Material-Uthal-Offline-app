"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Layers,
  Box,
  ClipboardList
} from "lucide-react";

interface BOMComponent {
  id: string;
  itemId: string;
  description: string;
  qty: number;
  unit: string;
  wastePercent: number;
}

interface BOMFormProps {
  onClose: () => void;
}

export default function BOMForm({ onClose }: BOMFormProps) {
  const [components, setComponents] = useState<BOMComponent[]>([
    { id: "1", itemId: "", description: "", qty: 1, unit: "ltr", wastePercent: 0 }
  ]);
  
  const [formData, setFormData] = useState({
    bomNo: "Auto-generated",
    name: "",
    finishedGoodId: "",
    batchSize: 1,
    unit: "pcs",
    notes: "",
    isActive: true
  });

  const addComponent = () => setComponents([...components, { id: Date.now().toString(), itemId: "", description: "", qty: 1, unit: "ltr", wastePercent: 0 }]);
  const removeComponent = (id: string) => setComponents(components.filter(c => c.id !== id));
  
  const updateComponent = (id: string, field: keyof BOMComponent, value: any) => {
    setComponents(components.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Bill of Materials (BOM)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Store / BOM</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/20">
            <Save size={16} className="mr-2" /> Save BOM
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
        {/* Section 1: BOM Header */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-maroon-100 rounded-lg flex items-center justify-center">
              <Layers size={18} className="text-maroon-800" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">BOM Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">BOM Name / Formula Name *</label>
              <input placeholder="e.g., Premium 10W-40 Synthetic Mix" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-maroon-800/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Finished Good *</label>
              <select value={formData.finishedGoodId} onChange={(e) => setFormData({...formData, finishedGoodId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">Select Item</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Batch Quantity</label>
              <div className="flex gap-2">
                <input type="number" value={formData.batchSize} onChange={(e) => setFormData({...formData, batchSize: parseFloat(e.target.value) || 1})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-24 px-2 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold uppercase">
                  <option value="pcs">pcs</option>
                  <option value="ltr">ltr</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Components List */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box size={20} className="text-slate-400 dark:text-slate-500" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Raw Materials / Components</h3>
            </div>
            <button onClick={addComponent} className="px-4 py-2 text-xs font-black bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-maroon-800 border border-slate-200 dark:border-slate-800 rounded-lg uppercase tracking-wider flex items-center transition-all">
              <Plus size={14} className="mr-1.5" /> Add Component
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Component Item</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Notes</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-24 text-center">Qty Required</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-24 text-center">Unit</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-24 text-center">Waste %</th>
                  <th className="px-6 py-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {components.map((comp, index) => (
                  <tr key={comp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-6 py-4">
                      <select value={comp.itemId} onChange={(e) => updateComponent(comp.id, "itemId", e.target.value)} className="w-full bg-transparent text-sm font-bold focus:outline-none">
                        <option value="">Select Raw Material</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input placeholder="Component details" value={comp.description} onChange={(e) => updateComponent(comp.id, "description", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={comp.qty} onChange={(e) => updateComponent(comp.id, "qty", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-maroon-800 focus:outline-none text-center" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">{comp.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={comp.wastePercent} onChange={(e) => updateComponent(comp.id, "wastePercent", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-bold focus:outline-none text-center" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => removeComponent(comp.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Additional Notes */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <ClipboardList size={18} className="text-slate-400 dark:text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Production Instructions</h2>
          </div>
          <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Mixing instructions, safety precautions, or special handling notes..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-800/20 transition-all resize-none" />
        </section>
      </div>
    </div>
  );
}
