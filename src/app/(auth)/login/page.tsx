"use client";
import { COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE } from "@/lib/company";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) router.push("/dashboard");
    else setError("Invalid credentials");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050110] p-4 relative overflow-hidden font-sans">
      {/* Background Glows to match landing page */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6 font-bold uppercase tracking-widest group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home Page
        </Link>

        <form onSubmit={onSubmit} className="w-full rounded-3xl bg-slate-900/40 backdrop-blur-2xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transition-all relative">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-purple-500/20">{COMPANY_SHORT.charAt(0)}</div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{COMPANY_SHORT}</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{COMPANY_TAGLINE}</p>
            </div>
          </div>
          
          <p className="mb-10 text-sm font-medium text-slate-400 relative z-10 leading-relaxed">
            Secure access for <span className="text-purple-400 font-bold">{COMPANY_NAME}</span>. <br />
            Enter your credentials to continue to the dashboard.
          </p>
          
          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username / Email</label>
              <input 
                name="username" 
                type="text"
                placeholder="superadmin" 
                className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-white placeholder:text-slate-600" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-white placeholder:text-slate-600" 
                required 
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-bold text-red-400 flex items-center gap-2 relative z-10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          <button 
            disabled={loading} 
            className="mt-10 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-4 text-xs font-black text-white hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest relative z-10"
          >
            {loading ? "Verifying Identity..." : "Login to Dashboard"}
          </button>

          <div className="mt-10 pt-8 border-t border-white/5 text-center relative z-10">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.25em]">
              © 2026 {COMPANY_NAME}. All Rights Reserved.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
