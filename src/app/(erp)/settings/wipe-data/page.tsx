"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { Trash2, AlertTriangle, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

export default function WipeDataPage() {
  const [isWiping, setIsWiping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  const handleWipe = async () => {
    if (confirmText !== "WIPE ALL DATA") return;
    
    setIsWiping(true);
    
    // Simulate a thorough wipe process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 1. Clear Local Storage
    localStorage.clear();
    
    // 2. Set Global Wipe Flag
    localStorage.setItem("system_wiped", "true");
    
    // 3. Clear Session Storage
    sessionStorage.clear();
    
    // 3. Clear Cookies (basic ones we can reach from client)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    setIsWiping(false);
    setIsDone(true);

    // Redirect to login or dashboard after a short delay
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <ERPPageHeader
        title="Wipe All Data"
        description="Permanently delete all records and reset the ERP to factory settings."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-rose-50 dark:bg-rose-900/20 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-800 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-800 text-rose-600 dark:text-rose-300 rounded-2xl flex items-center justify-center mb-6">
            <Trash2 size={32} />
          </div>
          <h3 className="text-lg font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">Records</h3>
          <p className="text-sm text-rose-600 dark:text-rose-400 mt-2 font-medium">Invoices, Orders, Vouchers, and all Transactions.</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-800 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-800 text-rose-600 dark:text-rose-300 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-lg font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">Accounts</h3>
          <p className="text-sm text-rose-600 dark:text-rose-400 mt-2 font-medium">Customer details, Vendor profiles, and Charts.</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-800 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-800 text-rose-600 dark:text-rose-300 rounded-2xl flex items-center justify-center mb-6">
            <RefreshCw size={32} />
          </div>
          <h3 className="text-lg font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">Settings</h3>
          <p className="text-sm text-rose-600 dark:text-rose-400 mt-2 font-medium">Company info, Document preferences, and Roles.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
        {isDone && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">System Reset Complete</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Redirecting you to the login screen...</p>
          </div>
        )}

        <div className="p-12 space-y-10">
          <div className="flex items-start gap-6 p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl">
            <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={32} />
            <div className="space-y-2">
              <h4 className="text-lg font-black text-amber-900 dark:text-amber-100 tracking-tight uppercase">Critical Security Warning</h4>
              <p className="text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                This action is **irreversible**. Once the data is wiped, it cannot be recovered. 
                Please ensure you have a backup if you need to keep any information. 
                This will reset the entire Oil Shop ERP to its initial state.
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="space-y-4">
              <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type the following to confirm:</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white select-none tracking-widest">WIPE ALL DATA</p>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type here..."
                disabled={isWiping}
                className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] text-center text-xl font-black text-maroon-800 focus:border-maroon-800 transition-all outline-none uppercase"
              />
            </div>

            <button
              onClick={handleWipe}
              disabled={confirmText !== "WIPE ALL DATA" || isWiping}
              className={`w-full py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all ${
                confirmText === "WIPE ALL DATA" && !isWiping
                  ? "bg-rose-600 text-white shadow-2xl shadow-rose-600/30 hover:bg-rose-700 hover:scale-[1.02]" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              }`}
            >
              {isWiping ? (
                <>
                  <RefreshCw className="animate-spin" size={24} />
                  WIPING SYSTEM...
                </>
              ) : (
                <>
                  <Trash2 size={24} />
                  ERASE EVERYTHING PERMANENTLY
                </>
              )}
            </button>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-4">Oil Shop ERP Data Sanitization Protocol v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
