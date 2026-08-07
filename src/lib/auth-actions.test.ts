import { describe, it, expect, vi, afterEach } from "vitest";
import { APIError } from "better-auth";

vi.mock("@/lib/auth", () => ({
  auth: { api: { signInUsername: vi.fn() } },
}));

import { auth } from "@/lib/auth";
import { signIn } from "./auth-actions";

afterEach(() => {
  vi.clearAllMocks();
});

describe("signIn action", () => {
  it("returns success and the user's role on valid credentials", async () => {
    vi.mocked(auth.api.signInUsername).mockResolvedValue({ user: { id: "1", role: "admin" } } as never);
    const result = await signIn({ username: "u1", password: "p1" });
    expect(result).toEqual({ success: true, role: "admin" });
  });

  it("returns Better Auth's own message for a known auth error, without retrying", async () => {
    vi.mocked(auth.api.signInUsername).mockRejectedValue(
      new APIError("UNAUTHORIZED", { message: "Invalid username or password" })
    );
    const result = await signIn({ username: "u1", password: "wrong" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid/i);
    }
    expect(auth.api.signInUsername).toHaveBeenCalledTimes(1);
  });

  it("retries once on a transient infra error and succeeds if the retry works", async () => {
    vi.mocked(auth.api.signInUsername)
      .mockRejectedValueOnce(new Error("Connect Timeout Error"))
      .mockResolvedValueOnce({ user: { id: "1", role: "admin" } } as never);
    const result = await signIn({ username: "u1", password: "p1" });
    expect(result).toEqual({ success: true, role: "admin" });
    expect(auth.api.signInUsername).toHaveBeenCalledTimes(2);
  });

  it("hides the raw error and returns a generic message when the retry also fails", async () => {
    vi.mocked(auth.api.signInUsername).mockRejectedValue(
      new Error('Failed query: select "id" from "user" where "user"."username" = $1 params: devroqeeb')
    );
    const result = await signIn({ username: "u1", password: "p1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Something went wrong. Please try again.");
      expect(result.error).not.toMatch(/select|params|user\./i);
    }
    expect(auth.api.signInUsername).toHaveBeenCalledTimes(2);
  });
});
