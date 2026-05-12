"use client";

import { useState, useEffect, useRef } from "react";
import { LayoutGrid, X } from "lucide-react";

export const WIDGET_KEYS = [
  "executiveSummary",
  "kpiCards",
  "financialHealth",
  "salesIntelligence",
  "inventoryIntelligence",
  "cashFlow",
  "decisionSupport",
  "operationalMetrics",
  "activityFeed",
] as const;

export type WidgetKey = typeof WIDGET_KEYS[number];

const WIDGET_LABELS: Record<WidgetKey, string> = {
  executiveSummary: "Executive Summary",
  kpiCards: "KPI Cards",
  financialHealth: "Financial Health",
  salesIntelligence: "Sales Intelligence",
  inventoryIntelligence: "Inventory Intelligence",
  cashFlow: "Cash Flow",
  decisionSupport: "Decision Support",
  operationalMetrics: "Operational Metrics",
  activityFeed: "Activity Feed",
};

const DEFAULT_VISIBILITY: Record<WidgetKey, boolean> = {
  executiveSummary: true,
  kpiCards: true,
  financialHealth: true,
  salesIntelligence: true,
  inventoryIntelligence: true,
  cashFlow: true,
  decisionSupport: true,
  operationalMetrics: true,
  activityFeed: true,
};

const STORAGE_KEY = "dashboard-widget-visibility";

export function useWidgetVisibility() {
  const [visibility, setVisibility] = useState<Record<WidgetKey, boolean>>(DEFAULT_VISIBILITY);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setVisibility(JSON.parse(saved));
    } catch {}
  }, []);

  const toggle = (key: WidgetKey) => {
    setVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { visibility, toggle };
}

interface WidgetVisibilityPanelProps {
  visibility: Record<WidgetKey, boolean>;
  onToggle: (key: WidgetKey) => void;
}

export default function WidgetVisibilityPanel({ visibility, onToggle }: WidgetVisibilityPanelProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Widget Visibility"
        className={`p-2 rounded-lg transition-all ${
          open
            ? "bg-white/20 text-white"
            : "text-maroon-200 hover:bg-white/10 hover:text-white"
        }`}
      >
        <LayoutGrid size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[9999] w-[680px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Widget Visibility</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle sections on the dashboard</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Toggles Grid */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WIDGET_KEYS.map((key) => (
              <label
                key={key}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
              >
                {/* Toggle Switch */}
                <button
                  role="switch"
                  aria-checked={visibility[key]}
                  onClick={() => onToggle(key)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    visibility[key] ? "bg-maroon-700" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                      visibility[key] ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold transition-colors ${
                  visibility[key]
                    ? "text-slate-800 dark:text-slate-100"
                    : "text-slate-400 dark:text-slate-600"
                }`}>
                  {WIDGET_LABELS[key]}
                </span>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex items-center gap-3">
            <button
              onClick={() => {
                WIDGET_KEYS.forEach((k) => {
                  if (!visibility[k]) onToggle(k);
                });
              }}
              className="text-xs font-bold text-maroon-700 dark:text-maroon-400 hover:underline"
            >
              Show All
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => {
                WIDGET_KEYS.forEach((k) => {
                  if (visibility[k]) onToggle(k);
                });
              }}
              className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:underline"
            >
              Hide All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
