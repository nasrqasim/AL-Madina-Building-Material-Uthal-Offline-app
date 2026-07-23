"use client";

import DashboardClientContent from "@/components/dashboard/DashboardClientContent";
import { useSession } from "@/components/providers/SessionProvider";

export default function DashboardPage() {
  const { data: session } = useSession();
  
  return (
    <DashboardClientContent 
      userName={session?.user?.name || "User"} 
      userRole={session?.user?.role || "admin"} 
    />
  );
}
