import Link from "next/link";
import { Users, Vote, UserCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/components/sign-out-button";
import { getAdminDashboardStats } from "@/db/queries/dashboard";

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

export default async function AdminHome() {
  const stats = await getAdminDashboardStats();

  const statTiles = [
    { icon: Users, label: "Students", value: stats.totalStudents },
    { icon: Vote, label: "Active elections", value: stats.activeElections },
    { icon: UserCheck, label: "Candidates", value: stats.totalCandidates },
    { icon: CheckCircle2, label: "Votes cast", value: stats.totalVotesCast },
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <SignOutButton />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statTiles.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/10">
                <Icon className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {stats.totalElections} election{stats.totalElections === 1 ? "" : "s"} total — {stats.draftElections} draft,{" "}
        {stats.activeElections} active, {stats.closedElections} closed.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
