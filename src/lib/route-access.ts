import { hasRole } from "./roles";

export type RouteAccessResult = "allow" | "redirect-login" | "forbidden";

export function resolveRouteAccess(
  pathname: string,
  session: { role: string } | null
): RouteAccessResult {
  const isAdminRoute = pathname.startsWith("/admin");
  const isStudentRoute = pathname.startsWith("/dashboard");

  if (!isAdminRoute && !isStudentRoute) {
    return "allow";
  }
  if (!session) {
    return "redirect-login";
  }
  if (isAdminRoute) {
    return hasRole(session, "admin") ? "allow" : "forbidden";
  }
  return hasRole(session, "student") ? "allow" : "forbidden";
}
