"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Scale, Tag, Info } from "lucide-react";

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit?: any;
  onSave?: (data: any) => void;
}

export default function UnitModal({ isOpen, onClose, unit, onSave }: UnitModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "Weight",
    isActive: true,
    description: "",
  });

  useEffect(() => {
    if (unit) {
      setFormData({
        code: unit.code || "",
        name: unit.name || "",
        type: unit.type || "Weight",
        isActive: unit.isActive !== undefined ? unit.isActive : true,
        description: unit.description || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        type: "Weight",
        isActive: true,
        description: "",
      });
    }
  }, [unit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
    onClose();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={unit ? "Edit Unit of Measure" : "Add New Unit"}
      size="md"
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
            {unit ? "Update Unit" : "Save Unit"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Unit Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 outline-none transition-all"
              placeholder="e.g. ctn"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Unit Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 outline-none transition-all"
              placeholder="e.g. carton"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Unit Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 outline-none transition-all"
            >
              <option>Weight</option>
              <option>Volume</option>
              <option>Count</option>
              <option>Length</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Active</label>
            <select
              value={formData.isActive ? "Yes" : "No"}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "Yes" })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 outline-none transition-all"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 outline-none transition-all min-h-[100px]"
            placeholder="Detailed description..."
          />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3">
          <Info className="text-slate-400 dark:text-slate-500 shrink-0" size={18} />
          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-relaxed">
            Units of Measure defines the units (Pcs, Ctn, Box, Kg, Litre etc.) that items can be sold or purchased in. Once defined here, you can attach multiple units to an item with conversion factors.
          </p>
        </div>
      </form>
    </ERPModal>
  );
}
