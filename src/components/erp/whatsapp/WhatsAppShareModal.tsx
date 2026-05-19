"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Phone, MessageCircle, FileText, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: any;
  type?: "Statement" | "Invoice" | "Receipt" | "Reminder";
  referenceId?: string;
  documentData?: any; // e.g. ledger rows, invoice details
  shopProfile?: any;
}

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  party,
  type = "Statement",
  referenceId,
  documentData,
  shopProfile
}: WhatsAppShareModalProps) {
  const [phone, setPhone] = useState(party?.phone || party?.mobile || "");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPhone(party?.phone || party?.mobile || "");
      setStatus("idle");
      
      // Auto-generate default message
      const outstanding = type === "Statement" && documentData?.closing 
        ? documentData.closing 
        : party?.balance || 0;
        
      const defaultMsg = `Assalamualaikum ${party?.name || party?.companyName || "Customer"},\n\nYour account ${type.toLowerCase()} from ${shopProfile?.companyName || "Our Shop"} is attached.\n\nTotal Outstanding Balance: Rs. ${outstanding.toLocaleString()}\n\nThank you.`;
      setMessage(defaultMsg);
    }
  }, [isOpen, party, type, documentData, shopProfile]);

  const generatePDF = async (): Promise<string | null> => {
    if (!printRef.current) return null;
    
    try {
      // Unhide for a split second to capture if needed, but absolute positioning off-screen usually works
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      
      // Return base64 string (remove data URI prefix)
      const base64 = pdf.output("datauristring").split(",")[1];
      return base64;
    } catch (e) {
      console.error("PDF Generation Error", e);
      return null;
    }
  };

  const handleSend = async () => {
    if (!phone) {
      setErrorMessage("Please enter a valid WhatsApp number.");
      setStatus("error");
      return;
    }
    
    setIsSending(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      let pdfBase64 = null;
      if (documentData && type === "Statement") {
        pdfBase64 = await generatePDF();
      }

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: party?.name || "Customer",
          recipientPhone: phone,
          type,
          referenceId: referenceId || party?._id,
          message,
          pdfBase64,
          useWebFallback: false
        })
      });

      const data = await res.json();

      if (data.ok) {
        setStatus("success");
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to send message");
      }
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e.message || "An error occurred");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-[#25D366] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MessageCircle size={24} className="fill-white/20" />
            <div>
              <h3 className="font-black text-lg">Send via WhatsApp</h3>
              <p className="text-white/80 text-xs font-bold">Share {type} directly to customer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {status === "success" && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">Message processed successfully!</p>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-900/30">
              <AlertTriangle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Phone size={14} /> WhatsApp Number
            </label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +923001234567"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all dark:text-white"
            />
            <p className="text-[10px] text-slate-400 font-bold px-1">Include country code (e.g. +92 for Pakistan)</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Message Details
            </label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all dark:text-white"
            />
          </div>

          {documentData && type === "Statement" && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">Statement_{party?.name?.replace(/\s+/g, '_')}.pdf</p>
                <p className="text-xs text-slate-500 font-bold">Auto-generated • {documentData.rows?.length || 0} transactions</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-sm font-black shadow-lg shadow-[#25D366]/30 transition-all disabled:opacity-70"
          >
            {isSending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            {isSending ? "Sending..." : "Send via WhatsApp"}
          </button>
        </div>
      </div>

      {/* Hidden PDF Render Container */}
      {documentData && type === "Statement" && (
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
          <div ref={printRef} className="w-[800px] bg-white p-10 text-black">
            {/* Minimal Statement Layout for PDF Generation */}
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black uppercase">{shopProfile?.companyName || "COMPANY NAME"}</h1>
                <p className="text-sm">{shopProfile?.address || "Address"}</p>
                <p className="text-sm">Ph: {shopProfile?.phone || "-"} | NTN: {shopProfile?.ntn || "-"}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black uppercase text-gray-800">Account Statement</h2>
                <p className="text-sm font-bold">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mb-8 grid grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500">Customer Details</p>
                <h3 className="text-lg font-black uppercase">{party?.name}</h3>
                <p className="text-sm">Phone: {party?.phone || party?.mobile || "-"}</p>
                <p className="text-sm">Area: {party?.area || "-"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-gray-500">Statement Period</p>
                <p className="text-sm font-bold">As of {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse mb-8">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-2 text-sm">Date</th>
                  <th className="py-2 text-sm">Description</th>
                  <th className="py-2 text-right text-sm">Debit</th>
                  <th className="py-2 text-right text-sm">Credit</th>
                  <th className="py-2 text-right text-sm">Balance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-2">-</td>
                  <td className="py-2 font-bold">Opening Balance</td>
                  <td className="py-2 text-right">-</td>
                  <td className="py-2 text-right">-</td>
                  <td className="py-2 text-right font-bold">Rs. {documentData.opening?.toLocaleString()}</td>
                </tr>
                {documentData.rows?.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-2">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-2">{r.remarks || r.type}</td>
                    <td className="py-2 text-right">{r.debit > 0 ? r.debit.toLocaleString() : "-"}</td>
                    <td className="py-2 text-right">{r.credit > 0 ? r.credit.toLocaleString() : "-"}</td>
                    <td className="py-2 text-right">Rs. {r.runningBalance?.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={2} className="py-3 text-right">Totals:</td>
                  <td className="py-3 text-right">Rs. {documentData.totalDr?.toLocaleString()}</td>
                  <td className="py-3 text-right">Rs. {documentData.totalCr?.toLocaleString()}</td>
                  <td className="py-3 text-right text-lg">Rs. {documentData.closing?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            
            <div className="mt-16 text-center text-xs text-gray-500 italic">
              This is a computer-generated statement and does not require a signature.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
