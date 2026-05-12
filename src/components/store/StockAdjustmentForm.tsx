"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, X, CheckCircle2, Layers, AlertTriangle, Scale } from "lucide-react";

interface AdjustmentItem {
  id: string;
  itemId: string;
  description: string;
  qty: number;
  unitCost: number;
  total: number;
}

interface StockAdjustmentFormProps {
  onClose: () => void;
}

export default function StockAdjustmentForm({ onClose }: StockAdjustmentFormProps) {
  const [items, setItems] = useState<AdjustmentItem[]>([
    { id: "1", itemId: "", description: "", qty: 1, unitCost: 0, total: 0 }
  ]);
  
  const [formData, setFormData] = useState({
    docNo: "Auto-generated",
    date: new Date().toISOString().split("T")[0],
    type: "Found",
    status: "draft",
    reason: "",
    employeeId: "",
    jobId: "",
    locationId: ""
  });

  const addItem = () => setItems([...items, { id: Date.now().toString(), itemId: "", description: "", qty: 1, unitCost: 0, total: 0 }]);
  const removeLine = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const updateItem = (id: string, field: keyof AdjustmentItem, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        updated.total = updated.qty * updated.unitCost;
        return updated;
      }
      return i;
    }));
  };

  const totalValue = items.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Add Stock Adjustment</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Store / Add Stock</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/20">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/20">
            <CheckCircle2 size={16} className="mr-2" /> Save & Post
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
        {/* Section 1: Adjustment Details */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-maroon-100 rounded-lg flex items-center justify-center">
              <Layers size={18} className="text-maroon-800" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Adjustment Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc No</label>
              <input value={formData.docNo} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-maroon-800/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="Found">Found</option>
                <option value="Lost">Lost</option>
                <option value="Damaged">Damaged</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <input value={formData.status} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason *</label>
              <input placeholder="Reason for adjustment" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</label>
              <select value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">-- Select Employee --</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job</label>
              <select value={formData.jobId} onChange={(e) => setFormData({...formData, jobId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">-- Select Job --</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location *</label>
              <select value={formData.locationId} onChange={(e) => setFormData({...formData, locationId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                <option value="">-- Select Location --</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Items */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Items</h3>
            <button onClick={addItem} className="px-4 py-2 text-xs font-black bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-maroon-800 border border-slate-200 dark:border-slate-800 rounded-lg uppercase tracking-wider flex items-center transition-all">
              <Plus size={14} className="mr-1.5" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Item</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-24">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Unit Cost</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Total</th>
                  <th className="px-6 py-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-6 py-4">
                      <select value={item.itemId} onChange={(e) => updateItem(item.id, "itemId", e.target.value)} className="w-full bg-transparent text-sm focus:outline-none">
                        <option value="">Select Item</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm focus:outline-none text-center" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input type="number" value={item.unitCost} onChange={(e) => updateItem(item.id, "unitCost", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm focus:outline-none text-right" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => removeLine(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50/50 flex flex-col items-end space-y-3">
            <div className="flex justify-between w-full md:w-80 text-sm">
              <span className="font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Total Value (PKR)</span>
              <span className="font-black text-slate-900 dark:text-white">{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* Section 3: Notes */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Notes</h2>
          </div>
          <textarea rows={4} placeholder="Internal notes..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-800/20 transition-all resize-none" />
        </section>
      </div>
    </div>
  );
}
