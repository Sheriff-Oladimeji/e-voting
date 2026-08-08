"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth";
import { auth } from "@/lib/auth";

async function attemptSignInUsername(input: { username: string; password: string }) {
  const result = await auth.api.signInUsername({ body: input });
  return (result.user as unknown as { role: string }).role;
}

export async function signIn(input: {
  username: string;
  password: string;
}): Promise<{ success: true; role: string } | { success: false; error: string }> {
  try {
    return { success: true, role: await attemptSignInUsername(input) };
  } catch (err) {
    // Only APIError messages are safe to show verbatim — they're Better Auth's
    // own curated, user-facing strings (e.g. "Invalid username or password").
    // A real APIError (wrong password) shouldn't get a silent retry.
    if (err instanceof APIError) {
      return { success: false, error: err.message };
    }

    // Anything else is likely infra, not the credentials: Neon's free tier
    // suspends its compute when idle, and the first query after a suspend can
    // take longer to wake it than the driver's connect timeout, failing even
    // though the credentials were fine. A near-immediate retry almost always
    // succeeds once the compute is awake.
    try {
      return { success: true, role: await attemptSignInUsername(input) };
    } catch (retryErr) {
      if (retryErr instanceof APIError) {
        return { success: false, error: retryErr.message };
      }
      console.error("Unexpected sign-in error after retry:", retryErr);
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function requestPasswordResetAction(email: string): Promise<void> {
  try {
    await auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" } });
  } catch (err) {
    // Deliberately swallowed: Better Auth already returns the same generic
    // "if this email exists" response whether or not the account is real, to
    // avoid leaking which emails are registered. Do the same here — never
    // surface a distinct error for "email not found" vs. a real failure.
    console.error("requestPasswordReset failed:", err);
  }
}

export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await auth.api.resetPassword({ body: { newPassword, token } });
    return { success: true };
  } catch (err) {
    if (err instanceof APIError) {
      return { success: false, error: err.message };
    }
    console.error("resetPassword failed:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
