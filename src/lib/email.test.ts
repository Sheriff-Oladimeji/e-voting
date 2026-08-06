import { describe, it, expect, vi, afterEach } from "vitest";
import { sendAccountEmail } from "./email";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendAccountEmail", () => {
  it("sends invite copy with the correct Brevo request shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendAccountEmail({ to: "student@example.com", url: "https://app.test/set-password?token=abc", mode: "invite" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subject).toBe("Set your password");
    expect(body.to).toEqual([{ email: "student@example.com" }]);
  });

  it("throws when Brevo responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "bad request" })
    );

    await expect(
      sendAccountEmail({ to: "x@example.com", url: "https://app.test", mode: "reset" })
    ).rejects.toThrow("Brevo send failed");
  });
});
