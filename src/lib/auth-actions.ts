"use server";

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
