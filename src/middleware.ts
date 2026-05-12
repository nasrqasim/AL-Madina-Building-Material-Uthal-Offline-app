import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/maintain/:path*",
    "/purchases/:path*",
    "/sales/:path*",
    "/store/:path*",
    "/receipts/:path*",
    "/payments/:path*",
    "/salary/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/ai-studio/:path*",
    "/journal/:path*",
    "/inventory/:path*",
    "/items/:path*",
    "/parties/:path*",
    "/api/((?!auth).*)"
  ],
};
