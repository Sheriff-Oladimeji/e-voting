"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/lib/auth-actions";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    setError(null);
    const result = await resetPasswordAction(token, newPassword);
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <main className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Invalid or expired link</h1>
        <p className="text-sm text-muted-foreground">Request a new password reset link and try again.</p>
        <Link href="/forgot-password" className="text-sm font-medium underline underline-offset-2">
          Request a new link
        </Link>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold">Password updated</h1>
        <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
        <Button onClick={() => router.push("/login")} className="mt-2">
          Go to sign in
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="newPassword" className="text-sm font-medium">
            New password
          </label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!error}
            required
          />
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="h-10 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </main>
  );
}
