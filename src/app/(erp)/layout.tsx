"use client";

import { ReactNode, useEffect } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import ERPLayout from "@/components/erp/ERPLayout";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050110] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Application...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect via useEffect
  }

  return (
    <ERPLayout
      user={{
        name: session.user.name,
        role: session.user.role,
      }}
    >
      {children}
    </ERPLayout>
  );
}
