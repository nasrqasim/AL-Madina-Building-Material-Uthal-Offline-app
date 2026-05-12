"use client";

import { LucideIcon } from "lucide-react";

interface ERPStatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: "maroon" | "green" | "blue" | "orange" | "slate";
  subtitle?: string;
}

export default function ERPStatCard({ 
  label, 
  value, 
  icon: Icon, 
  variant = "slate",
  subtitle 
}: ERPStatCardProps) {
  const variantClasses = {
    maroon: "bg-maroon-50 dark:bg-maroon-900/20 text-maroon-600 dark:text-maroon-400 border-maroon-100 dark:border-maroon-900/30",
    green: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30",
    slate: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800 dark:border-slate-700",
  };

  const iconVariantClasses = {
    maroon: "bg-maroon-100 dark:bg-maroon-800 text-maroon-700 dark:text-maroon-200",
    green: "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200",
    blue: "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200",
    orange: "bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200",
    slate: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${variantClasses[variant]}`}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`p-3 rounded-xl ${iconVariantClasses[variant]}`}>
            <Icon size={24} />
          </div>
        )}
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <h4 className="text-2xl font-bold mt-0.5">{value}</h4>
          {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
