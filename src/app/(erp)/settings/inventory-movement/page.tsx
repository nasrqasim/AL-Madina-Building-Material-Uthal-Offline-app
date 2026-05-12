"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { 
  Settings, 
  Save, 
  RefreshCcw, 
  ShieldAlert,
  Info,
  TrendingUp,
  BarChart3,
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function InventoryMovementPage() {
  const [config, setConfig] = useState({
    valuationMethod: "Weighted Average",
    allowNegativeStock: false,
    autoAdjustShrinkage: true,
    enableBatchTracking: false,
    reorderAlerts: true
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetch("/api/settings/inventory")
      .then(res => res.json())
      .then(res => {
        if (res.ok) setConfig(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Inventory Movement Settings" 
        description="Configure stock valuation methods, negative stock rules, and movement automation."
        actions={
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-maroon-800 text-white rounded-xl font-black text-sm shadow-xl shadow-maroon-900/20 hover:bg-maroon-900 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        }
      />

      {isLoading ? (
        <div className="p-20 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Loading Settings...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Valuation Methods */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Valuation Method</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {["Weighted Average", "FIFO (First-In, First-Out)", "LIFO (Last-In, First-Out)"].map((method) => (
                <button
                  key={method}
                  onClick={() => setConfig({...config, valuationMethod: method})}
                  className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${
                    config.valuationMethod === method 
                      ? "border-maroon-800 bg-maroon-50/50" 
                      : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-sm font-black ${config.valuationMethod === method ? "text-maroon-800" : "text-slate-800 dark:text-slate-100"}`}>{method}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">
                      {method === "Weighted Average" ? "Cost is recalculated after every purchase." : "Items purchased first are sold first."}
                    </p>
                  </div>
                  {config.valuationMethod === method && (
                    <div className="w-6 h-6 bg-maroon-800 rounded-full flex items-center justify-center text-white">
                      <RefreshCcw size={14} className="animate-spin" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Movement Rules */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Stock Policies</h3>
            </div>

            <div className="space-y-6">
              {[
                { id: "allowNegativeStock", label: "Allow Negative Stock", desc: "Allow sales even if stock level is zero." },
                { id: "autoAdjustShrinkage", label: "Auto-adjust Shrinkage", desc: "Automatically create adjustment entries for damages." },
                { id: "enableBatchTracking", label: "Enable Batch Tracking", desc: "Track stock movements by batch and expiry date." },
                { id: "reorderAlerts", label: "Low Stock Alerts", desc: "Show notifications when stock falls below reorder point." },
              ].map((rule) => (
                <div key={rule.id} className="flex items-center justify-between gap-8 group">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-maroon-800 transition-colors">{rule.label}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">{rule.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(config as any)[rule.id]} 
                      onChange={(e) => setConfig({...config, [rule.id]: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-maroon-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-maroon-800"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4">
              <Info size={20} className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 shrink-0" />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-wider">
                Changing the valuation method mid-year will trigger a complete stock recalculation for all items. This may take a few minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">Inventory settings saved!</span>
        </div>
      )}
    </div>
  );
}

