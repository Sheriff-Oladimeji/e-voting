"use server";

import { auth } from "@/lib/auth";

export async function signIn(input: {
  username: string;
  password: string;
}): Promise<{ success: true; role: string } | { success: false; error: string }> {
  try {
    const result = await auth.api.signInUsername({ body: input });
    const role = (result.user as unknown as { role: string }).role;
    return { success: true, role };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    return { success: false, error: message };
  }
}
