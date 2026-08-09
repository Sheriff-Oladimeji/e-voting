import { describe, it, expect, vi, afterEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: sendMock } };
  }),
}));

import { sendAccountEmail, sendOtpEmail } from "./email";

afterEach(() => {
  vi.clearAllMocks();
});

describe("sendAccountEmail", () => {
  it("sends the reset-password link with the correct Resend request shape", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });

    await sendAccountEmail({ to: "admin@example.com", url: "https://app.test/reset-password?token=abc" });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["admin@example.com"],
        subject: "Reset your password",
      })
    );
  });

  it("throws when Resend returns an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "bad request" } });

    await expect(sendAccountEmail({ to: "x@example.com", url: "https://app.test" })).rejects.toThrow(
      "Resend send failed"
    );
  });
});

describe("sendOtpEmail", () => {
  it("sends the OTP code with the correct Resend request shape", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });

    await sendOtpEmail({ to: "student@example.com", otp: "123456" });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["student@example.com"],
        subject: "Your sign-in code",
      })
    );
    const call = sendMock.mock.calls[0][0];
    expect(call.html).toContain("123456");
  });

  it("throws when Resend returns an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "bad request" } });

    await expect(sendOtpEmail({ to: "x@example.com", otp: "000000" })).rejects.toThrow("Resend send failed");
  });
});
