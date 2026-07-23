"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  RotateCcw, 
  Link2, 
  Calendar,
  User,
  Package,
  MapPin,
  FileText
} from "lucide-react";

import { printPage } from "@/lib/excel";
import PrintTemplate from "@/components/print/PrintTemplate";

interface SaleReturnDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function SaleReturnDetails({ record, onClose, onEdit }: SaleReturnDetailsProps) {
  const items = record.lines || record.items || [];
  const itemsDiscount = (items || []).reduce((acc: number, curr: any) => acc + ((curr.grossAmount || 0) - (curr.netAmount || curr.total || 0)), 0);
  const carService = record.carService || 0;
  const carServiceDiscount = record.carServiceDiscount || 0;
  const additionalDiscount = record.discountAmount || 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{record.invoiceNo || record.returnNo}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              record.status?.toLowerCase() === "posted" ? "bg-emerald-100 text-emerald-700" : 
              record.status?.toLowerCase() === "cancelled" ? "bg-rose-100 text-rose-700" :
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Return Details Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
          <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Return Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Return Number</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.invoiceNo || record.returnNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date ? new Date(record.date).toLocaleDateString() : "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.partyId?.companyName || record.partyId?.name || record.customer}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Reference</p>
              <div className="flex items-center gap-1 text-sm font-bold text-maroon-800">
                {record.reference || record.invoiceRef || "-"} <Link2 size={14} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.locationId?.name || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.employeeId?.name || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vehicle No</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.regNo || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">KMs (S/E/R)</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.startKms || 0} / {record.endKms || 0} / {record.rangeKms || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.notes || "-"}</p>
            </div>
          </div>
        </section>

        {/* Line Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Returned Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Cartons</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Rate</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {(items || []).map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description || item.itemId?.name || item.itemName}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.cartons || item.qty || 0}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{(item.rate || item.unitPrice || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white text-right">{(item.netAmount || item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Subtotal (Gross)</span>
                <span className="font-bold text-slate-900 dark:text-white">{(record.subTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {itemsDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Product Discount</span>
                  <span className="font-bold text-rose-600">-{itemsDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {carService > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Car Service Charges</span>
                  <span className="font-bold text-slate-900 dark:text-white">+{carService.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {carServiceDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Car Wash Discount</span>
                  <span className="font-bold text-rose-600">-{carServiceDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {additionalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Additional Discount</span>
                  <span className="font-bold text-rose-600">-{additionalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {record.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Sales Tax</span>
                  <span className="font-bold text-slate-900 dark:text-white">+{(record.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Total Credit (PKR)</span>
                <span className="text-2xl font-black text-maroon-800 tracking-tighter">{(record.totalAmount || record.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <PrintTemplate 
        formatName="Sale Return" 
        data={{
          invoiceNo: record.invoiceNo || record.returnNo,
          date: record.date,
          customer: record.partyId?.companyName || record.partyId?.name || record.customer || "Walk-in Customer",
          linkedRef: record.reference || record.invoiceRef,
          total: record.totalAmount || record.amount,
          subtotal: record.subTotal || 0,
          taxAmount: record.taxAmount || 0,
          discountAmount: record.discountAmount || 0,
          carService: record.carService || 0,
          carServiceDiscount: record.carServiceDiscount || 0,
          regNo: record.regNo,
          startKms: record.startKms,
          endKms: record.endKms,
          rangeKms: record.rangeKms,
        }}
        items={items}
      />
    </div>
  );
}
