import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveRouteAccess } from "@/lib/route-access";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const decision = resolveRouteAccess(
    request.nextUrl.pathname,
    session?.user ? { role: (session.user as { role: string }).role } : null
  );

  if (decision === "redirect-login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (decision === "forbidden") {
    return NextResponse.redirect(new URL("/403", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
