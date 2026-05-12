"use client";

import { useState } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Plus, Trash2, Info, Calculator, FileText } from "lucide-react";

interface ImportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: any;
}

export default function ImportTemplateModal({ isOpen, onClose, template }: ImportTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: template?.name || "",
    isDefault: template?.isDefault || false,
    isActive: template?.isActive !== undefined ? template.isActive : true,
    notes: template?.notes || "",
    charges: template?.charges || [
      { name: "", type: "Amount", value: 0, base: "CIF Value", payableAccount: "", capitalize: true, claimAccount: "", allocation: "By Value" }
    ],
  });

  const addCharge = () => {
    setFormData({
      ...formData,
      charges: [...formData.charges, { name: "", type: "Amount", value: 0, base: "CIF Value", payableAccount: "", capitalize: true, claimAccount: "", allocation: "By Value" }]
    });
  };

  const removeCharge = (index: number) => {
    setFormData({
      ...formData,
      charges: formData.charges.filter((_: any, i: number) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving template:", formData);
    onClose();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? "Edit Import Template" : "New Import Charge Template"}
      size="2xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-slate-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-maroon-800 text-white rounded-lg text-sm font-medium hover:bg-maroon-900 transition-colors shadow-lg shadow-maroon-900/20"
          >
            <Save size={18} />
            {template ? "Update Template" : "Save Template"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 outline-none transition-all"
                placeholder="e.g. Standard Import Duties"
                required
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tmpl-default"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-maroon-800 focus:ring-maroon-500"
                />
                <label htmlFor="tmpl-default" className="text-sm font-medium text-slate-700 dark:text-slate-200">Set as default</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tmpl-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-maroon-800 focus:ring-maroon-500"
                />
                <label htmlFor="tmpl-active" className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 outline-none transition-all min-h-[85px]"
              placeholder="Internal notes about this template..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator size={18} className="text-maroon-800" />
              Import Charges Configuration
            </h4>
            <button
              type="button"
              onClick={addCharge}
              className="flex items-center gap-2 px-3 py-1.5 bg-maroon-800 text-white rounded-lg text-xs font-bold hover:bg-maroon-900 transition-all shadow-sm"
            >
              <Plus size={14} />
              Add Charge
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 w-12">#</th>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 min-w-[150px]">Charge Name</th>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">Type</th>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">Value</th>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">Base</th>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 min-w-[200px]">Payable Account (Cr)</th>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 text-center">Cap.</th>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">Allocation</th>
                  <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.charges.map((charge: any, idx: number) => (
                  <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-all">
                    <td className="px-4 py-3 font-medium text-slate-400 dark:text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        value={charge.name}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 focus:border-maroon-500 outline-none" 
                        placeholder="Custom Duty"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-1 py-1 focus:border-maroon-500 outline-none">
                        <option>Amount</option>
                        <option>Percent</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 focus:border-maroon-500 outline-none" />
                    </td>
                    <td className="px-4 py-3">
                      <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-1 py-1 focus:border-maroon-500 outline-none">
                        <option>CIF Value</option>
                        <option>CIF + Prior</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 focus:border-maroon-500 outline-none">
                        <option>Select Account</option>
                        <option>11101001 - Cash in Hand</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={charge.capitalize} className="w-4 h-4 rounded text-maroon-800" />
                    </td>
                    <td className="px-4 py-3">
                      <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-1 py-1 focus:border-maroon-500 outline-none text-xs">
                        <option>By Value</option>
                        <option>By Weight</option>
                        <option>By Volume</option>
                        <option>Manual</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeCharge(idx)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-4">
            <Info className="text-blue-600 shrink-0" size={20} />
            <div className="space-y-2">
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Payable Account (Cr)</span> — always required. The liability/credit side: who you owe (Customs Payable, Freight Payable, Bank if paid).
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Claim Account (Dr)</span> — required only when <span className="italic">Capitalize</span> is OFF. The input/receivable side you&apos;ll claim later (GST Input, WHT Receivable). When <span className="italic">Capitalize</span> is ON, the Dr side automatically flows to Inventory Control via landed cost.
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Base</span> applies only to % charges. <span className="italic">CIF + Prior Charges</span> = cumulative — the row sees CIF plus the total of every charge listed above it. Order rows accordingly: duties first, then dependent taxes, then freight/clearing.
              </p>
            </div>
          </div>
        </div>
      </form>
    </ERPModal>
  );
}
