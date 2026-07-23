"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  MoreVertical, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  CreditCard,
  Plus
} from "lucide-react";
import { printPage } from "@/lib/excel";
import PrintTemplate from "@/components/print/PrintTemplate";

interface PurchaseOrderDetailsProps {
  order: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function PurchaseOrderDetails({ order, onClose, onEdit }: PurchaseOrderDetailsProps) {
  const items = order.lines || order.items || [];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      <div className="print:hidden">
        {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{order.docNo}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              order.status === "Completed" ? "bg-emerald-100 text-emerald-700" : 
              order.status === "Approved" ? "bg-blue-100 text-blue-700" : 
              order.status === "Cancelled" ? "bg-rose-100 text-rose-700" :
              "bg-orange-100 text-orange-700"
            }`}>
              {order.status}
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
        {/* Order Details Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">PO Number</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{order.docNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{order.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{order.vendor}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reference No.</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{order.reference || "43543545"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Delivery Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{order.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Terms</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">30 days</p>
            </div>
            <div className="space-y-1 md:col-span-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Delivery Address</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">34DSFTSDFTFGFGDS</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Currency</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">PKR</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Linked Documents</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">1 document(s)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Line Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Line Items</h3>
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
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Tax</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Total</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Received</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {(items || []).map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description || item.itemName}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.qty}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{(item.unitPrice || item.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.discPercent || item.discountPercent || 0}%</td>
                    <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 text-center">{item.tax || item.taxPercent || "-"}</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white text-right">{(item.total || item.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.received || 0}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.pending || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white">{(order.totalAmount || order.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Tax</span>
                <span className="font-bold text-slate-900 dark:text-white">{(order.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Total (PKR)</span>
                <span className="text-2xl font-black text-maroon-800 tracking-tighter">{(order.amount || order.totalAmount || order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>
      <PrintTemplate 
        formatName="Purchase Order" 
        data={{
          poNumber: order.docNo,
          date: order.date,
          supplier: order.vendor,
          linkedRef: order.reference,
          total: order.amount || order.totalAmount || order.total,
          subtotal: order.subTotal || order.amount,
          taxAmount: order.taxAmount || 0,
          discountAmount: order.discountAmount || 0
        }}
        items={items}
      />
    </div>
  );
}
