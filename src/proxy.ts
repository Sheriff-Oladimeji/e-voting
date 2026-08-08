import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveRouteAccess } from "@/lib/route-access";

// Neon's free tier suspends its compute when idle, and the first query after
// a suspend can take longer to wake it than the driver's connect timeout.
// Without a retry, that would either 500 this request or (worse) look like
// "no session" and bounce an actually-logged-in user back to login.
async function getSessionWithRetry(headers: Headers) {
  try {
    return await auth.api.getSession({ headers });
  } catch {
    try {
      return await auth.api.getSession({ headers });
    } catch (err) {
      console.error("Session lookup failed after retry:", err);
      return null;
    }
  }
}

export async function proxy(request: NextRequest) {
  const session = await getSessionWithRetry(request.headers);
  const decision = resolveRouteAccess(
    request.nextUrl.pathname,
    session?.user ? { role: (session.user as { role: string }).role } : null
  );

  if (decision === "redirect-login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (decision === "redirect-admin-login") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (decision === "forbidden") {
    return NextResponse.redirect(new URL("/403", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
