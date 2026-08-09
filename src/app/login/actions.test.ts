import { describe, it, expect, vi, afterEach } from "vitest";
import { APIError } from "better-auth";

vi.mock("@/lib/auth", () => ({
  auth: { api: { sendVerificationOTP: vi.fn(), signInEmailOTP: vi.fn() } },
}));
vi.mock("@/db/queries/students", () => ({
  findStudentByMatricAndEmail: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { findStudentByMatricAndEmail } from "@/db/queries/students";
import { requestStudentOtpAction, verifyStudentOtpAction } from "./actions";

afterEach(() => {
  vi.clearAllMocks();
});

describe("requestStudentOtpAction", () => {
  it("rejects without sending an OTP when no student record matches", async () => {
    vi.mocked(findStudentByMatricAndEmail).mockResolvedValue(null as never);

    const result = await requestStudentOtpAction("2022/409799", "amara@example.com");

    expect(result).toEqual({ success: false, error: expect.stringMatching(/no student record/i) });
    expect(auth.api.sendVerificationOTP).not.toHaveBeenCalled();
  });

  it("sends an OTP when the matric number and email match a student record", async () => {
    vi.mocked(findStudentByMatricAndEmail).mockResolvedValue({ id: "1" } as never);
    vi.mocked(auth.api.sendVerificationOTP).mockResolvedValue({ success: true } as never);

    const result = await requestStudentOtpAction("2022/409799", "amara@example.com");

    expect(result).toEqual({ success: true });
    expect(auth.api.sendVerificationOTP).toHaveBeenCalledWith({
      body: { email: "amara@example.com", type: "sign-in" },
    });
  });
});

describe("verifyStudentOtpAction", () => {
  it("returns success when the OTP is correct", async () => {
    vi.mocked(auth.api.signInEmailOTP).mockResolvedValue({ token: "t", user: {} } as never);

    const result = await verifyStudentOtpAction("amara@example.com", "123456");

    expect(result).toEqual({ success: true });
  });

  it("returns a friendly error for an invalid OTP", async () => {
    vi.mocked(auth.api.signInEmailOTP).mockRejectedValue(new APIError("BAD_REQUEST", { message: "Invalid OTP" }));

    const result = await verifyStudentOtpAction("amara@example.com", "000000");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid otp/i);
    }
  });
});
