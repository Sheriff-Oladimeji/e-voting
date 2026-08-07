"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn({ username, password });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.role !== "admin") {
      setError("This account isn't an admin account. Use the student sign-in page instead.");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="flex flex-1 flex-col md:grid md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-zinc-950 p-10 text-zinc-50 md:flex">
        <Link href="/" className="text-sm font-medium tracking-tight">
          Student Elections
        </Link>
        <div className="flex flex-col gap-4">
          <LayoutDashboard className="size-8 text-emerald-400" aria-hidden="true" />
          <p className="max-w-xs text-2xl leading-snug font-medium tracking-tight text-balance">
            Manage candidates, elections, and results from one dashboard.
          </p>
        </div>
        <p className="text-xs text-zinc-500">University Electronic Voting System — Admin</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
            <p className="text-sm text-muted-foreground">Use your admin username and password.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-invalid={!!error}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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
            {pending ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Signing in as a student?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
