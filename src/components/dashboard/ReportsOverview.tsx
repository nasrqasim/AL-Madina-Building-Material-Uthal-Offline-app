"use client";

import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function ReportsOverview() {
  const deliveryData = [
    { name: "1-2 days", value: 35, color: "#22c55e" },
    { name: "2-3 days", value: 40, color: "#22c55e" },
    { name: "3-4 days", value: 18, color: "#06b6d4" },
    { name: "4+ days", value: 7, color: "#eab308" },
  ];

  const returnReasons = [
    { label: "Defective", value: 35, color: "bg-rose-500" },
    { label: "Wrong Item", value: 25, color: "bg-orange-500" },
    { label: "Changed Mind", value: 22, color: "bg-amber-500" },
    { label: "Damaged", value: 12, color: "bg-emerald-500" },
  ];

  const ratings = [
    { stars: 5, value: 40, color: "bg-emerald-500" },
    { stars: 4, value: 30, color: "bg-emerald-400" },
    { stars: 3, value: 20, color: "bg-amber-400" },
    { stars: 2, value: 7, color: "bg-orange-400" },
    { stars: 1, value: 3, color: "bg-rose-400" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-8 tracking-tight">Reports Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Delivery Time Distribution */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Delivery Time Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deliveryData}>
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {deliveryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {deliveryData.map((item) => (
              <div key={item.name} className="text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{item.name}</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{item.value}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Return Reasons */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Return Reasons</h3>
          <div className="space-y-4">
            {returnReasons.map((reason) => (
              <div key={reason.label} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300">{reason.label}</span>
                  <span className="text-slate-800 dark:text-slate-100">{reason.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${reason.color} transition-all duration-1000`} 
                    style={{ width: `${reason.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rating Distribution</h3>
          <div className="space-y-3">
            {ratings.map((rating) => (
              <div key={rating.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-8">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{rating.stars}</span>
                  <span className="text-amber-400 text-xs">⭐</span>
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${rating.color} transition-all duration-1000`} 
                    style={{ width: `${rating.value}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-8 text-right">{rating.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
