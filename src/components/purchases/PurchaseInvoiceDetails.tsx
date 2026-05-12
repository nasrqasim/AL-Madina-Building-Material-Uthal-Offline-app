"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  FileText, 
  CreditCard, 
  MapPin, 
  Calendar,
  User,
  Link2,
  ExternalLink
} from "lucide-react";
import { printPage } from "@/lib/excel";

interface PurchaseInvoiceDetailsProps {
  invoice: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function PurchaseInvoiceDetails({ invoice, onClose, onEdit }: PurchaseInvoiceDetailsProps) {
  // Mock items for the view
  const items = [
    { 
      id: "1", 
      description: "SGWVVDWDDHSJHDHDX", 
      qty: 2, 
      unitPrice: 199.97, 
      discPercent: 0, 
      tax: "-", 
      total: 399.94
    }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{invoice.docNo}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              invoice.status === "Paid" ? "bg-emerald-100 text-emerald-700" : 
              invoice.status === "Posted" ? "bg-blue-100 text-blue-700" : 
              invoice.status === "Cancelled" ? "bg-rose-100 text-rose-700" :
              "bg-orange-100 text-orange-700"
            }`}>
              {invoice.status}
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Invoice Details Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
          <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Number</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{invoice.docNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{invoice.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{invoice.vendor}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Inv#</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{invoice.vendorInvNo}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Linked Reference</p>
              <div className="flex items-center gap-1 text-sm font-bold text-maroon-800">
                {invoice.linkedRef} <ExternalLink size={14} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Terms</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">30 days</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Currency</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">PKR</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Due Date</p>
              <p className="text-sm font-bold text-rose-600">2026-05-28</p>
            </div>
          </div>
        </section>

        {/* Line Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Invoiced Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Unit Price</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Disc %</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.qty}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.discPercent}%</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white text-right">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Total Amount</span>
                <span className="font-bold text-slate-900 dark:text-white">{(invoice.totalAmount || invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Balance Due</span>
                <span className={`font-black ${(invoice.balance || 0) > 0 ? "text-rose-600 text-lg" : "text-emerald-600"}`}>
                  {(invoice.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Final Total (PKR)</span>
                <span className="text-2xl font-black text-maroon-800 tracking-tighter">{(invoice.totalAmount || invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
