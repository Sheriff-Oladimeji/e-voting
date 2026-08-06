"use server";

import { auth } from "@/lib/auth";

export async function signIn(input: {
  username: string;
  password: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await auth.api.signInUsername({ body: input });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    return { success: false, error: message };
  }
}
