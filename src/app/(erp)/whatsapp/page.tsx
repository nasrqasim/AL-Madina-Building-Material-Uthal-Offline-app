"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { MessageCircle, CheckCircle, AlertTriangle, Clock, RefreshCw, Smartphone } from "lucide-react";
import ERPStatCard from "@/components/erp/ui/ERPStatCard";

export default function WhatsAppLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/whatsapp/logs");
      const json = await res.json();
      if (json.ok) setLogs(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const totalSent = logs.filter(l => l.status === "Sent" || l.status === "Delivered").length;
  const totalFailed = logs.filter(l => l.status === "Failed").length;
  const statementsSent = logs.filter(l => l.type === "Statement").length;

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="WhatsApp Center" 
        subtitle="Communication / WhatsApp Activity Logs"
        actions={[
          { label: "Refresh Logs", onClick: fetchLogs, icon: RefreshCw }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ERPStatCard label="Total Messages Sent" value={totalSent} icon={MessageCircle} variant="green" />
        <ERPStatCard label="Statements Shared" value={statementsSent} icon={Smartphone} variant="blue" />
        <ERPStatCard label="Failed Deliveries" value={totalFailed} icon={AlertTriangle} variant="maroon" />
        <ERPStatCard label="Recent Activity" value={logs.length > 0 ? "Active" : "None"} icon={Clock} variant="slate" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
        <h3 className="text-lg font-black mb-4">Message History</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Date & Time</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Recipient</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Number</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Document Type</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-bold">Loading activity logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-bold">No WhatsApp messages sent yet. Use the WhatsApp button on Customers/Vendors or Invoices pages to send statements.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">
                      {log.recipientName}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {log.recipientPhone}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        log.status === "Sent" || log.status === "Delivered" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      }`}>
                        {log.status === "Failed" ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500 truncate max-w-xs">
                      {log.errorMessage || "Message shared successfully"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
