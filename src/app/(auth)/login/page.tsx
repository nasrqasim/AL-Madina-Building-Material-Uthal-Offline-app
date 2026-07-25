"use client";

import { COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, COMPANY_ADDRESS, DEFAULT_LOGO } from "@/lib/company";
import { FormEvent, useState } from "react";
import { useAuthActions } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Lock, Eye, EyeOff, ShieldCheck, Sparkles, Building2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn({
      username: username.trim(),
      password: password,
    });
    setLoading(false);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Invalid username or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060913] p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ── Ambient Background Orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-amber-500/15 rounded-full blur-[160px]" />
      </div>

      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* ── Left Company Highlight Panel (Desktop) ── */}
        <div className="md:col-span-5 p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl hidden md:flex flex-col justify-between min-h-[500px] shadow-2xl shadow-black/80">
          <div className="space-y-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-emerald-400" />
              Back to Main Page
            </Link>

            <div className="space-y-3 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-2 shadow-xl shadow-emerald-500/10">
                <Image src={DEFAULT_LOGO} alt={COMPANY_SHORT} width={44} height={44} className="object-contain" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-snug">
                {COMPANY_NAME}
              </h1>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                {COMPANY_TAGLINE}
              </p>
              <p className="text-xs text-slate-400 font-medium leading-relaxed pt-2">
                Enterprise Business ERP System. Manage POS invoices, material stock inventory, customer debt ledgers & payroll.
              </p>
            </div>

            <div className="space-y-2.5 pt-4">
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Instant Dexie Offline Sync</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Logo Thermal Receipt Printing</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Staff Salary & Loan Ledgers</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {COMPANY_ADDRESS}, Pakistan • Roonjha Developer
          </div>
        </div>

        {/* ── Right Login Form Panel ── */}
        <div className="md:col-span-7">
          <form onSubmit={onSubmit} className="w-full rounded-3xl bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/15 relative overflow-hidden">
            
            {/* Subtle Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-teal-500" />

            <div className="md:hidden flex items-center justify-between mb-6">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
              >
                <ArrowLeft size={16} className="text-emerald-400" />
                Home
              </Link>
              <div className="flex items-center gap-2">
                <Image src={DEFAULT_LOGO} alt={COMPANY_SHORT} width={24} height={24} className="object-contain" />
                <span className="text-xs font-black text-white">{COMPANY_SHORT}</span>
              </div>
            </div>

            <div className="mb-8 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sign In</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                  ERP Secure
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">
                Enter your authorized credentials to access the business workspace.
              </p>
            </div>

            <div className="space-y-5">
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Username / Account ID</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input 
                    name="username" 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (e.g. superadmin)" 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 pl-11 pr-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-slate-600" 
                    required 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 pl-11 pr-11 py-3.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-slate-600" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                {error}
              </div>
            )}

            {/* Login Submit Button */}
            <button 
              disabled={loading} 
              type="submit"
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 px-4 py-4 text-xs font-black text-slate-950 hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? "Authenticating..." : "Login to ERP Workspace"}
            </button>


            <div className="mt-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © 2026 {COMPANY_NAME}. All Rights Reserved.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

