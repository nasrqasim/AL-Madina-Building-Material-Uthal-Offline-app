"use client";

import { LucideIcon } from "lucide-react";
import React from "react";

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "outline" | "danger";
}

interface ERPPageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string; // Support description as alias for subtitle
  actions?: ActionButton[] | React.ReactNode; // Support both object array and raw React nodes
}

export default function ERPPageHeader({ title, subtitle, description, actions }: ERPPageHeaderProps) {
  const displaySubtitle = subtitle || description;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {displaySubtitle && <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">{displaySubtitle}</p>}
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {Array.isArray(actions) ? (
            actions.map((action, index) => {
              const Icon = action.icon;
              const variantClasses = {
                primary: "bg-maroon-800 text-white hover:bg-maroon-900",
                secondary: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700",
                outline: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800",
                danger: "bg-red-600 text-white hover:bg-red-700",
              };
              const variant = action.variant || "outline";
              
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variantClasses[variant]}`}
                >
                  {Icon && <Icon size={18} />}
                  {action.label}
                </button>
              );
            })
          ) : (
            // If it's a raw React node (like a custom button)
            actions
          )}
        </div>
      )}
    </div>
  );
}
