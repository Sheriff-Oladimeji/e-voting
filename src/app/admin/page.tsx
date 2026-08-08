import Link from "next/link";
import { Users, Vote } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  {
    href: "/admin/students",
    icon: Users,
    title: "Students",
    description: "Import students by CSV and manage eligibility.",
  },
  {
    href: "/admin/elections",
    icon: Vote,
    title: "Elections",
    description: "Create elections, manage candidates, view results.",
  },
];

export default function AdminHome() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <SignOutButton />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 rounded-lg border border-border p-5 hover:bg-muted/50"
          >
            <Icon className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="font-medium">{title}</span>
            <span className="text-sm text-muted-foreground">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
