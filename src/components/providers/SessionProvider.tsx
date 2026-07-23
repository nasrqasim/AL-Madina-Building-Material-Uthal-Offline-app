"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import { offlineDB, seedOfflineDatabase } from "@/lib/dexie";
import { setupMockApi } from "@/lib/offline/mockApi";
import { UserRole } from "@/lib/offline/types";

interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  financialYear: string;
}

interface SessionData {
  user?: SessionUser;
  expires?: string;
}

interface AuthContextType {
  session: SessionData | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (credentials: { username?: string; password?: string }) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const router = useRouter();

  useEffect(() => {
    async function initAuth() {
      // Setup Mock API fetch interceptor
      setupMockApi();

      // Ensure database is seeded on app startup
      await seedOfflineDatabase();

      const stored = localStorage.getItem("erp_session");
      if (stored) {
        try {
          const user = JSON.parse(stored) as SessionUser;
          setSession({ user });
          setStatus("authenticated");
        } catch (e) {
          localStorage.removeItem("erp_session");
          setSession(null);
          setStatus("unauthenticated");
        }
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    }
    initAuth();
  }, []);

  const signIn = async (credentials: { username?: string; password?: string }) => {
    if (!credentials?.username || !credentials?.password) {
      return { ok: false, error: "Please enter username and password" };
    }

    try {
      // Find user in Dexie
      const usernameLower = credentials.username.trim().toLowerCase();
      const user = await offlineDB.users.where("username").equalsIgnoreCase(usernameLower).first();
      
      if (!user) {
        return { ok: false, error: "Invalid username or password" };
      }

      if (!user.isActive) {
        return { ok: false, error: "User account is suspended" };
      }

      const match = await bcrypt.compare(credentials.password, user.password);
      if (!match) {
        return { ok: false, error: "Invalid username or password" };
      }

      const sessionUser: SessionUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        financialYear: user.financialYear,
      };

      localStorage.setItem("erp_session", JSON.stringify(sessionUser));
      setSession({ user: sessionUser });
      setStatus("authenticated");
      return { ok: true };
    } catch (e) {
      console.error("Sign in error:", e);
      return { ok: false, error: "An unexpected error occurred" };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("erp_session");
    setSession(null);
    setStatus("unauthenticated");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ session, status, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession must be used within an AuthProvider");
  }
  return {
    data: context.session,
    status: context.status,
  };
}

export function useAuthActions() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }
  return {
    signIn: context.signIn,
    signOut: context.signOut,
  };
}
