import withAuth from "next-auth/middleware";
import type { JWT } from "next-auth/jwt";

export default withAuth(
  function middleware() {}, // or (_req: Request) if you need it later
  {
    callbacks: {
      authorized: ({ token }: { token: JWT | null }) => {
        if (!token) return false;
        return true; // allow access if token exists
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
