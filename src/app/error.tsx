'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={40} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Something went wrong</h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">
            An unexpected error occurred while rendering this page.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-maroon-800 text-white rounded-2xl font-black hover:bg-maroon-700 transition-all active:scale-95"
          >
            <RefreshCcw size={20} />
            Try again
          </button>
          
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
          >
            <Home size={20} />
            Back to Dashboard
          </Link>
        </div>

        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          Error ID: {error.digest || 'Internal Server Error'}
        </p>
      </div>
    </div>
  );
}
