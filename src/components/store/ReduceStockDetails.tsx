"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  CheckCircle2, 
  ClipboardList,
  Package,
  TrendingDown,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  AlertCircle,
  FileText,
  XCircle
} from "lucide-react";
import { printPage } from "@/lib/excel";

interface ReduceStockDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function ReduceStockDetails({ record, onClose, onEdit }: ReduceStockDetailsProps) {
  const items = record.lines || record.items || [];

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
              record.status === "Posted" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
            }`}>
              {record.status}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {record.status === "Draft" && (
            <button 
              onClick={onEdit}
              className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg shadow-maroon-800/10 transition-all"
            >
              <Edit size={16} className="mr-2" /> Edit Adjustment
            </button>
          )}
          <button 
            onClick={printPage}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <Printer size={16} className="mr-2" /> Print Voucher
          </button>
          {record.status === "Draft" && (
            <button className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center shadow-lg shadow-rose-600/10 transition-all">
              <ShieldCheck size={16} className="mr-2" /> Post to Ledger
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Adjustment Summary */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-600" />
          <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Stock Reduction Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reduction Type</p>
              <p className="text-sm font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-lg inline-block">{record.type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Adjustment Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source Warehouse</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-sans">{record.location}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Valuation Loss</p>
              <p className="text-xl font-black text-rose-700 tracking-tighter">Rs. {record.totalValue?.toLocaleString()}</p>
            </div>

            <div className="col-span-1 md:col-span-4 space-y-2 pt-4 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason / Memo</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl italic">&quot;{record.reason}&quot;</p>
            </div>
          </div>
        </section>

        {/* Adjusted Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Outflow Item Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Item Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty Reduced</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Unit</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Unit Value</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description || item.itemName || item.name}</td>
                    <td className="px-8 py-6 text-sm text-rose-600 text-center">-{item.qty}</td>
                    <td className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest">{item.unit || item.uom}</td>
                    <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{(item.unitPrice || item.rate || item.unitValue || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white text-right">{(item.total || item.netAmount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
