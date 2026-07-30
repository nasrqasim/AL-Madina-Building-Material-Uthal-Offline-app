import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { offlineDB } from "@/lib/dexie";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "almadina-erp-offline-secret-key-2026",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        financialYear: { label: "Financial Year", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const allUsers = await offlineDB.users.toArray();
        const user = allUsers.find((u: any) => 
          u.username === credentials.username.trim() && u.isActive === true
        );
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          financialYear: user.financialYear,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.financialYear = (user as any).financialYear;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.financialYear = token.financialYear;
      }
      return session;
    },
  },
};
