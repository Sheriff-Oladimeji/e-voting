import Link from "next/link";
import { Vote, CheckCircle2, Clock3, ArrowRight, GraduationCap, Trophy } from "lucide-react";
import { listActiveElections, listClosedElections, listPositionsForElection } from "@/db/queries/elections";
import { listVotedPositionIds } from "@/db/queries/votes";
import { getSessionUser } from "@/lib/get-session";
import { isStudentEligibleForElection } from "@/lib/eligibility";
import { isElectionOpen } from "@/lib/election-window";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SignOutButton } from "@/components/sign-out-button";

export default async function StudentHome() {
  const user = await getSessionUser();
  const student = {
    faculty: (user as { faculty?: string })?.faculty ?? null,
    department: (user as { department?: string })?.department ?? null,
  };
  const username = (user as { username?: string })?.username ?? null;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const activeElections = await listActiveElections();
  const now = new Date();
  const eligibleElections = activeElections
    .filter((e) => isElectionOpen(e, now))
    .filter((e) => isStudentEligibleForElection(e, student));

  const elections = await Promise.all(
    eligibleElections.map(async (e) => {
      const [positions, votedPositionIds] = await Promise.all([
        listPositionsForElection(e.id),
        user ? listVotedPositionIds(user.id, e.id) : Promise.resolve([]),
      ]);
      const totalPositions = positions.length;
      const votedCount = votedPositionIds.length;
      const status: "not-started" | "in-progress" | "complete" =
        votedCount === 0 ? "not-started" : votedCount >= totalPositions ? "complete" : "in-progress";
      return { ...e, totalPositions, votedCount, status };
    })
  );

  const completeCount = elections.filter((e) => e.status === "complete").length;
  const pendingCount = elections.length - completeCount;

  const closedElections = (await listClosedElections())
    .filter((e) => isStudentEligibleForElection(e, student))
    .sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime());

  const statusMeta = {
    "not-started": { label: "Not started", badgeClass: "border-border text-muted-foreground" },
    "in-progress": {
      label: "In progress",
      badgeClass: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    complete: {
      label: "Voted",
      badgeClass: "border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
    },
  } as const;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4" aria-hidden="true" />
            {username && <span>{username}</span>}
            {(student.faculty || student.department) && (
              <>
                <span aria-hidden="true">·</span>
                <span>{[student.department, student.faculty].filter(Boolean).join(", ")}</span>
              </>
            )}
          </div>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { icon: Vote, label: "Open elections", value: elections.length },
          { icon: Clock3, label: "Awaiting your vote", value: pendingCount },
          { icon: CheckCircle2, label: "Completed", value: completeCount },
        ].map(({ icon: Icon, label, value }) => (
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

      <div className="mt-10">
        <h2 className="font-medium">Your elections</h2>
        <p className="mt-1 text-sm text-muted-foreground">Elections currently open for you to vote in.</p>

        {elections.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Vote className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="font-medium">No elections open right now</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Check back once your school opens a new election. You&apos;ll see it here as soon as you&apos;re
                eligible to vote.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {elections.map((e) => {
              const meta = statusMeta[e.status];
              return (
                <Link key={e.id} href={`/dashboard/vote/${e.id}`} className="group block">
                  <Card className="h-full py-0 transition-colors group-hover:border-emerald-600/40">
                    <CardContent className="flex h-full flex-col gap-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{e.title}</p>
                        <Badge variant="outline" className={`shrink-0 ${meta.badgeClass}`}>
                          {meta.label}
                        </Badge>
                      </div>

                      {e.totalPositions > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <Progress
                            value={(e.votedCount / e.totalPositions) * 100}
                            className="[&_[data-slot=progress-indicator]]:bg-emerald-600 dark:[&_[data-slot=progress-indicator]]:bg-emerald-500"
                          />
                          <p className="text-xs text-muted-foreground">
                            {e.votedCount} of {e.totalPositions} position{e.totalPositions === 1 ? "" : "s"} voted
                          </p>
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                        <p className="text-xs text-muted-foreground">Closes {new Date(e.endAt).toLocaleString()}</p>
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          {e.status === "complete" ? "View" : e.status === "in-progress" ? "Continue" : "Vote"}
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {closedElections.length > 0 && (
        <div className="mt-10">
          <h2 className="font-medium">Past elections</h2>
          <p className="mt-1 text-sm text-muted-foreground">Results are published once voting closes.</p>

          <div className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border">
            {closedElections.map((e) => (
              <Link
                key={e.id}
                href={`/dashboard/results/${e.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Trophy className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">Closed {new Date(e.endAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Results
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
