// src/middleware.ts
import { NextResponse } from "next/server";

export default function middleware(req: any) {
  const { pathname } = req.nextUrl;
  
  // Allow static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/public")) {
    return NextResponse.next();
  }
  
  // Allow auth pages and API auth routes - do NOT import auth here
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Let the page handle auth itself - don't check here to avoid pg import
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};