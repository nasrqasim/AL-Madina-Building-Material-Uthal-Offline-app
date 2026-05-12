"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  CheckCircle2, 
  Layers,
  Settings,
  Activity,
  Package,
  DollarSign,
  History,
  LayoutGrid,
  ClipboardList
} from "lucide-react";
import { printPage } from "@/lib/excel";

interface BillOfMaterialsDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function BillOfMaterialsDetails({ record, onClose, onEdit }: BillOfMaterialsDetailsProps) {
  // Mock components for the view
  const components = record.lines || record.items || [];

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
              record.status === "Active" ? "bg-emerald-100 text-emerald-700" : 
              record.status === "Draft" ? "bg-orange-100 text-orange-700" :
              "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
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
            <Edit size={16} className="mr-2" /> Edit BOM
          </button>
          <button 
            onClick={printPage}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <Printer size={16} className="mr-2" /> Print Recipe
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* BOM Header Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Product Recipe Overview</h2>
            <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Version {record.version}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">BOM Name</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.bomName || record.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Finished Item</p>
              <p className="text-sm font-black text-maroon-800 uppercase tracking-tighter">{record.finishedItem || record.itemName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Production Unit</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-sans">{record.location}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estimated Cost / Unit</p>
              <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Rs. {(record.totalAmount || record.totalCost || 0).toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Recipe Components */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Material Ingredients (BOM)</h3>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-1 rounded-lg">Calculation per Unit</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Component Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty / Unit</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">UOM</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Unit Cost</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {components.map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors group">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description || item.itemName || item.name}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.qty}</td>
                    <td className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest">{item.unit || item.uom}</td>
                    <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 text-right">{(item.unitPrice || item.rate || item.cost || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white text-right">{(item.total || item.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-slate-50 dark:bg-slate-800/50/50 flex flex-col items-end space-y-3 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full md:w-80 space-y-4">
              <div className="pt-6 flex justify-between items-center">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Total Material Cost</span>
                <span className="text-3xl font-black text-maroon-800 tracking-tighter">Rs. {(record.totalAmount || record.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
