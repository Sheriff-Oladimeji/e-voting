import { Resend } from "resend";

type AccountEmailMode = "invite" | "reset";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { error } = await resend.emails.send({
    from: process.env.RESEND_SENDER_EMAIL!,
    to: [to],
    subject,
    html: `<p>${intro}</p><p><a href="${url}">${subject}</a></p>`,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
