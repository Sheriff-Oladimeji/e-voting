import Link from "next/link";
import { notFound } from "next/navigation";
import { getElection, listPositionsForElection } from "@/db/queries/elections";
import { listCandidatesForElection } from "@/db/queries/candidates";
import { AddCandidateForm } from "./add-candidate-form";
import { RemoveCandidateButton } from "./remove-candidate-button";

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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/admin/elections" className="text-sm text-muted-foreground hover:underline">
        ← All elections
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{election.title}</h1>
      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{election.status}</span>
        <span>
          {new Date(election.startAt).toLocaleString()} – {new Date(election.endAt).toLocaleString()}
        </span>
        {election.status === "closed" && (
          <Link href={`/admin/elections/${electionId}/results`} className="font-medium text-foreground underline">
            View results
          </Link>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {positions.map((pos) => {
          const posCandidates = candidates.filter((c) => c.positionId === pos.id);
          return (
            <div key={pos.id}>
              <h2 className="font-medium">{pos.title}</h2>
              <div className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border">
                {posCandidates.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">No candidates yet.</p>
                )}
                {posCandidates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 p-4">
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
              </div>
              <div className="mt-3">
                <AddCandidateForm electionId={electionId} positionId={pos.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
