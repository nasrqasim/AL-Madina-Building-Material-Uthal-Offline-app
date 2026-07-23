"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, FolderPlus, Layers } from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  type: "main" | "sub";
  parentId?: string;
  categories?: any[];
}

export default function CategoryModal({ isOpen, onClose, onSave, type, parentId, categories = [] }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: type,
    parentId: parentId || "",
  });

  useEffect(() => {
    setFormData({
      name: "",
      code: "",
      type: type,
      parentId: parentId || "",
    });
  }, [type, parentId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      parentId: formData.parentId === "" ? null : formData.parentId
    };
    onSave(dataToSave);
    onClose();
    setFormData({ name: "", code: "", type, parentId: parentId || "" });
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "main" ? "Add Main Category" : "Add Sub-Category"}
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
          >
            <Save size={18} />
            Save Category
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Category Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              placeholder={type === "main" ? "e.g. LUBRICANTS" : "e.g. ENGINE OILS"}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Category Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              placeholder="e.g. LUB-01"
            />
          </div>
        </div>

        {type === "sub" && !parentId && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Parent Category *</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
            >
              <option value="">Select Parent Category</option>
              {(categories || []).filter(c => c.type === "main").map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </form>
    </ERPModal>
  );
}
