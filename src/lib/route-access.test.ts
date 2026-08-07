import { describe, it, expect } from "vitest";
import { resolveRouteAccess } from "./route-access";

describe("resolveRouteAccess", () => {
  it("redirects to the admin login when there is no session on an admin route", () => {
    expect(resolveRouteAccess("/admin", null)).toBe("redirect-admin-login");
  });

  it("redirects to the student login when there is no session on a student route", () => {
    expect(resolveRouteAccess("/dashboard", null)).toBe("redirect-login");
  });

  it("allows an admin onto /admin", () => {
    expect(resolveRouteAccess("/admin", { role: "admin" })).toBe("allow");
  });

  it("forbids a student on /admin", () => {
    expect(resolveRouteAccess("/admin", { role: "student" })).toBe("forbidden");
  });

  it("allows a student onto /dashboard", () => {
    expect(resolveRouteAccess("/dashboard", { role: "student" })).toBe("allow");
  });

  it("forbids an admin on /dashboard", () => {
    expect(resolveRouteAccess("/dashboard", { role: "admin" })).toBe("forbidden");
  });

  it("allows unauthenticated access to /admin/login itself", () => {
    expect(resolveRouteAccess("/admin/login", null)).toBe("allow");
  });

  it("allows unauthenticated access to unprotected routes", () => {
    expect(resolveRouteAccess("/login", null)).toBe("allow");
  });
});
