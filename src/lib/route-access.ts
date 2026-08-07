import { hasRole } from "./roles";

export type RouteAccessResult = "allow" | "redirect-login" | "redirect-admin-login" | "forbidden";

export function resolveRouteAccess(
  pathname: string,
  session: { role: string } | null
): RouteAccessResult {
  if (pathname === "/admin/login") {
    return "allow";
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isStudentRoute = pathname.startsWith("/dashboard");

  if (!isAdminRoute && !isStudentRoute) {
    return "allow";
  }
  if (!session) {
    return isAdminRoute ? "redirect-admin-login" : "redirect-login";
  }
  if (isAdminRoute) {
    return hasRole(session, "admin") ? "allow" : "forbidden";
  }
  return hasRole(session, "student") ? "allow" : "forbidden";
}
