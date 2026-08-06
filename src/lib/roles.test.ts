import { describe, it, expect } from "vitest";
import { hasRole } from "./roles";

describe("hasRole", () => {
  it("returns true when the user's role matches", () => {
    expect(hasRole({ role: "admin" }, "admin")).toBe(true);
  });

  it("returns false when the user's role doesn't match", () => {
    expect(hasRole({ role: "student" }, "admin")).toBe(false);
  });

  it("returns false when there is no user", () => {
    expect(hasRole(null, "admin")).toBe(false);
  });
});
