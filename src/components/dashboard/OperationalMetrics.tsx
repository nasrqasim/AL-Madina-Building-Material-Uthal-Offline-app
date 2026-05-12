"use client";

import { CheckCircle2, Clock, RotateCcw, Star, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function OperationalMetrics() {
  const metrics = [
    { title: "Order Fulfillment", value: "98.2%", target: "95.0%", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Avg Delivery Time", value: "2.4 days", target: "4.0 days", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Return Rate", value: "1.8%", label: "Improving", icon: RotateCcw, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Customer Satisfaction", value: "4.8/5", label: "NPS: 72", icon: Star, color: "text-indigo-500", bg: "bg-indigo-50" },
  ];

  const distributions = [
    { label: "1-2 days", value: "35%", color: "bg-emerald-500" },
    { label: "2-3 days", value: "40%", color: "bg-emerald-600" },
    { label: "3-4 days", value: "18%", color: "bg-blue-500" },
    { label: "4+ days", value: "7%", color: "bg-amber-500" },
  ];

  const returnReasons = [
    { label: "Defective", value: "35%", color: "bg-rose-500" },
    { label: "Wrong Item", value: "25%", color: "bg-amber-500" },
    { label: "Changed Mind", value: "22%", color: "bg-indigo-500" },
    { label: "Damaged", value: "12%", color: "bg-emerald-500" },
  ];

  const ratings = [
    { star: 5, value: "40%", color: "bg-emerald-500" },
    { star: 4, value: "30%", color: "bg-emerald-400" },
    { star: 3, value: "20%", color: "bg-amber-400" },
    { star: 2, value: "7%", color: "bg-rose-400" },
    { star: 1, value: "3%", color: "bg-rose-600" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-full transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 dark:text-white tracking-tight">Operational Metrics</h2>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Performance and efficiency indicators</p>
          </div>
        </div>
        <Link 
          href="/reports/sales/operational-metrics" 
          className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors"
        >
          View More
          <ExternalLink size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-12">
        {metrics.map((metric) => (
          <div key={metric.title} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 group hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors">
            <div className={`p-2 rounded-xl ${metric.bg} dark:bg-slate-800 dark:text-slate-200 ${metric.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <metric.icon size={20} />
            </div>
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{metric.title}</h4>
            <div className="flex items-baseline gap-2">
               <span className="text-2xl font-black text-slate-800 dark:text-slate-100 dark:text-white">{metric.value}</span>
               {metric.target && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">Target: {metric.target}</span>}
               {metric.label && <span className={`text-[10px] font-bold ${metric.label === "Improving" ? "text-emerald-500" : "text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500"}`}>{metric.label}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-12">
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 dark:text-slate-200 mb-6">Delivery Time Distribution</h4>
          <div className="flex items-end justify-between h-32 gap-2">
            {distributions.map((item) => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div 
                  className={`w-full ${item.color} rounded-t-xl transition-all duration-1000 hover:opacity-80 cursor-pointer`}
                  style={{ height: item.value }}
                ></div>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 dark:text-slate-200">{item.value}</span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 dark:text-slate-200 mb-6">Return Reasons</h4>
          <div className="space-y-4">
            {returnReasons.map((reason) => (
              <div key={reason.label} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">{reason.label}</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 dark:text-slate-200">{reason.value}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${reason.color} rounded-full transition-all duration-1000`}
                    style={{ width: reason.value }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 dark:text-slate-200 mb-6">Rating Distribution</h4>
          <div className="space-y-3">
            {ratings.map((rating) => (
              <div key={rating.star} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-6">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{rating.star}</span>
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${rating.color} rounded-full transition-all duration-1000`}
                    style={{ width: rating.value }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 w-8">{rating.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
