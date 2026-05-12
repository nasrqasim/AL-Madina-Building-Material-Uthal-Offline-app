"use client";

import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  Send, 
  Calendar,
  User,
  Package,
  MapPin,
  FileText,
  Building,
  CheckCircle2,
  Clock,
  Link2
} from "lucide-react";

import { printPage } from "@/lib/excel";
import PrintTemplate from "@/components/print/PrintTemplate";

interface QuotationDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function QuotationDetails({ record, onClose, onEdit }: QuotationDetailsProps) {
  const items = record.lines || record.items || [];

  const subTotal = items.reduce((sum: number, item: any) => sum + (item.total || item.netAmount || 0), 0);

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
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{record.invoiceNo || record.quotationNo}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              record.status?.toLowerCase() === "accepted" ? "bg-emerald-100 text-emerald-700" : 
              record.status?.toLowerCase() === "sent" ? "bg-blue-100 text-blue-700" : 
              record.status?.toLowerCase() === "rejected" ? "bg-rose-100 text-rose-700" : 
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
            <Send size={16} className="mr-2" /> Send to Customer
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Quotation Summary Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
          <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Quotation Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.partyId?.companyName || record.partyId?.name || record.customer}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date ? new Date(record.date).toLocaleDateString() : ""}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Valid Until</p>
              <p className="text-sm font-bold text-rose-600">{record.validUntil ? new Date(record.validUntil).toLocaleDateString() : ""}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Amount</p>
              <p className="text-sm font-black text-maroon-800">Rs. {(record.totalAmount || record.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Terms</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{record.paymentTerms || "Net 30 Days"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-sans">{record.location || "Central Warehouse"}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer Inquiry Ref</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.customerRef || "N/A"}</p>
            </div>
          </div>
        </section>

        {/* Line Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Estimate Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[300px]">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Unit Price</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description || item.itemName}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.qty}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{(item.unitPrice || item.rate || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white text-right">{(item.total || item.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 flex flex-col items-end space-y-3">
            <div className="w-full md:w-80 space-y-4">
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-[0.2em]">Grand Total (PKR)</span>
                <span className="text-2xl font-black text-maroon-800 tracking-tighter">Rs. {(record.totalAmount || record.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Remarks Section */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} /> Terms & Remarks
          </label>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            1. Prices are valid for 30 days from the date of quotation.<br />
            2. Delivery within 3 working days after order confirmation.<br />
            3. Standard warranty applies on all industrial lubricants.
          </p>
        </section>
      </div>
      </div>
      <PrintTemplate 
        formatName="Quotation" 
        data={{
          poNumber: record.quotationNo,
          date: record.date,
          customer: record.customer,
          total: record.totalAmount || record.amount || 0,
          subtotal: record.totalAmount || record.amount || 0,
          taxAmount: 0,
          discountAmount: 0
        }}
        items={items}
      />
    </div>
  );
}
