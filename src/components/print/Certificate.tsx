"use client";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

import React from "react";
import Image from "next/image";

interface CertificateProps {
  data: any;
  companyInfo: any;
  config: any;
  dateStr: string;
}

export default function Certificate({
  data,
  companyInfo,
  config,
  dateStr,
}: CertificateProps) {
  const recipientName = data.studentName || data.customer || data.recipientName || "Walk-in Customer";
  const certificateTitle = data.certificateTitle || "Certificate of Appreciation";
  const certificateBody = data.certificateBody || "For outstanding performance and dedication in services.";

  return (
    <div 
      className="certificate-container bg-white text-black flex flex-col justify-between items-center text-center font-serif relative"
      style={{
        padding: "20mm",
        width: "297mm",  // Landscape A4 by default for certificates
        height: "210mm",
        boxSizing: "border-box",
        border: `8px double ${config.themeColor || "#800000"}`,
      }}
    >
      {/* Decorative corners */}
      <div 
        className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4" 
        style={{ borderColor: config.themeColor || "#800000" }} 
      />
      <div 
        className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4" 
        style={{ borderColor: config.themeColor || "#800000" }} 
      />
      <div 
        className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4" 
        style={{ borderColor: config.themeColor || "#800000" }} 
      />
      <div 
        className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4" 
        style={{ borderColor: config.themeColor || "#800000" }} 
      />

      {/* Header */}
      <div className="flex flex-col items-center mt-6">
        {config.showLogo && companyInfo?.logo && (
          <div className="mb-4">
            <Image 
              src={companyInfo.logo} 
              alt="Company Logo" 
              width={120}
              height={50}
              unoptimized
              className="h-12 w-auto object-contain" 
            />
          </div>
        )}
        <h2 className="text-lg font-bold tracking-widest uppercase mb-1" style={{ color: config.themeColor || "#800000" }}>
          {companyInfo?.companyName || COMPANY_NAME}
        </h2>
        <div className="w-24 h-0.5 bg-slate-300 my-1"></div>
      </div>

      {/* Certificate Content */}
      <div className="flex-1 flex flex-col justify-center items-center my-6 space-y-6">
        <h1 className="text-4xl font-extrabold tracking-wide uppercase italic my-2 font-sans" style={{ color: config.themeColor || "#800000" }}>
          {certificateTitle}
        </h1>
        
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">
          This is proudly presented to
        </p>
        
        <h3 className="text-3xl font-black italic underline decoration-1 underline-offset-8 font-serif py-2" style={{ color: config.themeColor || "#800000" }}>
          {recipientName}
        </h3>
        
        <p className="text-sm font-medium text-slate-700 max-w-[650px] leading-relaxed italic mx-auto">
          {certificateBody}
        </p>
      </div>

      {/* Signatures & Footer */}
      <div className="w-full flex justify-between items-end px-12 mb-6 text-sm font-bold text-slate-600 font-sans">
        <div className="flex flex-col items-center w-48">
          <span className="text-xs text-slate-900 border-b border-slate-350 pb-1 w-full block">{dateStr}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">Date</span>
        </div>
        
        <div className="flex flex-col items-center w-48">
          {config.showBankDetails && (
            <div className="w-10 h-10 border border-slate-200 rounded flex items-center justify-center text-[7px] text-slate-400 mb-2">
              [ SEAL ]
            </div>
          )}
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Official Seal</span>
        </div>
        
        <div className="flex flex-col items-center w-48">
          <span className="w-full border-b border-slate-350 block h-6"></span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">Authorized Signature</span>
        </div>
      </div>
    </div>
  );
}
