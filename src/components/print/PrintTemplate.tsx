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
    <div className="hidden print:flex flex-col bg-white text-black font-sans absolute inset-0 z-[9999] m-0 p-0" style={{ fontFamily: 'monospace' }}>
      <style>{`
        @page {
          margin: 0;
          size: 80mm auto; /* Thermal printer typical width 80mm */
        }
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
            width: 80mm; /* Force 80mm width */
            margin: 0 auto;
            padding: 5mm; /* Very small padding for thermal */
            background: white;
            font-family: monospace;
            font-size: 12px;
            color: black;
          }
          .thermal-dashed-border {
            border-bottom: 1px dashed black;
          }
        }
      `}</style>
      <div id="print-area" className="w-full flex-col">
        {/* Header */}
        <div className="text-center pb-2 thermal-dashed-border mb-2">
          {config.showLogo && companyInfo?.logo && (
            <div className="flex justify-center mb-1">
              <Image 
                src={companyInfo.logo} 
                alt="Company Logo" 
                width={80}
                height={32}
                unoptimized
                className="h-8 w-auto object-contain grayscale" 
              />
            </div>
          )}
          <h2 className="text-xl font-black uppercase">AL HADID TRADERS</h2>
          <p className="text-xs font-bold">{companyInfo?.address || "Address Line 1"}, {companyInfo?.city || "City"}</p>
          <p className="text-xs font-bold">Ph: {companyInfo?.phone || "+92 000 0000000"}</p>
          <p className="text-xs font-bold">NTN: {companyInfo?.ntn || "0000000-0"}</p>
        </div>

        {/* Invoice Info */}
        <div className="text-xs font-bold space-y-1 mb-2 thermal-dashed-border pb-2">
          <div className="flex justify-between">
            <span className="uppercase">{formatName}</span>
            <span>{data.invoiceNo || data.poNumber || data.referenceNo || data.receiptNo || data.voucherNo || "DOC-001"}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{data.date ? new Date(data.date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{data.customer || data.supplier || data.partyName || data.receivedFrom || data.paidTo || "Walk-in Customer"}</span>
          </div>
          {data.linkedRef && (
            <div className="flex justify-between">
              <span>Ref:</span>
              <span>{data.linkedRef}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="w-full mb-2 thermal-dashed-border pb-2">
          <table className="w-full text-xs font-bold">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1 w-1/2">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Rate</th>
                <th className="text-right py-1">Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={i} className="align-top">
                  <td className="py-1 break-words">{item.description || item.itemName || item.accountName || "Item"}</td>
                  <td className="py-1 text-center">{item.qty || item.cartons || 1}</td>
                  <td className="py-1 text-right">{Math.round(item.unitPrice || item.rate || item.amount || 0)}</td>
                  <td className="py-1 text-right">{Math.round(item.total || item.amount || item.netAmount || item.grossAmount || 0)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-2 text-center">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-xs font-bold mb-4">
          {((data.subtotal > 0 || data.total > 0) && data.discountAmount > 0) && (
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{Math.round(data.subtotal || (data.total + (data.discountAmount || 0)) || 0).toLocaleString()}</span>
            </div>
          )}
          {data.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{Math.round(data.discountAmount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black mt-1 pt-1 border-t border-black">
            <span>TOTAL PKR:</span>
            <span>{Math.round(data.total || data.amount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] font-bold space-y-1 mt-4 border-t border-dashed border-black pt-2">
          {config.showBankDetails && (
            <div>
              <p>HBL A/C: 1234-5678-9012</p>
            </div>
          )}
          <p>{config.footerText || "Thank you for your business!"}</p>
          <p>Powered by Oil Shop ERP</p>
        </div>
      </div>
    </div>
  );
}
