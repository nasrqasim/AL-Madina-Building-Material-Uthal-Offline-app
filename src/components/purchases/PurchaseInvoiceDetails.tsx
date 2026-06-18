"use client";

import { ArrowLeft, Edit, Printer, ExternalLink } from "lucide-react";
import { printPage } from "@/lib/excel";

interface PurchaseInvoiceDetailsProps {
  invoice: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function PurchaseInvoiceDetails({ invoice, onClose, onEdit }: PurchaseInvoiceDetailsProps) {
  const items = invoice.lines || [];
  const fmt = (n: number) => (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition-all">
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {invoice.invoiceNo || invoice.docNo}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              invoice.status === "paid"  ? "bg-emerald-100 text-emerald-700" :
              invoice.status === "posted"? "bg-blue-100 text-blue-700" :
              invoice.status === "draft" ? "bg-orange-100 text-orange-700" :
              "bg-slate-100 text-slate-600"
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onEdit} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg transition-all">
            <Edit size={16} className="mr-2" /> Edit
          </button>
          <button onClick={printPage} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center border border-slate-200 bg-white shadow-sm transition-all">
            <Printer size={16} className="mr-2" /> Print
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">PKR {fmt(invoice.totalAmount || invoice.total)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Due</p>
            <p className={`text-xl font-black ${(invoice.balance || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              PKR {fmt(invoice.balance)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Date</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {invoice.date ? new Date(invoice.date).toLocaleDateString() : "-"}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
            <p className="text-base font-bold text-rose-600">
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}
            </p>
          </div>
        </div>

        {/* Invoice Details */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Invoice Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{invoice.invoiceNo || invoice.docNo}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {invoice.partyId?.companyName || invoice.partyId?.name || invoice.vendor || "-"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Inv#</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{invoice.reference || invoice.vendorInvNo || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Terms</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{invoice.paymentTerms || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{invoice.currency || "PKR"}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{invoice.employeeId?.name || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{invoice.locationId?.name || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{invoice.notes || "-"}</p>
            </div>
          </div>
        </section>

        {/* Line Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Invoiced Items ({items.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 900 }}>
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-10 text-center">#</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[180px]">Description</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ctns</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gals</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ltrs</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross Amt</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Disc %</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Disc (PKR)</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tax %</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tax (PKR)</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.length === 0 ? (
                  <tr><td colSpan={12} className="px-5 py-10 text-center text-slate-400 font-medium">No items found.</td></tr>
                ) : items.map((item: any, idx: number) => {
                  const ctns = item.cartons ?? item.qty ?? 0;
                  const price = item.rate ?? item.unitPrice ?? 0;
                  const gross = item.grossAmount ?? (ctns * price);
                  const discPct = item.discountPercent ?? item.discPercent ?? 0;
                  const discAmt = item.discountAmount ?? (gross * discPct / 100);
                  const taxable = gross - discAmt;
                  const taxPct = item.taxPercent ?? 0;
                  const taxAmt = (taxable * taxPct) / 100;
                  const net = item.netAmount ?? item.total ?? (taxable + taxAmt);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-xs font-bold text-slate-400 text-center">{idx + 1}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
                        {item.description || item.itemId?.name || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-900 dark:text-white text-center">{ctns}</td>
                      <td className="px-4 py-4 text-sm text-slate-900 dark:text-white text-center">{item.gallons ?? "-"}</td>
                      <td className="px-4 py-4 text-sm text-slate-900 dark:text-white text-center">{item.liters ?? "-"}</td>
                      <td className="px-4 py-4 text-sm text-slate-900 dark:text-white text-right">{fmt(price)}</td>
                      <td className="px-4 py-4 text-sm text-slate-900 dark:text-white text-right">{fmt(gross)}</td>
                      <td className="px-4 py-4 text-sm text-rose-500 text-right">{discPct}%</td>
                      <td className="px-4 py-4 text-sm text-rose-500 text-right">-{fmt(discAmt)}</td>
                      <td className="px-4 py-4 text-sm text-slate-900 dark:text-white text-right">{taxPct}%</td>
                      <td className="px-4 py-4 text-sm text-slate-900 dark:text-white text-right">+{fmt(taxAmt)}</td>
                      <td className="px-4 py-4 text-sm font-black text-slate-900 dark:text-white text-right">{fmt(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-8 bg-white flex flex-col items-end">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Subtotal</span>
                <span className="font-bold text-slate-900">{fmt(invoice.subTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Discount</span>
                <span className="font-bold text-rose-600">-{fmt(invoice.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Tax</span>
                <span className="font-bold text-slate-900">+{fmt(invoice.taxAmount)}</span>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-maroon-800 uppercase tracking-widest">Final Total (PKR)</span>
                <span className="text-2xl font-black text-maroon-800 tracking-tighter">{fmt(invoice.totalAmount || invoice.total)}</span>
              </div>
              {(invoice.amountReceived ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Amount Paid</span>
                  <span className="font-bold text-emerald-600">-{fmt(invoice.amountReceived)}</span>
                </div>
              )}
              {(invoice.balance ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Balance Due</span>
                  <span className="font-black text-rose-600 text-lg">{fmt(invoice.balance)}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
