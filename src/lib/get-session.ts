import { headers } from "next/headers";
import { auth } from "./auth";

// Neon's free tier suspends its compute when idle, and the first query after
// a suspend can outlast the driver's connect timeout. This is the first DB
// touch of nearly every Server Action in the app (every admin action starts
// with requireAdmin()), so retrying here once — the same pattern already
// used for proxy.ts's session lookup and sign-in — absorbs most cold-start
// failures before they ever reach an action body.
export async function getSessionUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
  } catch {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
  }
}

// Server Actions and Route Handlers are reachable by their own dispatch
// mechanism regardless of which page "hosts" them — the middleware's
// /admin/:path* matcher does not actually gate a Server Action bound to an
// /admin page, since Next.js addresses actions by an internal ID, not the
// request path. Every admin-only action/route must call this itself.
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || (user as { role?: string }).role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return user;
}
