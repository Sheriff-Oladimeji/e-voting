// Better Auth's emailOTP plugin calls its sendVerificationOTP callback through
// runInBackgroundOrAwait, which logs any error the callback throws but never
// lets it propagate back to auth.api.sendVerificationOTP() — so a failed send
// (bad email provider, network blip) would otherwise look identical to a
// successful one to the caller, stranding the student on a code-entry screen
// that will never receive a code. Since the callback (in auth.ts) and the
// caller (src/app/login/actions.ts) run in the same request's synchronous
// await chain, a short-lived, email-keyed record is enough to bridge the gap.
const failures = new Map<string, string>();

export function recordOtpEmailFailure(email: string, message: string) {
  failures.set(email, message);
  setTimeout(() => failures.delete(email), 15_000).unref?.();
}

export function takeOtpEmailFailure(email: string): string | null {
  const message = failures.get(email);
  if (message) failures.delete(email);
  return message ?? null;
}
