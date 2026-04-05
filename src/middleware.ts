// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes
  const publicRoutes = ["/auth/login", "/auth/register", "/auth/error", "/api/auth"];
  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r));

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Role-based access
  const userRole = (req.auth?.user as any)?.role;
  const adminOnlyPaths = ["/dashboard/payroll", "/dashboard/reports"];
  const managerPaths = [...adminOnlyPaths, "/dashboard/employees"];

  if (adminOnlyPaths.some((p) => pathname.startsWith(p)) && !["ADMIN_RH", "MANAGER"].includes(userRole)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
