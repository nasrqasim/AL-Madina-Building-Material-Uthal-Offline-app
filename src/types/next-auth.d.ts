import { DefaultSession } from "next-auth";
import { UserRole } from "./erp";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      financialYear: string;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    financialYear: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    financialYear: string;
  }
}
