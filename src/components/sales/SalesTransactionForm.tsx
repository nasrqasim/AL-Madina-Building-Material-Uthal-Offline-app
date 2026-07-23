"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  ShoppingCart,
  User,
  Calendar,
  FileText,
  Percent,
  Calculator,
  RotateCcw
} from "lucide-react";

interface SalesItem {
  id: string;
  itemId: string;
  description: string;
  qty: number;
  rate: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
}

interface SalesTransactionFormProps {
  title: string;
  onClose: () => void;
}

export default function SalesTransactionForm({ title, onClose }: SalesTransactionFormProps) {
  const [items, setItems] = useState<SalesItem[]>([
    { id: "1", itemId: "", description: "", qty: 1, rate: 0, taxPercent: 17, taxAmount: 0, total: 0 }
  ]);
  
  const [formData, setFormData] = useState({
    docNo: "Auto-generated",
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    reference: "",
    notes: "",
    status: "draft"
  });

  const addItem = () => setItems([...items, { id: Date.now().toString(), itemId: "", description: "", qty: 1, rate: 0, taxPercent: 17, taxAmount: 0, total: 0 }]);
  const removeLine = (id: string) => setItems((items || []).filter(i => i.id !== id));
  
  const updateItem = (id: string, field: keyof SalesItem, value: any) => {
    setItems((items || []).map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        updated.taxAmount = (updated.qty * updated.rate) * (updated.taxPercent / 100);
        updated.total = (updated.qty * updated.rate) + updated.taxAmount;
        return updated;
      }
      return i;
    }));
  };

  const subtotal = (items || []).reduce((sum, i) => sum + (i.qty * i.rate), 0);
  const totalTax = (items || []).reduce((sum, i) => sum + i.taxAmount, 0);
  const grandTotal = subtotal + totalTax;

  const isReturn = title.toLowerCase().includes("return");

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isReturn ? `New ${title}` : `New ${title}`}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Sales / {title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center transition-all">
            <X size={16} className="mr-2" /> Cancel
          </button>
          <button type="button" className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/20 transition-all">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" className={`px-4 py-2 text-sm font-bold text-white ${isReturn ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"} rounded-lg flex items-center shadow-lg transition-all`}>
            {isReturn ? <RotateCcw size={16} className="mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
            {isReturn ? "Post Return" : `Post ${title}`}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
        {/* Section 1: Transaction Details */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
          <div className="flex items-center space-x-2 mb-6">
            <div className={`w-8 h-8 ${isReturn ? "bg-rose-100 text-rose-800" : "bg-maroon-100 text-maroon-800"} rounded-lg flex items-center justify-center`}>
              {isReturn ? <RotateCcw size={18} /> : <ShoppingCart size={18} />}
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title} Header</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Document No</label>
              <input value={formData.docNo} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-maroon-800/20 transition-all outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer *</label>
              <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-maroon-800/20 outline-none">
                <option value="">Select Customer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reference / PO #</label>
              <input placeholder="Enter reference" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-maroon-800/20 outline-none" />
            </div>
          </div>
        </section>

        {/* Section 2: Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Line Items</h3>
            <button onClick={addItem} className="px-4 py-2 text-xs font-black bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-maroon-800 border border-slate-200 dark:border-slate-800 rounded-lg uppercase tracking-wider flex items-center transition-all">
              <Plus size={14} className="mr-1.5" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Item / Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-24 text-center">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Rate</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-24 text-center">Tax %</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-32 text-right">Total</th>
                  <th className="px-6 py-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(items || []).map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <select value={item.itemId} onChange={(e) => updateItem(item.id, "itemId", e.target.value)} className="w-full bg-transparent text-sm font-bold focus:outline-none">
                          <option value="">Select Item</option>
                        </select>
                        <input placeholder="Details" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="w-full bg-transparent text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 focus:outline-none" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-center focus:outline-none" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-right focus:outline-none" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={item.taxPercent} onChange={(e) => updateItem(item.id, "taxPercent", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-bold text-center focus:outline-none text-slate-400 dark:text-slate-500" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => removeLine(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Totals & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-fit">
            <div className="flex items-center space-x-2 mb-2">
              <FileText size={18} className="text-slate-400 dark:text-slate-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Remarks</h2>
            </div>
            <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes or terms & conditions..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-800/20 transition-all resize-none outline-none" />
          </section>

          <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-slate-900/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center text-sm font-bold opacity-60">
                <span className="uppercase tracking-[0.2em]">Subtotal</span>
                <span>PKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold opacity-60">
                <span className="uppercase tracking-[0.2em]">Sales Tax (17%)</span>
                <span>PKR {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-maroon-400">Total Payable</span>
                  <span className="text-4xl font-black tracking-tighter mt-1">
                    <span className="text-base font-bold mr-2 opacity-40">PKR</span>
                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900/5 rounded-2xl backdrop-blur-md">
                   <Calculator size={32} className="text-maroon-400" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
