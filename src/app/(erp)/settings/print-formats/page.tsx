"use client";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

import { useState, useEffect } from "react";
import Image from "next/image";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import { 
  Printer, 
  Settings, 
  Layout, 
  FileText, 
  Image as ImageIcon, 
  Type, 
  Palette,
  Save,
  Undo,
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function PrintFormatsPage() {
  const [activeTab, setActiveTab] = useState("Sale Invoice");
  const [config, setConfig] = useState({
    themeColor: "#800000",
    headerFont: "Inter",
    showLogo: true,
    logoSize: "medium",
    paperSize: "A4",
    footerText: "Thank you for your business!",
    showBankDetails: true,
    showSignature: true
  });
  
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const formats = ["Sale Invoice", "Purchase Order", "Quotation", "Cash Receipt", "Voucher", "GRN", "Challan"];

  useEffect(() => {
    // Fetch Company Info for Preview
    fetch("/api/shop-profile")
      .then(res => res.json())
      .then(res => {
        if (res.ok) setCompanyInfo(res.data);
      });
  }, []);

  useEffect(() => {
    // Fetch Format Specific Config
    setIsLoading(true);
    fetch(`/api/settings/print-formats?formatName=${encodeURIComponent(activeTab)}`)
      .then(res => res.json())
      .then(res => {
        if (res.ok) {
          setConfig(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [activeTab]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/print-formats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formatName: activeTab, ...config }),
      });
      if (res.ok) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset to defaults?")) {
      setConfig({
        themeColor: "#800000",
        headerFont: "Inter",
        showLogo: true,
        logoSize: "medium",
        paperSize: "A4",
        footerText: "Thank you for your business!",
        showBankDetails: true,
        showSignature: true
      });
    }
  };

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Print Formats" 
        description="Configure and customize the layout of your printed documents."
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              <Undo size={18} />
              Reset
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-maroon-800 text-white rounded-xl font-black text-sm shadow-xl shadow-maroon-900/20 hover:bg-maroon-900 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Configuration Sidebar */}
        <div className="w-full lg:w-[400px] space-y-6">
          {/* Format Selector */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={18} className="text-maroon-800" />
              Select Format
            </h3>
            <div className="grid grid-cols-1 gap-1">
              {formats.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveTab(f)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === f 
                      ? "bg-maroon-50 text-maroon-800 shadow-inner" 
                      : "text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <Settings size={18} className="text-maroon-800" />
              Design Settings
            </h3>

            {isLoading ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading...</div>
            ) : (
              <>
                {/* Theme Color */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={14} /> Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={config.themeColor}
                      onChange={(e) => setConfig({...config, themeColor: e.target.value})}
                      className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input 
                      type="text" 
                      value={config.themeColor}
                      onChange={(e) => setConfig({...config, themeColor: e.target.value})}
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black uppercase"
                    />
                  </div>
                </div>

                {/* Logo Settings */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} /> Logo Options
                  </label>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Show Company Logo</span>
                    <input 
                      type="checkbox" 
                      checked={config.showLogo}
                      onChange={(e) => setConfig({...config, showLogo: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300 text-maroon-800 focus:ring-maroon-800"
                    />
                  </div>
                </div>

                {/* Paper Size */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Layout size={14} /> Paper Size
                  </label>
                  <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    {(["Thermal", "A5", "A4"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setConfig({...config, paperSize: size})}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                          config.paperSize === size
                            ? 'bg-maroon-800 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {size === "Thermal" ? "🧾 Thermal" : size === "A5" ? "📄 A5" : "📋 A4"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">
                    {config.paperSize === "Thermal" 
                      ? "80mm receipt printer — narrow thermal layout" 
                      : config.paperSize === "A5" 
                      ? "A5 (148×210mm) — half-page corporate layout"
                      : "A4 (210×297mm) — full-page corporate layout (Black Copper)"}
                  </p>
                </div>

                {/* Typography */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Type size={14} /> Typography
                  </label>
                  <select 
                    value={config.headerFont}
                    onChange={(e) => setConfig({...config, headerFont: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold"
                  >
                    <option>Inter</option>
                    <option>Roboto</option>
                    <option>Playfair Display</option>
                    <option>Montserrat</option>
                  </select>
                </div>

                {/* Layout */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Layout size={14} /> Layout Options
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Show Bank Details</span>
                      <input 
                        type="checkbox" 
                        checked={config.showBankDetails}
                        onChange={(e) => setConfig({...config, showBankDetails: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-300 text-maroon-800" 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Show Signature Line</span>
                      <input 
                        type="checkbox" 
                        checked={config.showSignature}
                        onChange={(e) => setConfig({...config, showSignature: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-300 text-maroon-800" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Footer Text</label>
                      <input 
                        type="text"
                        value={config.footerText}
                        onChange={(e) => setConfig({...config, footerText: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 bg-slate-200/50 rounded-[3rem] p-12 min-h-[800px] flex justify-center border-4 border-dashed border-slate-300/50 relative overflow-hidden">
          <div className="absolute top-8 left-12 flex items-center gap-2 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
            <Printer size={16} />
            LIVE PRINT PREVIEW — {activeTab}
          </div>

          {/* Paper Mockup */}
          <div className="w-full max-w-[600px] bg-white dark:bg-slate-900 shadow-2xl rounded-sm p-12 flex flex-col transform hover:scale-[1.01] transition-transform duration-500 origin-top h-fit min-h-[700px]">
            {/* Header */}
            <div className="flex justify-between border-b-4 pb-8" style={{ borderColor: config.themeColor, fontFamily: config.headerFont }}>
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
                    <div className="w-32 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-dashed border-slate-300">
                      No Logo Uploaded
                    </div>
                  )
                )}
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">{companyInfo?.companyName || COMPANY_NAME}</h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">{companyInfo?.address || "Address Line 1"}, {companyInfo?.city || "City"}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Ph: {companyInfo?.phone || "+92 000 0000000"} | NTN: {companyInfo?.ntn || "0000000-0"}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <h1 className="text-4xl font-black tracking-tighter" style={{ color: config.themeColor }}>{activeTab.toUpperCase()}</h1>
                <p className="text-sm font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">INV-2026-001</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-4">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="py-8 grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2" style={{ color: config.themeColor }}>Bill To</p>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">General Customer</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Customer Address Line 1</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">City, Country</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2" style={{ color: config.themeColor }}>Reference</p>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">PO-12345</h4>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 mt-4">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50" style={{ color: config.themeColor }}>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">#</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Description</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">Qty</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">Price</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                    <td className="px-4 py-4">01</td>
                    <td className="px-4 py-4">Premium Engine Oil 5W-30</td>
                    <td className="px-4 py-4 text-center">4</td>
                    <td className="px-4 py-4 text-right">4,500.00</td>
                    <td className="px-4 py-4 text-right">18,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-8 border-t-2 pt-4 space-y-1 ml-auto w-64" style={{ borderColor: config.themeColor }}>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Subtotal</span>
                <span className="text-slate-900 dark:text-white">18,000.00</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Tax (17%)</span>
                <span className="text-slate-900 dark:text-white">3,060.00</span>
              </div>
              <div className="flex justify-between text-xl font-black pt-4" style={{ color: config.themeColor }}>
                <span className="uppercase tracking-tighter">TOTAL</span>
                <span>21,060.00</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-12 flex items-end justify-between">
              <div className="text-left">
                {config.showBankDetails && (
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bank Details</p>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Habib Bank Limited (HBL)</p>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">A/C: 1234-5678-9012</p>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{config.footerText}</p>
              </div>
              <div className="text-right">
                {config.showSignature && (
                  <div className="space-y-2">
                    <div className="w-32 border-b border-slate-300"></div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Authorized Signature</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">Print format saved successfully!</span>
        </div>
      )}
    </div>
  );
}

