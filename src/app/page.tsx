"use client";

import { COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, COMPANY_ADDRESS, DEFAULT_LOGO } from "@/lib/company";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, ShieldCheck, Zap, BarChart3, Layers, ShoppingBag, 
  Users, CreditCard, Receipt, FileText, CheckCircle2, ChevronRight,
  TrendingUp, Sparkles, Building2, Truck, Phone, MapPin, Warehouse
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"sales" | "inventory" | "reports">("sales");

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden font-sans relative">
      {/* ── Dynamic Ambient Mesh Glows ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] bg-emerald-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] bg-amber-500/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[180px]" />
      </div>

      {/* ── Floating Header ── */}
      <header className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-1 shadow-lg shadow-emerald-500/10">
              <Image 
                src={DEFAULT_LOGO} 
                alt={COMPANY_SHORT} 
                width={36} 
                height={36}
                className="object-contain"
                onError={(e) => {
                  // Fallback icon if image fails
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Building2 className="w-5 h-5 text-emerald-400 absolute" style={{ display: 'none' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">{COMPANY_NAME}</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ERP Live
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{COMPANY_TAGLINE} • {COMPANY_ADDRESS}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-5 py-2.5 text-xs font-black text-slate-300 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all flex items-center gap-2"
            >
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center gap-2"
            >
              Launch ERP <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <main className="relative z-10 pt-16 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-blue-500/10 border border-emerald-500/20 backdrop-blur-md shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-emerald-300 via-amber-300 to-teal-200 bg-clip-text text-transparent">
              Smart Building Material & Hardware Management
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-white">
            Enterprise ERP Built For <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
              Building Construction Material
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Manage POS counter billing, hardware inventory, customer balance ledgers, 
            supplier payables, and staff payroll with instant offline Dexie sync and thermal receipt printing.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-sm rounded-2xl hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-3 group active:scale-95"
            >
              Open Business Dashboard 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <a 
              href="tel:03152914836"
              className="w-full sm:w-auto px-6 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2.5"
            >
              <Phone size={16} className="text-emerald-400" />
              Contact: 03152914836
            </a>
          </div>
        </div>

        {/* ── Key Highlights Cards Ticker ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-xl hover:border-emerald-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">POS Billing</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Instant invoice generation with barcode & thermal printing</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-xl hover:border-amber-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
              <Warehouse size={20} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Stock Control</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Real-time cement, steel & hardware stock tracking</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-xl hover:border-blue-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
              <Receipt size={20} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Party Ledgers</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Complete customer & vendor debt history statements</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-xl hover:border-purple-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Staff Payroll</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Salary payments, loan advances & monthly ledgers</p>
          </div>
        </div>

        {/* ── Interactive Dashboard Mockup Preview ── */}
        <div className="mt-16 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-amber-500/20 to-teal-500/30 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
          <div className="relative bg-slate-900/90 border border-white/15 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl">
            
            {/* Window Top Controls */}
            <div className="px-6 py-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono font-bold text-slate-400">al-madina-erp.workspace // Uthal, Balochistan</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab("sales")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === "sales" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-slate-400 hover:text-white"}`}
                >
                  POS Sales
                </button>
                <button 
                  onClick={() => setActiveTab("inventory")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === "inventory" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-400 hover:text-white"}`}
                >
                  Stock Catalog
                </button>
                <button 
                  onClick={() => setActiveTab("reports")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === "reports" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "text-slate-400 hover:text-white"}`}
                >
                  Financial Reports
                </button>
              </div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-emerald-500/20">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                    <span>TODAY&apos;S CASH BILLING</span>
                    <span className="text-emerald-400 font-extrabold">+18.4%</span>
                  </div>
                  <div className="text-3xl font-black text-white">PKR 285,400</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-2">14 counter invoices created today</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-amber-500/20">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                    <span>CUSTOMER RECEIVABLES</span>
                    <span className="text-amber-400 font-extrabold">Active</span>
                  </div>
                  <div className="text-3xl font-black text-amber-400">PKR 1,420,000</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-2">Tracked across customer ledgers</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-blue-500/20">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                    <span>CASH & BANK BALANCE</span>
                    <span className="text-blue-400 font-extrabold">100% Synced</span>
                  </div>
                  <div className="text-3xl font-black text-blue-400">PKR 984,550</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-2">Cash Hand (1111) & Bank (1110)</div>
                </div>
              </div>

              {/* Mock Table */}
              <div className="rounded-2xl bg-slate-950/40 border border-white/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                    {activeTab === "sales" ? "Recent Construction Sales" : activeTab === "inventory" ? "Material Inventory Items" : "System Ledger Entries"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    Live Dexie Data
                  </span>
                </div>
                <div className="divide-y divide-white/5 font-mono text-xs">
                  <div className="px-6 py-3.5 flex justify-between items-center text-slate-300 font-bold hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400">INV-2026-089</span>
                      <span className="text-slate-400">|</span>
                      <span>Lucky Cement (50kg Bags) x 100</span>
                    </div>
                    <span className="text-emerald-400 font-black">PKR 145,000</span>
                  </div>
                  <div className="px-6 py-3.5 flex justify-between items-center text-slate-300 font-bold hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400">INV-2026-088</span>
                      <span className="text-slate-400">|</span>
                      <span>Deformed Steel Bar 60 Grade x 2 Tons</span>
                    </div>
                    <span className="text-amber-400 font-black">PKR 520,000</span>
                  </div>
                  <div className="px-6 py-3.5 flex justify-between items-center text-slate-300 font-bold hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400">SAL-8924011</span>
                      <span className="text-slate-400">|</span>
                      <span>Staff Salary Payment (Nasrullah Qasim)</span>
                    </div>
                    <span className="text-blue-400 font-black">PKR 5,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Core Modules Section ── */}
        <section className="mt-28 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Designed For High Performance Business
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Everything required to run AL Madina Building Material with zero data loss and lightning speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-white/10 hover:border-emerald-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShoppingBag size={24} />
              </div>
              <h3 className="text-xl font-black text-white">Counter Sales & POS</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Fast POS billing supporting cash sales, credit sales, discounts, vehicle Start KM tracking, and print receipts formatted with company logo and numbers.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Print Receipts with Logo</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Credit & Cash Sale Invoices</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Sale Returns with Re-stocking</li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-white/10 hover:border-amber-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Warehouse size={24} />
              </div>
              <h3 className="text-xl font-black text-white">Building Material Stock</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Categorized inventory management for cement, steel, bricks, gravel, hardware tools, and paints with low-stock alerts and purchase orders.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-400" /> Automatic Category Assignment</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-400" /> Purchase Invoices & Returns</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-400" /> Real-Time Stock Valuation</li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-white/10 hover:border-blue-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-black text-white">Party Ledgers & WhatsApp</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Full customer & vendor balance statements with debit/credit breakdown, instant PDF downloads, and direct WhatsApp invoice sharing.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-400" /> Full Transaction History</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-400" /> Staff Monthly Salary Ledgers</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-400" /> Financial Reports & Cash Book</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-1">
              <Image src={DEFAULT_LOGO} alt={COMPANY_SHORT} width={28} height={28} className="object-contain" />
            </div>
            <div>
              <span className="text-sm font-black text-white">{COMPANY_NAME}</span>
              <p className="text-[10px] font-bold text-slate-500">{COMPANY_ADDRESS}, Pakistan</p>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
            © 2026 {COMPANY_NAME}. All Rights Reserved. <br />
            <span className="text-emerald-400">Developed by Roonjha Developer</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/login" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/10">
              Employee Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

