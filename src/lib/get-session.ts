import { headers } from "next/headers";
import { auth } from "./auth";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
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
