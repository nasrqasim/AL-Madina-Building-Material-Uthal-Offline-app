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
  FileText,
  Building,
  CreditCard,
  Globe,
  Ship,
  Truck,
  Anchor,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { printPage } from "@/lib/excel";
import { formatDate, formatMoney } from "@/lib/format";
import { getInvoiceLinesFromRecord } from "@/lib/purchaseFormHydrate";

interface ImportPurchaseInvoiceDetailsProps {
  record: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function ImportPurchaseInvoiceDetails({ record, onClose, onEdit }: ImportPurchaseInvoiceDetailsProps) {
  const rawLines = getInvoiceLinesFromRecord(record);
  const legacyLines =
    rawLines.length === 0 && Number(record.totalAmount || 0) > 0
      ? [
          {
            description: record.notes || "Import total",
            cartons: 1,
            qty: 1,
            rate: Number(record.totalAmount) / Number(record.exchangeRate || 1),
            foreignNetAmount: Number(record.totalAmount) / Number(record.exchangeRate || 1),
            netAmount: Number(record.totalAmount),
          },
        ]
      : [];
  const displayLines = (rawLines.length > 0 ? rawLines : legacyLines) as Record<string, unknown>[];
  const exchangeRate = Number(record.exchangeRate || 278.5);
  const vendorName = record.partyId?.companyName || record.partyId?.name || record.vendor || "—";
  const items = displayLines.map((line: Record<string, unknown>, index: number) => {
    const cartons = Number(line.cartons ?? line.qty ?? 0);
    const unitPriceUSD = Number(line.rate ?? line.unitPriceUSD ?? 0);
    const fcTotal = Number(line.foreignNetAmount ?? cartons * unitPriceUSD);
    const pkrTotal = Number(line.netAmount ?? fcTotal * exchangeRate);
    return {
      id: String(index),
      description: String(line.description || (line.itemId as { name?: string })?.name || "—"),
      qty: cartons,
      unitPriceUSD,
      fcTotal,
      pkrTotal,
    };
  });
  const charges = Array.isArray(record.charges) ? record.charges : [];
  const totalCharges = charges.reduce((acc: number, c: { amount?: number }) => acc + Number(c.amount || 0), 0);
  const totalAmount = Number(record.totalAmount || 0);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{record.invoiceNo || record.docNo}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              record.status === "Posted" ? "bg-emerald-100 text-emerald-700" : 
              record.status === "Cancelled" ? "bg-rose-100 text-rose-700" :
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
            <Printer size={16} className="mr-2" /> Print GD
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Import Summary Grid */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-maroon-800" />
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Import Document Summary</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <ShieldCheck size={14} /> Customs Cleared
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">GD Number</p>
              <p className="text-sm font-bold text-maroon-800 bg-maroon-50 px-2 py-0.5 rounded inline-block">{record.gdNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Document Date</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(record.date)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor (Foreign)</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{vendorName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Inv #</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.vendorInvNo || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">BL/AWB</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{record.blAwbNo || "—"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shipment Mode</p>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <Ship size={16} className="text-blue-500" /> Sea Cargo (CIF)
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Port of Discharge</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">KARACHI QASIM</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Exchange Rate</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">1 {record.currency || "USD"} = {exchangeRate.toLocaleString()} PKR</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Landed Cost (PKR)</p>
              <p className="text-sm font-black text-maroon-800">{formatMoney(totalAmount)}</p>
            </div>
          </div>
        </section>

        {/* Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50/30 flex items-center gap-2">
            <Package size={18} className="text-slate-400 dark:text-slate-500" />
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Imported Items Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Unit Price ({record.currency})</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">FC Total</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">PKR Equiv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-8 text-center text-sm text-slate-400 italic">No line items saved</td>
                  </tr>
                ) : items.map((item: { id: string; description: string; qty: number; unitPriceUSD: number; fcTotal: number; pkrTotal: number }, index: number) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{index + 1}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-bold">{item.description}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.qty}</td>
                    <td className="px-8 py-6 text-sm text-slate-900 dark:text-white text-center">{item.unitPriceUSD.toLocaleString()}</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-400 dark:text-slate-500 text-right">{item.fcTotal.toLocaleString()}</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white text-right">{item.pkrTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {charges.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-blue-50/30 flex items-center gap-2">
            <Anchor size={18} className="text-blue-600" />
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Capitalized Import Charges</h3>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              {charges.map((charge: { name: string; amount: number }, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{charge.name}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">Rs. {charge.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-6 flex justify-between items-center">
                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Total Capitalized Charges</span>
                <span className="text-xl font-black text-blue-600">Rs. {totalCharges.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
