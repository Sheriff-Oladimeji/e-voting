import Link from "next/link";
import { notFound } from "next/navigation";
import { getElection } from "@/db/queries/elections";
import { getVoteTallyForElection, getTurnoutForElection } from "@/db/queries/results";
import { Button } from "@/components/ui/button";
import { PrintButton } from "./print-button";

export default async function ElectionResultsPage({
  params,
}: {
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;
  const election = await getElection(electionId);
  if (!election) notFound();

  const [tally, turnout] = await Promise.all([
    getVoteTallyForElection(electionId),
    getTurnoutForElection(electionId),
  ]);

  const positions = Array.from(new Set(tally.map((r) => r.positionId))).map((positionId) => ({
    positionId,
    positionTitle: tally.find((r) => r.positionId === positionId)!.positionTitle,
    candidates: tally
      .filter((r) => r.positionId === positionId)
      .sort((a, b) => b.voteCount - a.voteCount),
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 print:px-0 print:py-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/admin/elections/${electionId}`} className="text-sm text-muted-foreground hover:underline">
          ← {election.title}
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          <Button render={<a href={`/admin/elections/${electionId}/results/export`} />} variant="outline" size="sm">
            Download CSV
          </Button>
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{election.title} — Results</h1>

      <div className="mt-8 flex flex-col gap-8">
        {positions.map((p) => (
          <div key={p.positionId}>
            <h2 className="font-medium">{p.positionTitle}</h2>
            <div className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border">
              {p.candidates.map((c, i) => (
                <div key={c.candidateId} className="flex items-center justify-between gap-4 p-4">
                  <span className="text-sm font-medium">
                    {i === 0 && c.voteCount > 0 && "🏆 "}
                    {c.candidateName}
                  </span>
                  <span className="font-mono text-sm">{c.voteCount} votes</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {turnout && (
        <div className="mt-10">
          <h2 className="font-medium">Turnout</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {turnout.totalVoted} of {turnout.totalEligible} eligible students voted (
            {turnout.totalEligible > 0 ? Math.round((turnout.totalVoted / turnout.totalEligible) * 100) : 0}%)
          </p>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">By faculty</h3>
              <div className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
                {turnout.byFaculty.map((row) => (
                  <div key={row.label} className="flex items-center justify-between p-3 text-sm">
                    <span>{row.label}</span>
                    <span className="font-mono">
                      {row.voted}/{row.eligible}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">By department</h3>
              <div className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
                {turnout.byDepartment.map((row) => (
                  <div key={row.label} className="flex items-center justify-between p-3 text-sm">
                    <span>{row.label}</span>
                    <span className="font-mono">
                      {row.voted}/{row.eligible}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
