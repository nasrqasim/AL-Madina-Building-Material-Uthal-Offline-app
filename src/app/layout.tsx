import "@/app/globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/SessionProvider";

export const metadata = {
  title: "Oil Shop ERP",
  description: "Oil shop management ERP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* Layout Re-render trigger */}
      <body>

        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
