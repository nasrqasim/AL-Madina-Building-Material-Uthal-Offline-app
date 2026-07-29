"use client";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

import React from "react";
import Image from "next/image";

interface BlackCopperS4CProps {
  data: any;
  items: any[];
  companyInfo: any;
  config: any;
  dateStr: string;
  timeStr: string;
  activeFormat: "a4" | "a5";
}

export default function BlackCopperS4C({
  data,
  items,
  companyInfo,
  config,
  dateStr,
  timeStr,
  activeFormat,
}: BlackCopperS4CProps) {
  const grossTotal = Math.round(data.subtotal || data.total || 0);
  const discount = Math.round(data.discountAmount || 0);
  const netTotal = Math.round(data.total || data.amount || 0);
  const amountReceived = Math.round(data.amountReceived || data.receivedAmount || netTotal);
  const cashBack = amountReceived - netTotal;

  const carService = Math.round(data.carService || 0);
  const carServiceDiscount = Math.round(data.carServiceDiscount || 0);

  const itemsDiscount = (items || []).reduce((acc: number, item: any) => {
    const gross = (Number(item.quantity || item.qty || item.cartons || 1) * Number(item.rate || item.unitPrice || 0));
    const net = Number(item.netAmount || item.total || item.amount || 0);
    return acc + Math.max(0, gross - net);
  }, 0);

  const customerName = (data.customer && data.customer.trim() && data.customer !== "Search Customer...")
    ? data.customer
    : (data.supplier && data.supplier.trim())
    ? data.supplier
    : (data.partyName && data.partyName.trim())
    ? data.partyName
    : "Walk-in Customer";

  // Check if we have student details or generic client details
  const isStudent = !!(data.studentName || data.rollNo || data.className);
  const studentDetailLabel = data.studentDetailLabel || "Billed To";

  return (
    <div 
      className="black-copper-s4c-container bg-white text-black flex flex-col font-sans w-full box-border relative"
      style={{
        padding: activeFormat === "a5" ? "4mm" : "6mm",
        fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif"
      }}
    >
      {/* ─── WATERMARK IN THE MIDDLE ─── */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.08]"
      >
        <img 
          src="/logo.png" 
          alt="المدینہ بلڈنگ میٹیریل اوتھل" 
          className="w-96 max-w-full object-contain filter grayscale opacity-90"
        />
      </div>

      {/* ─── HEADER SECTION (AL-MADINA BILL PAD STYLE MATCHING PHYSICAL RECEIPT) ─── */}
      <div className="z-10 bg-[#1e3b70] text-white rounded-xl p-4 mb-4 flex justify-between items-center relative border border-blue-950 shadow-md">
        {/* Left Column: Logo Image */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-xl shadow-inner flex items-center justify-center border border-blue-200">
            <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-xs font-black text-blue-200 tracking-wide block uppercase">Building Material Uthal</h2>
            <span className="text-[9px] bg-blue-900 px-2 py-0.5 rounded text-blue-100 font-extrabold uppercase mt-0.5 inline-block">Retail & Wholesale</span>
          </div>
        </div>

        {/* Center Column: Urdu Headline & Subtitle matching physical bill */}
        <div className="text-center flex-1 px-4">
          <h1 className="text-2xl font-extrabold tracking-wide text-white leading-tight filter drop-shadow mb-1" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
            المدینہ کنکریٹ بلاک ورکس اینڈ بلڈنگ میٹیریل
          </h1>
          <p className="text-[11px] text-blue-100 font-bold bg-blue-900/60 px-3 py-1 rounded-lg border border-blue-700/50 inline-block">
            ہمارے ہاں ہر سائز کا بلاک، سیمنٹ، بجری، ریتی، روڑی، کرش اور سریا دستیاب ہے
          </p>
        </div>

        {/* Right Column: Contact Details matching physical bill */}
        <div className="text-right text-[10px] space-y-1 font-bold text-blue-100 border-l border-blue-700/50 pl-4">
          <p className="flex items-center justify-end gap-1">
            <span className="font-extrabold text-white">حسین:</span>
            <span dir="ltr" className="inline-block font-mono text-white">0333-7980848</span>
          </p>
          <p className="flex items-center justify-end">
            <span dir="ltr" className="inline-block font-mono text-blue-200 text-[9.5px]">0345-3799500</span>
          </p>
          <p className="flex items-center justify-end gap-1">
            <span className="font-extrabold text-white">اقبال:</span>
            <span dir="ltr" className="inline-block font-mono text-white">0333-7970848</span>
          </p>
          <p className="flex items-center justify-end gap-1">
            <span className="font-extrabold text-white">اکرم:</span>
            <span dir="ltr" className="inline-block font-mono text-white">0335-1279963</span>
          </p>
        </div>
      </div>

      {/* ─── CUSTOMER / VENDOR & INVOICE DETAILS ─── */}
      <div className="z-10 grid grid-cols-12 gap-3 text-[11px] font-bold text-slate-800 mb-4 bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-sm">
        <div className="col-span-4 flex flex-col justify-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {(data.type?.includes("purchase") || data.supplier || data.vendor) ? "Vendor / Supplier Name" : "Customer Name"}
          </span>
          <span className="font-extrabold text-slate-900 text-sm">{customerName}</span>
        </div>
        <div className="col-span-3 flex flex-col justify-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice No</span>
          <span className="font-extrabold text-slate-900 text-sm font-mono">{data.invoiceNo || data.poNumber || data.docNo || "-"}</span>
        </div>
        <div className="col-span-3 flex flex-col justify-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
          <span className="font-extrabold text-slate-900 text-sm">{dateStr}</span>
        </div>
        <div className="col-span-2 flex flex-col justify-center items-end">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Terms</span>
          <span className="font-extrabold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg uppercase text-[11px] mt-0.5 border border-blue-200">
            {data.paymentMethod || data.paymentMode || "Credit"}
          </span>
        </div>
      </div>

      {/* ─── ADDITIONAL INFO (VEHICLE DETAILS) ─── */}
      {data.regNo && (
        <div className="z-10 mb-4 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[10px] font-bold text-slate-700 flex justify-between items-center">
          <div>
            <span className="text-slate-400 mr-1">Vehicle No:</span>
            <span className="text-slate-900 font-extrabold">{data.regNo}</span>
          </div>
          {data.startKms !== undefined && (
            <div>
              <span className="text-slate-400 mr-1">KMs Range:</span>
              <span className="text-slate-900 font-extrabold">{data.startKms || 0} - {data.endKms || 0} ({data.rangeKms || 0} KM)</span>
            </div>
          )}
          {data.notes && (
            <div>
              <span className="text-slate-400 mr-1">Notes:</span>
              <span className="text-rose-700 font-extrabold">{data.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── MAIN PRODUCTS TABLE WITH DELIVERY STATUSES ─── */}
      <div className="z-10 flex-1 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-350 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100">
              <th className="py-2 px-2 text-left w-6">#</th>
              <th className="py-2 px-2 text-left">Item Description</th>
              <th className="py-2 px-2 text-center w-24">Delivery Status</th>
              <th className="py-2 px-2 text-center w-16">Ordered</th>
              <th className="py-2 px-2 text-center w-16">Delivered</th>
              <th className="py-2 px-2 text-center w-16">Pending</th>
              <th className="py-2 px-2 text-right w-20">Rate</th>
              <th className="py-2 px-2 text-right w-24">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px] font-bold text-slate-700">
            {(items || []).map((item: any, i: number) => {
              const desc = item.description || item.itemName || item.itemId?.name || "Item";
              const ordered = Number(item.quantity || item.qty || item.cartons || item.orderedQty || 1);
              
              // Handle received status checkboxes & partial delivery qty calculations
              const isReceived = item.isReceived === true || item.isReceived === "true";
              const delivered = isReceived ? ordered : Number(item.deliveredQty || 0);
              const pending = isReceived ? 0 : (item.pendingQty !== undefined ? Number(item.pendingQty) : Math.max(0, ordered - delivered));

              const price = Number(item.rate || item.unitPrice || 0);
              const total = Number(item.netAmount || item.total || 0);

              return (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2 text-slate-400 font-normal">{i + 1}</td>
                  <td className="py-2 px-2 text-slate-900 font-black">
                    {desc}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {isReceived ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded-full font-black uppercase">
                        ✓ Received
                      </span>
                    ) : delivered > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] rounded-full font-black uppercase">
                        Partial ({delivered})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] rounded-full font-black uppercase">
                        ✗ Pending
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">{ordered}</td>
                  <td className="py-2 px-2 text-center text-emerald-600">{delivered}</td>
                  <td className="py-2 px-2 text-center text-rose-600">{pending > 0 ? pending : "—"}</td>
                  <td className="py-2 px-2 text-right">PKR {price.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-slate-900 font-black">PKR {total.toLocaleString()}</td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 italic font-bold">No items found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── SUMMARY AND SIGNATURES ─── */}
      <div className="z-10 grid grid-cols-12 gap-4 mt-4 pt-3 border-t border-slate-200">
        {/* Left Column: Terms & Signatures */}
        <div className="col-span-7 flex flex-col justify-between space-y-4">
          <div className="text-[9px] text-slate-500 font-bold leading-normal space-y-0.5">
            <p className="font-extrabold text-slate-700 mb-0.5">شروط و ضوابط (Notes / Terms):</p>
            <p>1. مال واپس یا تبدیل نہیں ہوگا البتہ 7 یوم کے اندر اصل رسید کے ہمراہ تبدیل کیا جاسکتا ہے۔</p>
            <p>2. برائے مہربانی ڈیلیوری کے وقت سامان کی گنتی اور کوالٹی چیک کرلیں۔ بعد میں کوئی شکایت قابل قبول نہ ہوگی۔</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="border-t border-slate-300 text-center pt-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Customer Signature</span>
            </div>
            <div className="border-t border-slate-300 text-center pt-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Calculations */}
        <div className="col-span-5 border border-slate-200 rounded-xl p-3 bg-slate-50 text-[10px] font-bold space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span>Gross Total:</span>
            <span className="text-slate-800">PKR {grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {itemsDiscount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span className="text-rose-600">-PKR {itemsDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Additional Discount:</span>
              <span className="text-rose-600">-PKR {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black pt-1.5 border-t border-slate-300 text-slate-900 uppercase">
            <span>Net Total:</span>
            <span className="text-blue-900">PKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-slate-500 pt-0.5">
            <span>Amount Paid:</span>
            <span className="text-slate-700">PKR {amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Cash Back:</span>
            <span className="text-slate-700">PKR {cashBack >= 0 ? cashBack.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}</span>
          </div>
        </div>
      </div>

      {/* ─── FOOTER SECTION (DEVELOPER ATTRIBUTE) ─── */}
      <div className="z-10 text-center text-[10px] font-bold border-t border-slate-200 pt-2 mt-4 flex justify-between items-center text-slate-400">
        <span>* Thanks For Your Visit *</span>
        <span className="font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shadow-sm">
          Software by Roonjha Developers and 03152914836
        </span>
      </div>
    </div>
  );
}
