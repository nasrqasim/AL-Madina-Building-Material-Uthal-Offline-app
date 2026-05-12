"use client";

import { useState, useRef } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ImportTemplateModal from "@/components/erp/maintain/ImportTemplateModal";
import { Plus, Search, FileDown, Upload, FileSpreadsheet, Trash2, CheckCircle2, Loader2, X, FileText, Download, Printer } from "lucide-react";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function ImportTemplatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState([
    { id: "1", name: "Items Import", type: "Excel", fields: 12, lastUpdated: "2026-04-15" },
    { id: "2", name: "Opening Balances", type: "CSV", fields: 4, lastUpdated: "2026-04-20" },
    { id: "3", name: "Customer List", type: "Excel", fields: 15, lastUpdated: "2026-04-10" },
  ]);

  const handleDownload = (template: typeof templates[0]) => {
    let headers = "";
    if (template.name === "Items Import") {
      headers = "Item Code,Name,Category,Unit,Purchase Price,Sales Price,Initial Qty,Min Qty,Max Qty,Tax Rate,SKU,Description";
    } else if (template.name === "Opening Balances") {
      headers = "Account Code,Account Name,Debit,Credit";
    } else if (template.name === "Customer List") {
      headers = "Customer Code,Name,Group,Contact Person,Phone,Email,Address,City,Country,Credit Limit,Credit Days,Tax Number,Opening Balance,Sales Person,Notes";
    }

    const blob = new Blob([headers], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, "_")}_template.${template.type === "Excel" ? "csv" : "csv"}`; // Using CSV for both for demo simplicity
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    setNotification({ type: 'success', message: `${template.name} template downloaded successfully!` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportList = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      const newTemplates = data.map((row: any) => ({
        id: Date.now().toString() + Math.random().toString(),
        name: row["Name"] || row.name || "Unknown Template",
        type: row["Type"] || row.type || "Excel",
        fields: parseInt(row["Fields"] || row.fields || "0"),
        lastUpdated: new Date().toISOString().split('T')[0]
      }));
      setTemplates([...templates, ...newTemplates]);
    }
  };

  const handleImportClick = (id: string) => {
    setImportingId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImportingId(null);
      return;
    }

    // Simulate import processing
    setTimeout(() => {
      const template = templates.find(t => t.id === importingId);
      setImportingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      setNotification({ 
        type: 'success', 
        message: `${template?.name} data imported successfully! ${Math.floor(Math.random() * 50) + 10} records processed.` 
      });
      
      // Update last updated date
      const now = new Date().toISOString().split('T')[0];
      setTemplates(prev => prev.map(t => t.id === template?.id ? { ...t, lastUpdated: now } : t));
      
      setTimeout(() => setNotification(null), 5000);
    }, 2000);
  };

  const removeTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setNotification({ type: 'success', message: "Template removed successfully." });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            <CheckCircle2 size={20} className={notification.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
            <p className="text-sm font-bold">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-4 p-1 hover:bg-black/5 rounded-full">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <ERPPageHeader 
        title="Import Templates" 
        description="Download and manage Excel/CSV templates for bulk data importing."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export", onClick: () => exportToExcel(templates, "ImportTemplates.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Name", "Type", "Fields"], "ImportTemplatesTemplate.xlsx"), icon: Download },
          { label: "Import", onClick: handleImportList, icon: FileText },
        ]}
      />

      {/* Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search templates..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
          >
            <Plus size={18} />
            New Template
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".csv,.xlsx,.xls"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-maroon-300 hover:shadow-2xl transition-all relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <FileSpreadsheet size={24} />
              </div>
              <button 
                onClick={() => removeTemplate(template.id)}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{template.name}</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">Format: <span className="font-bold text-slate-700 dark:text-slate-200">{template.type}</span> • {template.fields} Columns</p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button 
                onClick={() => handleDownload(template)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-all active:scale-95"
              >
                <FileDown size={16} />
                DOWNLOAD
              </button>
              <button 
                onClick={() => handleImportClick(template.id)}
                disabled={importingId === template.id}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-maroon-50 text-maroon-800 rounded-xl font-black text-xs hover:bg-maroon-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importingId === template.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    IMPORTING...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    IMPORT
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Last Updated: {template.lastUpdated}</p>
            </div>
          </div>
        ))}
      </div>

      <ImportTemplateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
