"use client";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

import React from "react";

interface ReportProps {
  data: any;
  items: any[];
  companyInfo: any;
  config: any;
  dateStr: string;
  timeStr: string;
}

export default function Report({
  data,
  items,
  companyInfo,
  config,
  dateStr,
  timeStr,
}: ReportProps) {
  const reportTitle = data.reportTitle || data.receiptType || "Financial Report";
  const subtitle = data.subtitle || `Generated on ${dateStr} at ${timeStr}`;

  return (
    <div className="report-container bg-white text-black flex flex-col font-sans p-6 w-full box-border min-h-[297mm]">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: config.themeColor || "#800000" }}>
        <div>
          <h2 className="text-base font-black uppercase tracking-tight" style={{ color: config.themeColor || "#800000" }}>
            {companyInfo?.companyName || COMPANY_NAME}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold leading-tight">
            {companyInfo?.address || DEFAULT_COMPANY_ADDRESS_LINE}
          </p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">
            Tel: {companyInfo?.phone || "03108444612"} | City: {companyInfo?.city || "Karachi"}
          </p>
        </div>
        
        <div className="text-right">
          <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: config.themeColor || "#800000" }}>
            {reportTitle}
          </h1>
          <p className="text-[9px] text-slate-400 font-bold mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Meta details if any */}
      {data.metaDetails && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 grid grid-cols-3 gap-4 text-[10px] font-bold">
          {Object.entries(data.metaDetails).map(([key, val]: any) => (
            <div key={key} className="flex flex-col">
              <span className="text-slate-400 uppercase tracking-widest text-[8px]">{key}</span>
              <span className="text-slate-800 font-black mt-0.5">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Report Table */}
      <div className="flex-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 text-[9px] font-black text-slate-450 uppercase tracking-widest bg-slate-50" style={{ borderColor: config.themeColor || "#800000" }}>
              <th className="py-2 px-2 text-left w-8">#</th>
              {data.headers ? (
                data.headers.map((h: string, idx: number) => (
                  <th key={idx} className={`py-2 px-2 ${idx === data.headers.length - 1 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))
              ) : (
                <>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-center w-24">Reference</th>
                  <th className="py-2 px-2 text-right w-32">Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[10px] font-bold text-slate-700">
            {items.map((item: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="py-2 px-2 text-slate-400 font-medium">{i + 1}</td>
                {data.rowAccessor ? (
                  data.rowAccessor(item, i)
                ) : (
                  <>
                    <td className="py-2.5 px-2 text-slate-800 font-black">
                      {item.description || item.itemName || item.accountName || "-"}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-500">
                      {item.reference || item.refNo || item.invoiceNo || "-"}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-900 font-black">
                      PKR {Math.round(item.amount || item.total || 0).toLocaleString()}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={data.headers ? data.headers.length + 1 : 4} className="py-8 text-center text-slate-400 italic font-bold">
                  No records found for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals / Summary Row */}
      {data.showTotals !== false && items.length > 0 && (
        <div className="border-t border-slate-200 mt-6 pt-4 flex justify-between items-center text-[11px] font-black">
          <span className="text-slate-450 uppercase tracking-widest text-[9px]">Report Summary</span>
          <div className="flex gap-6">
            {data.totalCountLabel && (
              <span className="text-slate-600">
                {data.totalCountLabel}: <span className="text-slate-900">{items.length}</span>
              </span>
            )}
            {data.totalAmount !== undefined && (
              <span className="text-slate-900 uppercase">
                Total Amount: <span style={{ color: config.themeColor || "#800000" }}>PKR {Math.round(data.totalAmount).toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[9px] font-bold border-t border-slate-200 pt-3 mt-12 text-slate-400">
        <span>Report Generated By APP_NAME — Confidential</span>
      </div>
    </div>
  );
}
