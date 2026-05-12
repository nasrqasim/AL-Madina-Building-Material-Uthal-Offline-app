"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  CheckCircle2, 
  Truck,
  Building2,
  ArrowRightLeft,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  ExternalLink
} from "lucide-react";
import { printPage } from "@/lib/excel";

interface BranchTransferDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function BranchTransferDetails({ record, onClose, onEdit }: BranchTransferDetailsProps) {
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
            <Printer size={16} className="mr-2" /> Inter-Branch Challan
          </button>
          {record.status === "Dispatched" && (
            <button className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
              <CheckCircle2 size={16} className="mr-2" /> Acknowledge Receipt
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Branch Routing Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
              <div className="flex items-center gap-3 mb-6">
                 <Building2 className="text-maroon-800" size={24} />
                 <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Issuing Branch</h3>
              </div>
              <div className="space-y-4">
                 <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{record.fromBranch}</p>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-1">
                       <MapPin size={14} /> {record.fromLocation}
                    </p>
                 </div>
                 <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <span>Authorized By</span>
                    <span className="text-slate-900 dark:text-white">Branch Manager</span>
                 </div>
              </div>
           </section>

           <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
              <div className="flex items-center gap-3 mb-6">
                 <Building2 className="text-emerald-600" size={24} />
                 <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Receiving Branch</h3>
              </div>
              <div className="space-y-4">
                 <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{record.toBranch}</p>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-1">
                       <MapPin size={14} /> {record.toLocation}
                    </p>
                 </div>
                 <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <span>Target Hub</span>
                    <span className="text-slate-900 dark:text-white">Showroom Warehouse</span>
                 </div>
              </div>
           </section>
        </div>

        {/* Transfer Logistics Card */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-12">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0">
               <Truck size={40} />
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dispatch Date</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transit ID</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">LHR-KHI-4491</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transfer Value</p>
                  <p className="text-sm font-black text-maroon-800 uppercase">Rs. {record.totalValue?.toLocaleString()}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Priority</p>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">Standard</span>
               </div>
            </div>
            <div className="w-full md:w-auto pt-6 md:pt-0 md:border-l md:pl-12 border-slate-100 dark:border-slate-800">
               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Purpose</p>
               <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">&quot;{record.reason}&quot;</p>
            </div>
        </section>

        {/* Transfer Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Inventory Breakdown</h3>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
               {items.length} Distinct SKUs
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Product / Material</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Transfer Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Unit</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Unit Value</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white font-black uppercase tracking-tight group-hover:text-maroon-800 transition-colors">{item.description || item.itemName || item.name}</td>
                    <td className="px-8 py-6 text-sm text-blue-600 text-center font-black">{item.qty}</td>
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
