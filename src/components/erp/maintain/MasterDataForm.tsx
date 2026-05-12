"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  MapPin,
  Building,
  Briefcase,
  FileText
} from "lucide-react";

interface MasterDataFormProps {
  title: string;
  onClose: () => void;
}

export default function MasterDataForm({ title, onClose }: MasterDataFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true
  });

  const getIcon = () => {
    switch (title.toLowerCase()) {
      case "region": return <MapPin size={24} />;
      case "location": return <Building size={24} />;
      case "job": return <Briefcase size={24} />;
      default: return <FileText size={24} />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300 dark:text-slate-400 dark:text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New {title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Maintain / {title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button className="px-6 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg shadow-lg shadow-maroon-800/20 transition-all flex items-center gap-2">
            <Save size={16} /> Save {title}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-maroon-100 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-400 rounded-2xl">
              {getIcon()}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{title} Profile</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">Define basic information for the {title.toLowerCase()}.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title} Name *</label>
              <input 
                placeholder={`Enter ${title.toLowerCase()} name`} 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Code</label>
              <input 
                placeholder="Code" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
              <div className="flex items-center gap-2 mt-3">
                <input 
                  type="checkbox" 
                  checked={formData.isActive} 
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-300 text-maroon-800 focus:ring-maroon-800" 
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Active</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description / Additional Info</label>
            <textarea 
              rows={4} 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl text-sm font-medium resize-none outline-none focus:ring-4 focus:ring-maroon-800/5 transition-all dark:text-white" 
              placeholder={`Enter details about this ${title.toLowerCase()}...`}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
