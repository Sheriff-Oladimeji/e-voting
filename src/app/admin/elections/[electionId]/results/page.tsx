import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { getElection } from "@/db/queries/elections";
import { getVoteTallyForElection, getTurnoutForElection } from "@/db/queries/results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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
    <div className="w-full px-10 py-12 print:px-0 print:py-0">
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

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {positions.map((p) => (
          <Card key={p.positionId} className="py-0">
            <CardHeader className="pt-6">
              <CardTitle>{p.positionTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {p.candidates.map((c, i) => (
                    <TableRow key={c.candidateId}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {i === 0 && c.voteCount > 0 && (
                            <Trophy className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          )}
                          {c.candidateName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{c.voteCount} votes</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {turnout && (
        <div className="mt-10">
          <h2 className="font-medium">Turnout</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {turnout.totalVoted} of {turnout.totalEligible} eligible students voted (
            {turnout.totalEligible > 0 ? Math.round((turnout.totalVoted / turnout.totalEligible) * 100) : 0}%)
          </p>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <Card className="py-0">
              <CardHeader className="pt-6">
                <CardTitle className="text-sm text-muted-foreground">By faculty</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {turnout.byFaculty.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right font-mono">
                          {row.voted}/{row.eligible}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardHeader className="pt-6">
                <CardTitle className="text-sm text-muted-foreground">By department</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {turnout.byDepartment.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right font-mono">
                          {row.voted}/{row.eligible}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
