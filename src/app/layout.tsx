import "@/app/globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/SessionProvider";
import { APP_NAME } from "@/lib/company";

export const metadata = {
  title: APP_NAME,
  description: `${APP_NAME} — Building Construction Material`,
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
