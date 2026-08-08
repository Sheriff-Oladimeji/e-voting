"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/lib/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await requestPasswordResetAction(email);
    setPending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <MailCheck className="size-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for {email}, we&apos;ve sent a link to reset the password.
        </p>
        <Link href="/login" className="text-sm font-medium underline underline-offset-2">
          Back to sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground">Enter the email on your account and we&apos;ll send a reset link.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="h-10 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {pending ? "Sending…" : "Send reset link"}
        </Button>

        <Link href="/login" className="text-center text-sm text-muted-foreground hover:underline">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
