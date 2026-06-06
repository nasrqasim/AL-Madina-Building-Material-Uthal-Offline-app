"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface PrintTemplateProps {
  formatName: string;
  data: any;
  items?: any[];
  autoPrint?: boolean;
  onPrintComplete?: () => void;
}

export default function PrintTemplate({ 
  formatName, 
  data, 
  items = [], 
  autoPrint = false,
  onPrintComplete
}: PrintTemplateProps) {
  const [config, setConfig] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeFormat, setActiveFormat] = useState<"thermal" | "a5" | "a4">("thermal");

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch(`/api/settings/print-formats?formatName=${encodeURIComponent(formatName)}`).then(res => res.json()),
      fetch("/api/shop-profile").then(res => res.json())
    ]).then(([formatRes, companyRes]) => {
      if (formatRes.ok) setConfig(formatRes.data);
      if (companyRes.ok) setCompanyInfo(companyRes.data);
    });
    return () => setMounted(false);
  }, [formatName]);

  // Handle auto-printing only when config and companyInfo are fully fetched and mounted
  useEffect(() => {
    if (mounted && config && companyInfo && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
        if (onPrintComplete) {
          onPrintComplete();
        }
      }, 800); // Increased settle timeout to guarantee complete style & DOM hydration
      return () => clearTimeout(timer);
    }
  }, [mounted, config, companyInfo, autoPrint, onPrintComplete]);

  if (!config || !mounted) return null;

  // Determine Receipt Type Title
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

  const carService = Math.round(data.carService || 0);
  const carServiceDiscount = Math.round(data.carServiceDiscount || 0);
  
  const itemsDiscount = items.reduce((acc: number, item: any) => {
    const gross = (Number(item.qty || item.cartons || 1) * Number(item.rate || item.unitPrice || 0));
    const net = Number(item.netAmount || item.total || item.amount || 0);
    return acc + Math.max(0, gross - net);
  }, 0);

  // Format date and time
  const rawDate = data.date ? new Date(data.date) : new Date();
  const dateStr = rawDate.toLocaleDateString('en-GB'); // dd-mm-yyyy format
  const timeStr = rawDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Bullet-proof customer name resolution
  const customerName = (data.customer && data.customer.trim() && data.customer !== "Search Customer...")
    ? data.customer
    : (data.supplier && data.supplier.trim())
    ? data.supplier
    : (data.partyName && data.partyName.trim())
    ? data.partyName
    : "Walk-in Customer";

  const isThermal = activeFormat === "thermal";

  const printLayout = (
    <div id="print-area" className={`bg-white text-black p-0 m-0 ${isThermal ? 'font-mono text-[11px]' : 'font-sans text-xs'}`}>
      <style>{`
        /* Screen view: hide the print layout completely */
        #print-area {
          display: none;
        }

        @media print {
          /* Completely hide the React app root and all other body siblings to prevent background grid bleeding */
          body > *:not(#print-area) {
            display: none !important;
          }
          
          /* Show ONLY the print-area at the top left of the page */
          #print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${activeFormat === 'a4' ? '190mm' : activeFormat === 'a5' ? '128mm' : '72mm'} !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
          }
          
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            size: ${activeFormat === 'a4' ? 'A4 portrait' : activeFormat === 'a5' ? 'A5 portrait' : 'auto'};
            margin: ${activeFormat === 'thermal' ? '0' : '10mm'};
          }
        }
      `}</style>

      {isThermal ? (
        /* Thermal Receipt Layout (80mm) */
        <div style={{ fontFamily: 'monospace' }} className="flex flex-col">
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
            {data.regNo && (
              <div className="flex justify-between">
                <span>Vehicle No:</span>
                <span>{data.regNo}</span>
              </div>
            )}
            {data.startKms !== undefined && (data.startKms > 0 || data.endKms > 0) && (
              <div className="flex justify-between">
                <span>KMs (S/E/R):</span>
                <span>{data.startKms || 0} / {data.endKms || 0} / {data.rangeKms || 0}</span>
              </div>
            )}
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
            {itemsDiscount > 0 && (
              <div className="flex justify-between">
                <span>Product Discount</span>
                <span>-{itemsDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {carService > 0 && (
              <div className="flex justify-between">
                <span>Car Service Charges</span>
                <span>+{carService.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {carServiceDiscount > 0 && (
              <div className="flex justify-between">
                <span>Car Wash Discount</span>
                <span>-{carServiceDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between">
                <span>Additional Discount</span>
                <span>-{discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
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
      ) : (
        /* Corporate A4 / A5 Layout */
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-maroon-800 pb-4 mb-6">
            <div>
              {config.showLogo && companyInfo?.logo && (
                <div className="mb-2">
                  <Image 
                    src={companyInfo.logo} 
                    alt="Company Logo" 
                    width={120}
                    height={50}
                    unoptimized
                    className="h-12 w-auto object-contain grayscale" 
                  />
                </div>
              )}
              <h2 className="text-xl font-extrabold uppercase text-maroon-850">
                {companyInfo?.name || "AL HADEED TRADERS"}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                {companyInfo?.address || "Main Road, Oil Shop Market"}
              </p>
              <p className="text-[10px] text-slate-500 font-bold">
                Tel: {companyInfo?.phone || "03108444612"} | City: {companyInfo?.city || "Karachi"}
              </p>
            </div>
            
            <div className="text-right">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">
                {receiptType}
              </h1>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold text-left border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <span className="text-slate-400">Doc No:</span>
                <span className="text-slate-800 text-right">{data.invoiceNo || data.poNumber || data.referenceNo || data.receiptNo || data.voucherNo || "-"}</span>
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-800 text-right">{dateStr}</span>
                <span className="text-slate-400">Time:</span>
                <span className="text-slate-850 text-right">{timeStr}</span>
                <span className="text-slate-400">Payment:</span>
                <span className="text-slate-855 text-right uppercase">{data.paymentMethod || data.paymentMode || "Credit"}</span>
              </div>
            </div>
          </div>

          {/* Client Info & Vehicle Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-slate-200 p-3 rounded-lg">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Billed To</h3>
              <p className="font-extrabold text-sm text-slate-800">{customerName}</p>
              {data.partyId?.phone && <p className="text-[10px] text-slate-600 font-bold mt-1">Tel: {data.partyId.phone}</p>}
              {data.partyId?.address && <p className="text-[10px] text-slate-500 mt-0.5">{data.partyId.address}</p>}
            </div>

            <div className="border border-slate-200 p-3 rounded-lg">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Vehicle & Service Details</h3>
              {data.regNo ? (
                <div className="grid grid-cols-2 gap-y-1 text-[10px] font-bold">
                  <span className="text-slate-400">Vehicle No:</span>
                  <span className="text-slate-800 text-right">{data.regNo}</span>
                  {data.startKms !== undefined && (
                    <>
                      <span className="text-slate-400">KMs (S/E/R):</span>
                      <span className="text-slate-800 text-right">{data.startKms || 0} / {data.endKms || 0} / {data.rangeKms || 0}</span>
                    </>
                  )}
                  {data.oilGaugeLimit ? (
                    <>
                      <span className="text-slate-400">Oil Gauge Limit:</span>
                      <span className="text-slate-800 text-right">{data.oilGaugeLimit}</span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-bold italic py-2">No vehicle details provided</p>
              )}
            </div>
          </div>

          {/* Main Items Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-slate-350 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                <th className="py-2.5 px-2 text-left w-8">#</th>
                <th className="py-2.5 px-2 text-left">Description</th>
                <th className="py-2.5 px-2 text-center w-16">Qty</th>
                <th className="py-2.5 px-2 text-right w-24">Price/Ctn</th>
                <th className="py-2.5 px-2 text-right w-20">Discount</th>
                <th className="py-2.5 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px] font-bold text-slate-700">
              {items.map((item: any, i: number) => {
                const desc = item.description || item.itemName || item.accountName || "Item";
                const qty = item.qty || item.cartons || 1;
                const price = Number(item.unitPrice || item.rate || item.amount || 0);
                const total = Number(item.total || item.amount || item.netAmount || item.grossAmount || 0);
                
                const gross = qty * price;
                const disc = Math.max(0, gross - total);

                return (
                  <tr key={i}>
                    <td className="py-2.5 px-2 text-slate-400 font-medium">{i + 1}</td>
                    <td className="py-2.5 px-2 text-slate-800 font-black">{desc}</td>
                    <td className="py-2.5 px-2 text-center">{qty}</td>
                    <td className="py-2.5 px-2 text-right">PKR {price.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right text-rose-600 font-medium">{disc > 0 ? `PKR ${disc.toLocaleString()}` : "-"}</td>
                    <td className="py-2.5 px-2 text-right text-slate-900 font-black">PKR {total.toLocaleString()}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">No items found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Summary and Signatures */}
          <div className="grid grid-cols-12 gap-6 mt-8">
            <div className="col-span-7 space-y-6">
              <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                <p className="font-extrabold text-slate-700 mb-1">Notes / Terms:</p>
                <p>1. Goods once sold are only returnable within 7 days with original receipt.</p>
                <p>2. Payment should be made as per agreed terms.</p>
                {data.notes && <p className="mt-2 text-maroon-800 font-bold">Remarks: {data.notes}</p>}
              </div>
              
              {/* Signature lines */}
              <div className="flex gap-12 pt-8">
                <div className="flex-1 border-t border-slate-300 text-center pt-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Customer Signature</span>
                </div>
                <div className="flex-1 border-t border-slate-300 text-center pt-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Authorized Signature</span>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="col-span-5 border border-slate-200 rounded-xl p-3 bg-slate-50 text-[10px] font-bold space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Gross Total:</span>
                <span className="text-slate-800">PKR {grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {itemsDiscount > 0 && (
                <div className="flex justify-between">
                  <span>Product Discount:</span>
                  <span className="text-rose-600">-PKR {itemsDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {carService > 0 && (
                <div className="flex justify-between">
                  <span>Car Service Charges:</span>
                  <span className="text-slate-800">+PKR {carService.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {carServiceDiscount > 0 && (
                <div className="flex justify-between">
                  <span>Car Wash Discount:</span>
                  <span className="text-rose-600">-PKR {carServiceDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Additional Discount:</span>
                  <span className="text-rose-600">-PKR {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black pt-2 border-t border-slate-300 text-slate-900 uppercase">
                <span>Net Total:</span>
                <span>PKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-1 text-slate-500">
                <span>Amount Paid:</span>
                <span>PKR {amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cash Back:</span>
                <span>PKR {cashBack >= 0 ? cashBack.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] font-bold border-t border-slate-200 pt-4 mt-12">
            <span className="block font-black">*Thanks For Your Visit*</span>
            <span className="block text-slate-400 mt-1">Software By: Roonjha Developers : 03152914836</span>
          </div>
        </div>
      )}
    </div>
  );

  const toolbar = (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-3 flex items-center gap-3 z-[9999] no-print">
      <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Print Size:</span>
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
        {(['thermal', 'a5', 'a4'] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => setActiveFormat(fmt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              activeFormat === fmt
                ? 'bg-maroon-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-maroon-800 text-white rounded-lg text-xs font-black hover:bg-maroon-900 transition-all shadow-md shadow-maroon-900/10 uppercase"
      >
        Print
      </button>
    </div>
  );

  return (
    <>
      {mounted && toolbar}
      {mounted && createPortal(printLayout, document.body)}
    </>
  );
}
