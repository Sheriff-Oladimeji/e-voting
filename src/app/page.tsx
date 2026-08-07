import Link from "next/link";
import { ShieldCheck, CheckCircle2, LayoutDashboard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const reasons = [
  {
    icon: ShieldCheck,
    title: "One vote per position",
    description: "Enforced by a database constraint, not just app logic — no double-counted or duplicate votes.",
  },
  {
    icon: CheckCircle2,
    title: "Instant confirmation",
    description: "Every vote returns an explicit confirmation and reference code the moment it's cast.",
  },
  {
    icon: LayoutDashboard,
    title: "One dashboard for admins",
    description: "Candidates, elections, and results are managed from a single place — no spreadsheets.",
  },
];

const candidates = [
  { name: "Amara Chukwu", selected: true },
  { name: "Tariq Bello", selected: false },
  { name: "Ifeoma Obi", selected: false },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-sm font-medium tracking-tight">Student Elections</span>
        <div className="flex items-center gap-4">
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground">
            Admin sign in
          </Link>
          <Button render={<Link href="/login" />} variant="outline" size="sm">
            Sign in
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-16 px-6 py-12 md:grid-cols-2 md:py-20">
        <div className="flex flex-col gap-6">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            University Electronic Voting System
          </span>
          <h1 className="max-w-md text-5xl leading-[1.05] font-semibold tracking-tighter text-balance md:text-6xl">
            Vote securely. See it confirmed instantly.
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            The official platform for university student elections — cast your vote in seconds, or manage an
            election from one dashboard.
          </p>
          <div>
            <Button render={<Link href="/login" />} size="lg" className="h-11 bg-emerald-600 px-8 text-base text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">
              Sign in
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Student Union President</p>
            <div className="mt-4 flex flex-col divide-y divide-border">
              {candidates.map(({ name, selected }) => (
                <div key={name} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">{name}</span>
                  <span
                    className={
                      selected
                        ? "flex size-5 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500"
                        : "size-5 rounded-full border border-border"
                    }
                  >
                    {selected && <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden="true" />}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.2)] sm:-left-8">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-medium">Vote recorded — Ref #A82F19</span>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:py-20">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-balance">Built for how elections actually work</h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Every rule below is enforced by the system, not left to trust.
            </p>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {reasons.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4 py-6 first:pt-0">
                <Icon className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
