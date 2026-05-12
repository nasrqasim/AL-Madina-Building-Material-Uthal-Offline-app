import DashboardClientContent from "@/components/dashboard/DashboardClientContent";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <DashboardClientContent userName={session.user.name || "User"} />;
}
