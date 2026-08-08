import Link from "next/link";
import { Users, Vote, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <SignOutButton />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map(({ href, icon: Icon, title, description }) => (
          <Card key={href} className="p-0">
            <Link href={href} className="flex items-start gap-4 p-5 hover:bg-muted/50">
              <Icon className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <div className="flex-1">
                <span className="font-medium">{title}</span>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
