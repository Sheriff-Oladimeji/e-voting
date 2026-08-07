import { describe, it, expect, vi, afterEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: sendMock } };
  }),
}));

import { sendAccountEmail } from "./email";

afterEach(() => {
  vi.clearAllMocks();
});

describe("sendAccountEmail", () => {
  it("sends invite copy with the correct Resend request shape", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });

    await sendAccountEmail({ to: "student@example.com", url: "https://app.test/set-password?token=abc", mode: "invite" });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["student@example.com"],
        subject: "Set your password",
      })
    );
  });

  it("throws when Resend returns an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "bad request" } });

    await expect(
      sendAccountEmail({ to: "x@example.com", url: "https://app.test", mode: "reset" })
    ).rejects.toThrow("Resend send failed");
  });
});
