import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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

        // Dynamic imports to prevent top-level database/model loading in RSC
        const dbConnect = (await import("@/lib/db")).default;
        const { User } = await import("@/models/User");

        await dbConnect();
        const user = await User.findOne({
          username: credentials.username.trim(),
          isActive: true,
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return {
          id: user._id.toString(),
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
