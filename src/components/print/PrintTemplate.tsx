"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PrintTemplateProps {
  formatName: string;
  data: any;
  items?: any[];
}

export default function PrintTemplate({ formatName, data, items = [] }: PrintTemplateProps) {
  const [config, setConfig] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/settings/print-formats?formatName=${encodeURIComponent(formatName)}`).then(res => res.json()),
      fetch("/api/shop-profile").then(res => res.json())
    ]).then(([formatRes, companyRes]) => {
      if (formatRes.ok) setConfig(formatRes.data);
      if (companyRes.ok) setCompanyInfo(companyRes.data);
    });
  }, [formatName]);

  if (!config) return null;

  // Determine Receipt Type Title for the Black Bar
  let receiptType = "Receipt";
  const nameLower = formatName.toLowerCase();
  if (nameLower.includes("sale invoice") || nameLower.includes("pos")) {
    receiptType = "Sale Receipt";
  } else if (nameLower.includes("sale return")) {
    receiptType = "Sale Return";
  } else if (nameLower.includes("purchase invoice")) {
    receiptType = "Purchase Receipt";
  } else if (nameLower.includes("purchase return")) {
    receiptType = "Purchase Return";
  } else if (nameLower.includes("cash receipt")) {
    receiptType = "Cash Receipt";
  } else if (nameLower.includes("bank receipt")) {
    receiptType = "Bank Receipt";
  } else {
    receiptType = formatName;
  }

  // Calculate totals and counts
  const totalQty = items.reduce((acc, item) => acc + (Number(item.qty) || Number(item.cartons) || 1), 0);
  const itemCount = items.length;

  const grossTotal = Math.round(data.subtotal || data.total || 0);
  const discount = Math.round(data.discountAmount || 0);
  const netTotal = Math.round(data.total || data.amount || 0);
  const amountReceived = Math.round(data.amountReceived || data.receivedAmount || netTotal);
  const cashBack = amountReceived - netTotal;

  // Format date and time
  const rawDate = data.date ? new Date(data.date) : new Date();
  const dateStr = rawDate.toLocaleDateString('en-GB'); // dd-mm-yyyy format
  const timeStr = rawDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Bullet-proof customer name resolution as requested
  const customerName = (data.customer && data.customer.trim() && data.customer !== "Search Customer...")
    ? data.customer
    : (data.supplier && data.supplier.trim())
    ? data.supplier
    : (data.partyName && data.partyName.trim())
    ? data.partyName
    : "Walk-in Customer";

  return (
    <div className="hidden print:flex flex-col bg-white text-black font-sans absolute inset-0 z-[9999] m-0 p-0" style={{ fontFamily: 'monospace' }}>
      <style>{`
        @page {
          margin: 0;
          size: 80mm auto; /* Thermal printer typical width 80mm */
        }
        @media print {
          /* Hide EVERYTHING globally in the body except the #print-area container */
          body * {
            visibility: hidden !important;
          }
          
          /* Show print-area and its descendants */
          #print-area, #print-area * {
            visibility: visible !important;
          }
          
          /* Absolute layout for print area to occupy page 1 exactly and overlay everything */
          #print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            z-index: 9999999 !important;
            box-sizing: border-box !important;
            display: block !important;
          }
          
          /* Reset parent structures to prevent layout bleeding and offset margins */
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            overflow: visible !important;
            height: auto !important;
          }
          
          /* Strip all styles, borders, shadows, backgrounds, and layout offsets from parent elements */
          div, section, main, aside, nav, header, footer {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            transform: none !important;
          }
        }
      `}</style>
      <div id="print-area" className="w-full flex flex-col">
        {/* Logo */}
        {config.showLogo && companyInfo?.logo && (
          <div className="flex justify-center mb-2">
            <Image 
              src={companyInfo.logo} 
              alt="Company Logo" 
              width={100}
              height={40}
              unoptimized
              className="h-10 w-auto object-contain grayscale" 
            />
          </div>
        )}

        {/* Company Title */}
        <div className="text-center mb-1">
          <h2 className="text-lg font-black uppercase tracking-tight" style={{ fontSize: '14px' }}>
            {companyInfo?.name || "AL HADEED TRADERS"}
          </h2>
          <p className="text-[11px] font-bold">Tel: {companyInfo?.phone || "03108444612"}</p>
        </div>

        {/* Black Bar for Receipt Type */}
        <div className="bg-black text-white text-center py-0.5 font-bold uppercase tracking-wider my-1 text-xs" style={{ fontSize: '11px' }}>
          {receiptType}
        </div>

        {/* Meta Info Grid */}
        <div className="text-[11px] font-bold space-y-0.5 my-2 border-b border-black pb-2">
          <div className="flex justify-between">
            <span>Receipt No.</span>
            <span>{data.invoiceNo || data.poNumber || data.referenceNo || data.receiptNo || data.voucherNo || "6928"}</span>
          </div>
          <div className="flex justify-between">
            <span>Date &nbsp;{dateStr}</span>
            <span>Time &nbsp;{timeStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Sales Person:</span>
            <span>{data.salesPerson || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer Name:</span>
            <span className="truncate max-w-[150px]">{customerName}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Type:</span>
            <span>{data.paymentMethod || data.paymentMode || "Cash"}</span>
          </div>
        </div>

        {/* Items Table Headers */}
        <div className="border-b border-black pb-1 mb-1 text-[11px] font-bold">
          <div className="grid grid-cols-12">
            <span className="col-span-6 text-left">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Price/Ctn</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2 mb-2 text-[11px] font-bold">
          {items.map((item: any, i: number) => {
            const desc = item.description || item.itemName || item.accountName || "Item";
            const qty = item.qty || item.cartons || 1;
            const price = Math.round(item.unitPrice || item.rate || item.amount || 0);
            const total = Math.round(item.total || item.amount || item.netAmount || item.grossAmount || 0);
            return (
              <div key={i} className="border-b border-dashed border-slate-200 pb-1">
                {/* Row 1: Item Name / Description */}
                <div className="text-left font-black">{desc}</div>
                {/* Row 2: Qty / Rate / Total aligned */}
                <div className="grid grid-cols-12 text-[10px] text-slate-700">
                  <span className="col-span-6"></span>
                  <span className="col-span-2 text-center">{qty}</span>
                  <span className="col-span-2 text-right">{price.toLocaleString()}</span>
                  <span className="col-span-2 text-right font-black text-black">{total.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="text-center py-2">No items found</div>
          )}
        </div>

        {/* Item & Qty Summary Row */}
        <div className="border-t border-b border-black py-1 my-1 text-[11px] font-bold flex justify-between">
          <span>Item(s) &nbsp;{itemCount}</span>
          <span>Total Qty &nbsp;{totalQty.toFixed(2)}</span>
        </div>

        {/* Financial Summary */}
        <div className="space-y-1 text-[11px] font-bold my-2 text-right">
          <div className="flex justify-between">
            <span>Gross Total</span>
            <span>{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>{discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs font-black pt-1 border-t border-black uppercase">
            <span>Net Total PKR</span>
            <span>{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span>Amount Received</span>
            <span>{amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash Back PKR</span>
            <span>{cashBack >= 0 ? cashBack.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}</span>
          </div>
        </div>

        {/* Visit Note */}
        <div className="text-center font-black my-3 text-[11px]">
          *Thanks For Your Visit*
        </div>

        {/* Software By Footer */}
        <div className="text-center text-[10px] font-bold border-t border-black pt-2 mt-2">
          Software By: Roonjha Developers : 03152914836
        </div>
      </div>
    </div>
  );
}
