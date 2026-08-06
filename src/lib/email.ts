type AccountEmailMode = "invite" | "reset";

export async function sendAccountEmail({
  to,
  url,
  mode,
}: {
  to: string;
  url: string;
  mode: AccountEmailMode;
}): Promise<void> {
  const subject = mode === "invite" ? "Set your password" : "Reset your password";
  const intro =
    mode === "invite"
      ? "An account has been created for you. Click below to set your password and get started."
      : "Click below to reset your password.";

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL!, name: "University Elections" },
      to: [{ email: to }],
      subject,
      htmlContent: `<p>${intro}</p><p><a href="${url}">${subject}</a></p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo send failed: ${response.status} ${await response.text()}`);
  }
}
