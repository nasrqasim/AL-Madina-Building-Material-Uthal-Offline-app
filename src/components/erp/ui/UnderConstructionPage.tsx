import { Hammer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ERPPageHeader from "./ERPPageHeader";
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT, COMPANY_TAGLINE, DEFAULT_COMPANY_ADDRESS_LINE, DEFAULT_COMPANY_FORM } from "@/lib/company";

interface UnderConstructionPageProps {
  title: string;
  description: string;
  module: string;
}

export default function UnderConstructionPage({ title, description, module }: UnderConstructionPageProps) {
  return (
    <div className="space-y-6">
      <ERPPageHeader
        title={title}
        description={description}
      />
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-12 text-center relative transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 dark:bg-amber-900/10 rounded-bl-full -z-0 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-maroon-50 dark:bg-maroon-900/10 rounded-tr-full -z-0 opacity-50"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-8 shadow-inner border border-amber-200 dark:border-amber-800">
            <Hammer size={40} className="animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Module Under Development</h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium max-w-lg mb-8">
            The <strong className="text-slate-700 dark:text-slate-200">{title}</strong> module is currently being built and refined to match the premium APP_NAME standards. Check back soon for the complete release.
          </p>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white dark:bg-slate-900 text-white dark:text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10"
            >
              <ArrowLeft size={18} />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
