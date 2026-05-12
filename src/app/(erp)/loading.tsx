import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-maroon-700 dark:text-maroon-500 animate-spin" />
      <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
        Loading...
      </p>
    </div>
  );
}
