import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ERPLayout from "@/components/erp/ERPLayout";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <ERPLayout
      user={{
        name: session.user.name!,
        role: session.user.role,
      }}
    >
      {children}
    </ERPLayout>
  );
}
