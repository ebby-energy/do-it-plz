import { authMiddleware } from "@clerk/nextjs";

// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware();

export const config = {
  matcher: ["/dashboard/:path*"],
};
