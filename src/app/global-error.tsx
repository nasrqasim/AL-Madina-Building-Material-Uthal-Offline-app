"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-800/50 p-6">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Application Error</h1>
              <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2">A client-side or rendering error occurred.</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-xl overflow-auto border border-red-100">
              <p className="font-mono text-sm text-red-800 break-words font-bold">{error.message}</p>
              {error.stack && (
                <pre className="mt-4 text-xs text-red-600/80 whitespace-pre-wrap font-mono">
                  {error.stack}
                </pre>
              )}
            </div>

            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
