"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestStudentOtpAction, verifyStudentOtpAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"identity" | "otp">("identity");
  const [matricNumber, setMatricNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleRequestOtp(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await requestStudentOtpAction(matricNumber, email);
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await verifyStudentOtpAction(email, otp);
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col md:grid md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-zinc-950 p-10 text-zinc-50 md:flex">
        <Link href="/" className="text-sm font-medium tracking-tight">
          Student Elections
        </Link>
        <div className="flex flex-col gap-4">
          <ShieldCheck className="size-8 text-emerald-400" aria-hidden="true" />
          <p className="max-w-xs text-2xl leading-snug font-medium tracking-tight text-balance">
            One vote per position, enforced by the database — not just the app.
          </p>
        </div>
        <p className="text-xs text-zinc-500">University Electronic Voting System</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        {step === "identity" ? (
          <form onSubmit={handleRequestOtp} className="flex w-full max-w-sm flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Enter your matric number and email — we&apos;ll send a sign-in code, no password needed.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="matricNumber">Matric Number</Label>
              <Input
                id="matricNumber"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                autoComplete="username"
                aria-invalid={!!error}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={!!error}
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="h-10 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {pending ? "Sending code…" : "Send sign-in code"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Signing in as an admin?{" "}
              <Link href="/admin/login" className="font-medium text-foreground underline underline-offset-2">
                Sign in here
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex w-full max-w-sm flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Enter your code</h1>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="otp">Sign-in code</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-invalid={!!error}
                required
                autoFocus
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="h-10 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {pending ? "Verifying…" : "Verify and sign in"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep("identity");
                setOtp("");
                setError(null);
              }}
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:underline"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Use a different matric number or email
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
