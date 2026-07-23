"use client";

import { useState, useEffect } from "react";
import { 
  Archive, 
  FileSpreadsheet, 
  Download, 
  ShieldCheck, 
  FileJson, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info
} from "lucide-react";
import * as XLSX from "xlsx";

export default function BackupExportPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/backup/stats');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setStatus(null);
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      console.log("Backup blob received, size:", blob.size);
      setStatus({ type: 'success', message: 'File prepared! Starting download...' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oilshop_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setStatus({ type: 'success', message: 'Backup created and downloaded successfully!' });
    } catch (error: any) {
      console.error("Backup Error:", error);
      setStatus({ type: 'error', message: error.message || 'Failed to create backup. Please try again.' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setStatus(null);
    try {
      setStatus({ type: 'success', message: 'Fetching data from server...' });
      const response = await fetch('/api/export/data');
      if (!response.ok) throw new Error('Failed to fetch data for export');
      
      const allData = await response.json();
      setStatus({ type: 'success', message: 'Data received! Generating Excel workbook...' });

      const workbook = XLSX.utils.book_new();

      const cleanForExcel = (data: any[]) => {
        if (!data || !Array.isArray(data)) return [];
        return (data || []).map((doc: any) => {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(doc)) {
            if (key === "__v" || key === "password") continue;
            let val: any = value;
            
            // Handle populated objects (use name or title if available)
            if (val && typeof val === 'object' && !(val instanceof Date) && !Array.isArray(val)) {
              if (val.name) val = val.name;
              else if (val.title) val = val.title;
              else if (val.invoiceNo) val = val.invoiceNo;
              else {
                try {
                  val = JSON.stringify(val);
                } catch (e) {
                  val = String(val);
                }
              }
            } else if (Array.isArray(val)) {
              // For arrays (like invoice lines), stringify them but keep them readable
              try {
                val = JSON.stringify(val.map(item => {
                  if (typeof item === 'object' && item.name) return item.name;
                  return item;
                }));
              } catch (e) {
                val = JSON.stringify(val);
              }
            } else if (val instanceof Date) {
              val = val.toISOString();
            }
            
            // Excel limit: 32767 characters per cell
            if (typeof val === 'string' && val.length > 32000) {
              val = val.substring(0, 32000) + "... (truncated)";
            }
            cleaned[key] = val;
          }
          return cleaned;
        });
      };

      for (const [sheetName, data] of Object.entries(allData)) {
        const cleanData = cleanForExcel(data as any[]);
        const ws = XLSX.utils.json_to_sheet(cleanData.length > 0 ? cleanData : [{ Info: "No data" }]);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName.substring(0, 31));
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oilshop_export_${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setStatus({ type: 'success', message: 'Excel file generated and download started!' });
      alert("Excel Export Successful! Your download should start now.");
    } catch (error: any) {
      console.error("Export Error:", error);
      setStatus({ type: 'error', message: error.message || 'Failed to export data. Please try again.' });
      alert("Export Failed: " + (error.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Data Management</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
          <ShieldCheck size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Secure Backup System</span>
        </div>
      </div>

      <div className="space-y-1 mb-8">
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Backup & Export</h2>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium max-w-2xl">
          Download a copy of your company&apos;s data. Keep it safe — it&apos;s your responsibility to store backups securely.
        </p>
      </div>

      {status && (
        <div className={`p-6 rounded-[2rem] border animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-4 ${
          status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <p className="font-bold">{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Backup Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="p-8 lg:p-10 space-y-8">
            <div className="flex items-start justify-between">
              <div className="p-5 bg-indigo-50 text-indigo-600 rounded-3xl group-hover:scale-110 transition-transform duration-500">
                <Archive size={32} />
              </div>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                System Recovery
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Create Backup</h3>
              <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                Full snapshot of every record in your company — items, customers, vendors, transactions, settings, and everything else. Saved as a .zip of JSON files.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <Info size={18} className="mt-0.5 shrink-0" />
                <p>For disaster recovery — send to support if you ever need to restore.</p>
              </div>
              <div className="flex items-start gap-3 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <FileJson size={18} className="mt-0.5 shrink-0" />
                <p>Complete and machine-readable. Not meant to be opened by humans.</p>
              </div>
              <div className="flex items-start gap-3 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>Image/file attachments are not included (only their links).</p>
              </div>
            </div>

            <button 
              onClick={handleCreateBackup}
              disabled={isBackingUp || isExporting}
              className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-600 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-slate-200"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Preparing Backup...</span>
                </>
              ) : (
                <>
                  <Download size={24} />
                  <span>Create Backup</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="p-8 lg:p-10 space-y-8">
            <div className="flex items-start justify-between">
              <div className="p-5 bg-emerald-50 text-emerald-600 rounded-3xl group-hover:scale-110 transition-transform duration-500">
                <FileSpreadsheet size={32} />
              </div>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                Business Intelligence
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Export Data</h3>
              <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                Human-readable copy of your data as a single Excel workbook. One sheet per record type. Open it directly in Excel, Google Sheets, or LibreOffice.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <Info size={18} className="mt-0.5 shrink-0" />
                <p>For browsing, auditing, or sharing with your accountant.</p>
              </div>
              <div className="flex items-start gap-3 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <FileSpreadsheet size={18} className="mt-0.5 shrink-0" />
                <p>Nested data (e.g. invoice line items) is split into linked sheets.</p>
              </div>
              <div className="flex items-start gap-3 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>Not a recovery format — for that use &quot;Create Backup&quot;.</p>
              </div>
            </div>

            <button 
              onClick={handleExportData}
              disabled={isBackingUp || isExporting}
              className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-slate-200"
            >
              {isExporting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Generating Excel...</span>
                </>
              ) : (
                <>
                  <Download size={24} />
                  <span>Export Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Data Verification Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Data Verification</h2>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Real-time database record counts</p>
            </div>
          </div>
          <button 
            onClick={fetchStats}
            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-2xl transition-colors text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-blue-600"
            title="Refresh Stats"
          >
            <Loader2 className={isLoadingStats ? "animate-spin" : ""} size={20} />
          </button>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoadingStats ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
              ))
            ) : (
              (stats || []).map((s: any, i: number) => (
                <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-400">{s.name}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{s.count}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2rem] flex gap-4">
        <div className="p-3 bg-white dark:bg-slate-900 text-amber-600 rounded-2xl h-fit">
          <Loader2 className={isBackingUp || isExporting ? "animate-spin" : ""} size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="font-black text-slate-800 dark:text-slate-100">Processing Time</h4>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed">
            Backups can take a few seconds to several minutes depending on the size of your data. The page may appear unresponsive while the file is being prepared — please wait until you see the success message.
          </p>
        </div>
      </div>
    </div>
  );
}
