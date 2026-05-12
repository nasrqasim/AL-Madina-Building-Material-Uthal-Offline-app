"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  CheckCircle2, 
  Activity,
  Clock,
  Package,
  Layers,
  Settings,
  TrendingUp,
  BarChart3,
  Calendar,
  Building,
  ClipboardCheck
} from "lucide-react";
import { printPage } from "@/lib/excel";

interface ProductionOrderDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductionOrderDetails({ record, onClose, onEdit }: ProductionOrderDetailsProps) {
  // Mock data for production breakdown
  const stages = [
    { name: "Material Issuance", status: "Completed", date: "2026-04-28 10:00 AM" },
    { name: "Blending / Processing", status: "Completed", date: "2026-04-28 02:00 PM" },
    { name: "Filling & Packaging", status: "Completed", date: "2026-04-28 05:00 PM" },
    { name: "Quality Inspection", status: "Completed", date: "2026-04-29 09:00 AM" }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen font-sans">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{record.docNo}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              record.status === "Completed" ? "bg-emerald-100 text-emerald-700" : 
              record.status === "In-Progress" ? "bg-orange-100 text-orange-700" :
              record.status === "Planned" ? "bg-blue-100 text-blue-700" :
              "bg-rose-100 text-rose-700"
            }`}>
              {record.status}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onEdit}
            className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all"
          >
            <Edit size={16} className="mr-2" /> Update Order
          </button>
          <button 
            onClick={printPage}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <Printer size={16} className="mr-2" /> Print PO
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Order Overview Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <section className="col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Production Target</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Finished Item</p>
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{record.finishedItem || record.itemName}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recipe: {record.bomName || record.remarks || "Standard"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Production Unit</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{record.location}</p>
              </div>
              <div className="space-y-1 pt-4">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Date</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date}</p>
              </div>
              <div className="space-y-1 pt-4 border-l border-slate-100 dark:border-slate-800 pl-8">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Efficiency</p>
                <p className="text-sm font-bold text-emerald-600">{(record.actualQty / record.plannedQty * 100).toFixed(1)}% Yield</p>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-maroon-50 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="text-maroon-800" size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target vs Actual</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{record.actualQty || 0}</span>
                <span className="text-lg font-bold text-slate-300">/ {record.plannedQty || record.qty}</span>
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Units Completed</p>
            </div>
          </section>
        </div>

        {/* Timeline / Progress */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Production Execution Timeline</h3>
          </div>
          <div className="p-8">
            <div className="space-y-8">
              {stages.map((stage, index) => (
                <div key={index} className="flex items-start gap-6 group relative">
                  {index !== stages.length - 1 && (
                    <div className="absolute left-6 top-12 w-[2px] h-[calc(100%-12px)] bg-slate-100 dark:bg-slate-800" />
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all ${
                    stage.status === "Completed" ? "bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                  }`}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{stage.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{stage.date}</span>
                    </div>
                    <p className={`text-xs font-bold mt-1 ${
                      stage.status === "Completed" ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {stage.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
