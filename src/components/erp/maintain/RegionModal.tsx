"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Map, Hash, FileText } from "lucide-react";

interface RegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  region?: any;
  onSave?: (data: any) => void;
}

export default function RegionModal({ isOpen, onClose, region, onSave }: RegionModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    if (region) {
      setFormData({
        code: region.code || "",
        name: region.name || "",
        description: region.description || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
      });
    }
  }, [region, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={region ? "Edit Region" : "Add Region"}
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-xl transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
          >
            Save
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-2 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Region Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            placeholder="REG-002"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Region Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
            placeholder="Enter region name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all min-h-[120px] resize-none"
            placeholder="Enter description"
          />
        </div>
      </form>
    </ERPModal>
  );
}
