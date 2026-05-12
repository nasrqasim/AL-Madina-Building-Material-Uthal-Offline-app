"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  RotateCcw, 
  Calendar,
  User,
  Package,
  MapPin,
  FileText,
  Building,
  Link2,
  Wallet,
  Receipt,
  Clock
} from "lucide-react";

import { printPage } from "@/lib/excel";

interface NonTaxSaleReturnDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function NonTaxSaleReturnDetails({ record, onClose, onEdit }: NonTaxSaleReturnDetailsProps) {
  // Mock items for the view
  const items = [
    { 
      id: "1", 
      description: "ENGINE OIL 4L CAN (Damaged)", 
      origQty: 5, 
      returnQty: 2, 
      unitPrice: 2500, 
      total: 5000 
    }
  ];

  const totalReturn = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{record.returnNo}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              record.status === "Posted" ? "bg-emerald-100 text-emerald-700" : 
              "bg-orange-100 text-orange-700"
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
            <Edit size={16} className="mr-2" /> Edit
          </button>
          <button onClick={printPage} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <Printer size={16} className="mr-2" /> Print
          </button>
          <button className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg shadow-emerald-600/10 transition-all">
            <RotateCcw size={16} className="mr-2" /> Process Refund
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Return Summary Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-600" />
          <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Return Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.customer}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Return Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Ref</p>
              <p className="text-sm font-bold text-maroon-800 uppercase">{record.invoiceRef}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Return Value</p>
              <p className="text-sm font-black text-rose-600">Rs. {(record.totalAmount || record.amount || 0).toLocaleString()}</p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason for Return</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 italic">&quot;Damaged packaging found during delivery.&quot;</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Refund Status</p>
              <p className="text-sm font-bold text-emerald-600">Refunded to Cash</p>
            </div>
          </div>
        </section>

        {/* Line Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-rose-50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Returned Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Orig. Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Ret. Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Unit Price</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description}</td>
                    <td className="px-8 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">{item.origQty}</td>
                    <td className="px-8 py-6 text-sm text-rose-600 text-center">{item.returnQty}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.unitPrice.toLocaleString()}</td>
                    <td className="px-8 py-6 text-sm font-black text-rose-600 text-right">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Total Credit Value</span>
                <span className="text-2xl font-black text-rose-600 tracking-tighter">Rs. {(record.totalAmount || record.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <Clock size={14} />
          <span>Record created on 2026-04-30 15:45</span>
        </div>
      </div>
    </div>
  );
}
