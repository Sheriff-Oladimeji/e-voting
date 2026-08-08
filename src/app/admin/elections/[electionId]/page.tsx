import Link from "next/link";
import { notFound } from "next/navigation";
import { getElection, listPositionsForElection } from "@/db/queries/elections";
import { listCandidatesForElection } from "@/db/queries/candidates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCandidateDialog } from "./add-candidate-dialog";
import { RemoveCandidateButton } from "./remove-candidate-button";

const statusBadgeClass = {
  draft: "",
  active: "border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  closed: "border-transparent bg-muted text-muted-foreground",
};

export default async function ElectionDetailPage({
  params,
}: {
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;
  const election = await getElection(electionId);
  if (!election) notFound();

  const [positions, candidates] = await Promise.all([
    listPositionsForElection(electionId),
    listCandidatesForElection(electionId),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-12">
      <Link href="/admin/elections" className="text-sm text-muted-foreground hover:underline">
        ← All elections
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{election.title}</h1>
        <Badge variant="outline" className={statusBadgeClass[election.status]}>
          {election.status}
        </Badge>
      </div>
      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {new Date(election.startAt).toLocaleString()} – {new Date(election.endAt).toLocaleString()}
        </span>
        {election.status === "closed" && (
          <Link href={`/admin/elections/${electionId}/results`} className="font-medium text-foreground underline">
            View results
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {positions.map((pos) => {
          const posCandidates = candidates.filter((c) => c.positionId === pos.id);
          return (
            <Card key={pos.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{pos.title}</CardTitle>
                <AddCandidateDialog electionId={electionId} positionId={pos.id} positionTitle={pos.title} />
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border p-0">
                {posCandidates.length === 0 && (
                  <p className="px-6 py-4 text-sm text-muted-foreground">No candidates yet.</p>
                )}
                {posCandidates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      {(c.faculty || c.department) && (
                        <p className="text-xs text-muted-foreground">
                          {[c.faculty, c.department].filter(Boolean).join(" — ")}
                        </p>
                      )}
                    </div>
                    <RemoveCandidateButton electionId={electionId} candidateId={c.id} />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
