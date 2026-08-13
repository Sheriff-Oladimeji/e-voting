import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { getElection } from "@/db/queries/elections";
import { getVoteTallyForElection } from "@/db/queries/results";
import { getSessionUser } from "@/lib/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export default async function StudentResultsPage({
  params,
}: {
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const election = await getElection(electionId);
  if (!election) notFound();
  // Results are only published once the election has closed — before that,
  // there's nothing to show a student here.
  if (election.status !== "closed") notFound();

  const tally = await getVoteTallyForElection(electionId);
  const positions = Array.from(new Set(tally.map((r) => r.positionId))).map((positionId) => ({
    positionId,
    positionTitle: tally.find((r) => r.positionId === positionId)!.positionTitle,
    candidates: tally.filter((r) => r.positionId === positionId).sort((a, b) => b.voteCount - a.voteCount),
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 md:py-14">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
        ← Your elections
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{election.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Results — closed {new Date(election.endAt).toLocaleString()}
      </p>

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
                      <TableCell className="py-3 font-medium">
                        <span className="flex items-center gap-2">
                          {i === 0 && c.voteCount > 0 && (
                            <Trophy className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          )}
                          {c.candidateName}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono">{c.voteCount} votes</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {positions.length === 0 && (
        <Card className="mt-8">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No candidates ran in this election.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
