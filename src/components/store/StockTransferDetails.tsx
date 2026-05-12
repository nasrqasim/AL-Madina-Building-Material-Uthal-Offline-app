"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  CheckCircle2, 
  Truck,
  Package,
  ArrowRightLeft,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  AlertCircle,
  FileText,
  User
} from "lucide-react";
import { printPage } from "@/lib/excel";

interface StockTransferDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function StockTransferDetails({ record, onClose, onEdit }: StockTransferDetailsProps) {
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
              record.status === "Received" ? "bg-emerald-100 text-emerald-700" : 
              record.status === "Dispatched" ? "bg-blue-100 text-blue-700" : 
              "bg-orange-100 text-orange-700"
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
              <Edit size={16} className="mr-2" /> Edit Transfer
            </button>
          )}
          <button 
            onClick={printPage}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <Printer size={16} className="mr-2" /> Print Gate Pass
          </button>
          {record.status === "Dispatched" && (
            <button className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
              <CheckCircle2 size={16} className="mr-2" /> Mark as Received
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Route Visualization */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
             <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
               <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                 <Building size={32} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Source Location</p>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white">{record.fromLocation}</h2>
               </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center space-x-4 w-full px-12">
                   <div className="h-[2px] bg-slate-100 dark:bg-slate-800 flex-1 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-200" />
                   </div>
                   <div className="w-12 h-12 bg-white dark:bg-slate-900 border-2 border-blue-600 rounded-full flex items-center justify-center text-blue-600 shadow-xl shadow-blue-600/10 z-10 animate-pulse">
                      <Truck size={24} />
                   </div>
                   <div className="h-[2px] bg-slate-100 dark:bg-slate-800 flex-1 relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-200" />
                   </div>
                </div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                  Transit in Progress
                </p>
             </div>

             <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right space-y-4">
               <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                 <MapPin size={32} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Destination</p>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white">{record.toLocation}</h2>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-slate-50">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                   <Calendar size={18} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transfer Date</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date}</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                   <User size={18} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Driver / Logistics</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-white">Muhammad Ali (Ex-782)</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                   <FileText size={18} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transfer Value</p>
                   <p className="text-sm font-black text-maroon-800 uppercase">Rs. {record.totalValue?.toLocaleString()}</p>
                </div>
             </div>
          </div>
        </section>

        {/* Transfer Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Transferred Commodities</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Item Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Unit</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Unit Value</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold uppercase tracking-tight">{item.description || item.itemName || item.name}</td>
                    <td className="px-8 py-6 text-sm text-blue-600 text-center">{item.qty}</td>
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
