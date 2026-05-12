"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050110] text-white selection:bg-purple-500/30 overflow-x-hidden font-sans">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">N</div>
          <span className="text-xl font-bold tracking-tight">Najeeb ERP</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="#" className="hover:text-white transition-colors">Home</Link>
          <Link href="#" className="hover:text-white transition-colors">Features</Link>
          <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-white transition-colors">About</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link 
            href="/login" 
            className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-slate-200 transition-all active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">AI-Powered ERP Solution</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Smarter Business Management <br className="hidden md:block" /> Starts With Powerful AI
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Najeeb ERP combines advanced financial reporting, inventory intelligence, 
            and automated workflows to transform your business operations into a high-performance machine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-[0_0_40px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              Get Started for Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              Explore Features
            </Link>
          </div>

          {/* Product Mockup */}
          <div className="relative group max-w-6xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800/50 border-b border-white/5 flex items-center px-4 gap-1.5 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <Image 
                src="/hero-mockup.png" 
                alt="Najeeb ERP Dashboard Mockup" 
                width={1200}
                height={675}
                priority
                className="w-full h-auto pt-8 scale-[1.01]"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Trust Badges / Stats Section */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-black text-white mb-2">99.9%</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-white mb-2">24/7</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Premium Support</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-white mb-2">10k+</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Users</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-white mb-2">50+</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Module Integrations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded flex items-center justify-center font-bold text-xs text-white">N</div>
            <span className="text-sm font-bold tracking-tight text-white">Najeeb ERP</span>
          </div>
          
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">
            © 2026 Najeeb ERP. All Rights Reserved. Powered by Roonjha Developer.
          </div>

          <div className="flex items-center gap-6 text-slate-500">
            <Link href="#" className="hover:text-white transition-colors"><Zap size={18} /></Link>
            <Link href="#" className="hover:text-white transition-colors"><ShieldCheck size={18} /></Link>
            <Link href="#" className="hover:text-white transition-colors"><BarChart3 size={18} /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
