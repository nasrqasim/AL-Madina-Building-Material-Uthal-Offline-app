"use client";

import { useState, useEffect } from "react";
import DashboardHero from "@/components/dashboard/DashboardHero";
import StatsCards from "@/components/dashboard/StatsCards";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import QuickActions from "@/components/dashboard/QuickActions";
import QuickReports from "@/components/dashboard/QuickReports";
import FinancialHealth from "@/components/dashboard/FinancialHealth";
import SalesIntelligence from "@/components/dashboard/SalesIntelligence";
import InventoryIntelligence from "@/components/dashboard/InventoryIntelligence";
import CashFlowManagement from "@/components/dashboard/CashFlowManagement";
import DecisionSupport from "@/components/dashboard/DecisionSupport";
import OperationalMetrics from "@/components/dashboard/OperationalMetrics";
import { WIDGET_KEYS, WidgetKey } from "@/components/dashboard/WidgetVisibilityPanel";
import WebsiteSnapshot from "@/components/dashboard/WebsiteSnapshot";

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

interface DashboardClientContentProps {
  userName: string;
}

export default function DashboardClientContent({ userName }: DashboardClientContentProps) {
  const [visibility, setVisibility] = useState<Record<WidgetKey, boolean>>(DEFAULT_VISIBILITY);
  const [selectedDate, setSelectedDate] = useState("2026-06-17");

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setVisibility(JSON.parse(saved));
    } catch {}

    // Listen for visibility changes from ERPLayout → TopBar → Panel
    const handler = (e: any) => {
      if (e.detail) setVisibility(e.detail);
    };
    window.addEventListener("widget-visibility-changed", handler);
    return () => window.removeEventListener("widget-visibility-changed", handler);
  }, []);

  const show = (key: WidgetKey) => visibility[key];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero always visible */}
      <DashboardHero userName={userName} />

      {/* Daily Report Date Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Trouble Shooting Report</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrevDay}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 transition-colors"
          >
            &lt;&lt;
          </button>
          <input 
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl text-sm font-bold focus:outline-none dark:text-white"
          />
          <button 
            onClick={handleNextDay}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 transition-colors"
          >
            &gt;&gt;
          </button>
        </div>
      </div>

      {/* Stats Cards — executiveSummary */}
      {show("kpiCards") && <StatsCards selectedDate={selectedDate} />}

      {/* Activity Feed + Quick Actions — activityFeed */}
      {show("activityFeed") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      )}

      {/* Quick Reports */}
      {show("executiveSummary") && <QuickReports />}

      {/* Financial Health + Sales Intelligence */}
      {(show("financialHealth") || show("salesIntelligence")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {show("financialHealth") && <FinancialHealth />}
          {show("salesIntelligence") && <SalesIntelligence />}
        </div>
      )}

      {/* Inventory Intelligence + Cash Flow */}
      {(show("inventoryIntelligence") || show("cashFlow")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {show("inventoryIntelligence") && <InventoryIntelligence />}
          {show("cashFlow") && <CashFlowManagement />}
        </div>
      )}

      {/* Decision Support + Operational Metrics */}
      {(show("decisionSupport") || show("operationalMetrics")) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {show("decisionSupport") && (
            <div className="lg:col-span-2">
              <DecisionSupport />
            </div>
          )}
          {show("operationalMetrics") && (
            <div>
              <OperationalMetrics />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 py-6 border-t border-slate-200 dark:border-slate-800 no-print">
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
          Financial Year:{" "}
          <span className="text-slate-600 dark:text-slate-300 font-bold">Jan 1, 2025 - Jan 1, 2027</span>
        </p>
      </footer>

      {/* Hidden for screen, shown for print/PDF export */}
      <WebsiteSnapshot />
    </div>
  );
}
