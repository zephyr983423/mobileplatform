import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control
    if (path.startsWith("/admin") && token?.role !== "BOSS") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/staff") && token?.role !== "STAFF" && token?.role !== "BOSS") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/me") && token?.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/me/:path*", "/staff/:path*", "/admin/:path*"],
};
