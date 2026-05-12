"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Plus, Trash2, Calendar, GitPullRequest, MapPin, Building2, User, Briefcase } from "lucide-react";

interface BranchTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer?: any;
  onSave?: (data: any) => void;
}

export default function BranchTransferModal({ isOpen, onClose, transfer, onSave }: BranchTransferModalProps) {
  const [formData, setFormData] = useState({
    docNo: "Auto-generated",
    date: new Date().toISOString().split("T")[0],
    fromBranch: "",
    fromLocation: "",
    toBranch: "",
    toLocation: "",
    reason: "",
    status: "Draft",
    employee: "",
    job: "",
    notes: "",
    items: [
      { id: "1", item: "", description: "", qty: 1, unitCost: 0, total: 0 }
    ]
  });

  useEffect(() => {
    if (transfer) {
      setFormData(transfer);
    } else {
      setFormData({
        docNo: "Auto-generated",
        date: new Date().toISOString().split("T")[0],
        fromBranch: "",
        fromLocation: "",
        toBranch: "",
        toLocation: "",
        reason: "",
        status: "Draft",
        employee: "",
        job: "",
        notes: "",
        items: [
          { id: "1", item: "", description: "", qty: 1, unitCost: 0, total: 0 }
        ]
      });
    }
  }, [transfer, isOpen]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { id: Date.now().toString(), item: "", description: "", qty: 1, unitCost: 0, total: 0 }
      ]
    });
  };

  const handleRemoveItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    });
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "qty" || field === "unitCost") {
          updatedItem.total = Number(updatedItem.qty) * Number(updatedItem.unitCost);
        }
        return updatedItem;
      }
      return item;
    });
    setFormData({ ...formData, items: updatedItems });
  };

  const totalValue = formData.items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({ ...formData, totalValue });
    }
    onClose();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={transfer ? "Edit Branch Transfer" : "New Branch Transfer"}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-xl transition-all">
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-maroon-50 text-maroon-800 rounded-xl text-sm font-black hover:bg-maroon-100 transition-all"
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
            >
              <Save size={18} />
              Dispatch
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-2 space-y-8">
        {/* Transfer Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em] flex items-center gap-2">
            <GitPullRequest size={14} />
            Transfer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Doc No</label>
              <input
                type="text"
                value={formData.docNo}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-400 dark:text-slate-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} />
                Source (From)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Branch</label>
                  <select
                    value={formData.fromBranch}
                    onChange={(e) => setFormData({ ...formData, fromBranch: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                    required
                  >
                    <option value="">Select</option>
                    <option>Lahore Branch</option>
                    <option>Karachi Branch</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Location</label>
                  <select
                    value={formData.fromLocation}
                    onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                    required
                  >
                    <option value="">Select</option>
                    <option>Main Warehouse</option>
                    <option>Stock Yard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-maroon-50/30 rounded-2xl border border-maroon-100/50 space-y-4">
              <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} />
                Destination (To)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Branch</label>
                  <select
                    value={formData.toBranch}
                    onChange={(e) => setFormData({ ...formData, toBranch: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                    required
                  >
                    <option value="">Select</option>
                    <option>Karachi Branch</option>
                    <option>Islamabad Branch</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Location</label>
                  <select
                    value={formData.toLocation}
                    onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                    required
                  >
                    <option value="">Select</option>
                    <option>Showroom A</option>
                    <option>Regional Store</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for transfer"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Employee</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                  <select
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                  >
                    <option value="">-- Select --</option>
                    <option>Nasrullah Qasim</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Job</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                  <select
                    value={formData.job}
                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all"
                  >
                    <option value="">-- Select --</option>
                    <option>Transfer Job 01</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em] flex items-center gap-2">
              <Plus size={14} />
              Items
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-1.5 bg-maroon-50 text-maroon-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-maroon-100 transition-all border border-maroon-200"
            >
              + Add Row
            </button>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/50/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white">#</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white">Item</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white">Description</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white text-center">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-white text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Total</th>
                  <th className="px-4 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-white dark:bg-slate-900 transition-colors group">
                    <td className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500">{index + 1}</td>
                    <td className="px-2 py-2">
                      <select
                        value={item.item}
                        onChange={(e) => handleItemChange(item.id, "item", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold focus:ring-0 outline-none"
                      >
                        <option value="">Select Item</option>
                        <option>Mobil Special 20W-50</option>
                        <option>Shell Helix HX5</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                        placeholder="Description"
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold focus:ring-0 outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 w-20">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold text-center focus:ring-0 outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 w-28 text-right">
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(item.id, "unitCost", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-none text-xs font-bold text-right focus:ring-0 outline-none font-mono"
                      />
                    </td>
                    <td className="px-4 py-2 text-xs font-black text-slate-900 dark:text-white text-right font-mono">
                      {item.total.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/30 font-black">
                  <td colSpan={5} className="px-4 py-3 text-[10px] text-slate-900 dark:text-white uppercase tracking-widest text-right">Total Transfer Value (PKR)</td>
                  <td className="px-4 py-3 text-sm text-maroon-800 text-right font-black font-mono">
                    {totalValue.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </form>
    </ERPModal>
  );
}
