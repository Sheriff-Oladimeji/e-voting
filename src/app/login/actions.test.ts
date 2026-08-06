import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: { api: { signInUsername: vi.fn() } },
}));

import { auth } from "@/lib/auth";
import { signIn } from "./actions";

afterEach(() => {
  vi.clearAllMocks();
});

describe("signIn action", () => {
  it("returns success on valid credentials", async () => {
    vi.mocked(auth.api.signInUsername).mockResolvedValue({ user: { id: "1" } } as never);
    const result = await signIn({ username: "u1", password: "p1" });
    expect(result).toEqual({ success: true });
  });

  it("returns a friendly error on invalid credentials", async () => {
    vi.mocked(auth.api.signInUsername).mockRejectedValue(new Error("Invalid username or password"));
    const result = await signIn({ username: "u1", password: "wrong" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid/i);
    }
  });
});
