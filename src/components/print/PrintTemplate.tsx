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

  return (
    <div className="hidden print:flex flex-col w-full bg-white text-black font-sans absolute inset-0 z-[9999] m-0 p-8 min-h-screen" style={{ fontFamily: config.headerFont }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 2rem;
            background: white;
          }
        }
      `}</style>
      <div id="print-area" className="w-full flex-col min-h-screen">
        {/* Header */}
        <div className="flex justify-between border-b-4 pb-8" style={{ borderColor: config.themeColor }}>
          <div className="space-y-4">
            {config.showLogo && (
              companyInfo?.logo ? (
                <Image 
                  src={companyInfo.logo} 
                  alt="Company Logo" 
                  width={200}
                  height={64}
                  unoptimized
                  className="h-16 w-auto object-contain" 
                />
              ) : (
                <div className="w-32 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest border border-dashed border-slate-300">
                  No Logo Uploaded
                </div>
              )
            )}
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">{companyInfo?.companyName || "Oil Shop ERP"}</h2>
              <p className="text-[10px] text-slate-500 font-medium">{companyInfo?.address || "Address Line 1"}, {companyInfo?.city || "City"}</p>
              <p className="text-[10px] text-slate-500 font-medium">Ph: {companyInfo?.phone || "+92 000 0000000"} | NTN: {companyInfo?.ntn || "0000000-0"}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <h1 className="text-4xl font-black tracking-tighter" style={{ color: config.themeColor }}>{formatName.toUpperCase()}</h1>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{data.invoiceNo || data.poNumber || data.referenceNo || data.receiptNo || data.voucherNo || "DOC-001"}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-4">Date: {data.date || new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="py-8 grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: config.themeColor }}>Bill To</p>
            <h4 className="text-sm font-black text-slate-900">{data.customer || data.supplier || data.partyName || data.receivedFrom || data.paidTo || "General Party"}</h4>
            <p className="text-[10px] text-slate-500 font-medium">Address on file</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: config.themeColor }}>Reference</p>
            <h4 className="text-sm font-black text-slate-900">{data.linkedRef || data.reference || "-"}</h4>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 mt-4">
          <table className="w-full text-left">
            <thead style={{ color: config.themeColor }}>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">#</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Description</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">Qty</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">Price</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any, i: number) => (
                <tr key={i} className="text-[10px] font-bold text-slate-700">
                  <td className="px-4 py-4">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-4">{item.description || item.itemName || item.accountName || "Item"}</td>
                  <td className="px-4 py-4 text-center">{item.qty || "-"}</td>
                  <td className="px-4 py-4 text-right">{item.unitPrice || item.rate || item.amount ? (item.unitPrice || item.rate || item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}</td>
                  <td className="px-4 py-4 text-right">{(item.total || item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr className="text-[10px] font-bold text-slate-700">
                  <td colSpan={5} className="px-4 py-4 text-center">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-8 border-t-2 pt-4 space-y-1 ml-auto w-64" style={{ borderColor: config.themeColor }}>
          {(data.subtotal > 0 || data.total > 0) && (
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-400 uppercase tracking-tighter">Subtotal</span>
              <span className="text-slate-900">{(data.subtotal || data.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {data.taxAmount > 0 && (
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-400 uppercase tracking-tighter">Tax</span>
              <span className="text-slate-900">{(data.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {data.discountAmount > 0 && (
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-400 uppercase tracking-tighter">Discount</span>
              <span className="text-red-600">-{(data.discountAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-black pt-4" style={{ color: config.themeColor }}>
            <span className="uppercase tracking-tighter">TOTAL</span>
            <span>{(data.total || data.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-12 flex items-end justify-between break-inside-avoid">
          <div className="text-left w-1/3">
            {config.showBankDetails && (
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bank Details</p>
                <p className="text-[10px] font-bold text-slate-700">Habib Bank Limited (HBL)</p>
                <p className="text-[10px] font-bold text-slate-700">A/C: 1234-5678-9012</p>
              </div>
            )}
          </div>
          <div className="text-center w-1/3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{config.footerText}</p>
          </div>
          <div className="text-right w-1/3 flex flex-col items-end">
            {config.showSignature && (
              <div className="space-y-2">
                <div className="w-32 border-b border-slate-300"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Authorized Signature</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
