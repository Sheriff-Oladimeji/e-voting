import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function send(to: string, subject: string, html: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_SENDER_EMAIL!,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

// Admin-only: students no longer have passwords at all (they sign in with an
// email OTP), so this reset flow is only ever reached from /admin/login.
export async function sendAccountEmail({ to, url }: { to: string; url: string }): Promise<void> {
  await send(
    to,
    "Reset your password",
    `<p>Click below to reset your password.</p><p><a href="${url}">Reset your password</a></p>`
  );
}

export async function sendOtpEmail({ to, otp }: { to: string; otp: string }): Promise<void> {
  await send(
    to,
    "Your sign-in code",
    `<p>Your sign-in code is:</p><p style="font-size:24px;font-weight:600;letter-spacing:4px">${otp}</p><p>This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>`
  );
}
