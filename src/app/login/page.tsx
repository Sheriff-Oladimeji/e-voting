"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signIn } from "./actions";

export default function LoginPage() {
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
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-24 flex max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <label className="flex flex-col gap-1">
        Matric Number
        <input
          className="rounded border px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        Password
        <input
          type="password"
          className="rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
