import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getElection, listPositionsForElection } from "@/db/queries/elections";
import { listCandidatesForElection } from "@/db/queries/candidates";
import { listVotedPositionIds } from "@/db/queries/votes";
import { getSessionUser } from "@/lib/get-session";
import { isStudentEligibleForElection } from "@/lib/eligibility";
import { isElectionOpen } from "@/lib/election-window";
import { VotingFlow } from "./voting-flow";

export default async function VoteElectionPage({
  params,
}: {
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const election = await getElection(electionId);
  if (!election) notFound();

  const student = {
    faculty: (user as { faculty?: string }).faculty ?? null,
    department: (user as { department?: string }).department ?? null,
  };
  if (!isElectionOpen(election, new Date()) || !isStudentEligibleForElection(election, student)) {
    notFound();
  }

  const [positions, candidates, votedPositionIds] = await Promise.all([
    listPositionsForElection(electionId),
    listCandidatesForElection(electionId),
    listVotedPositionIds(user.id, electionId),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
        ← Your elections
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{election.title}</h1>

      <div className="mt-8">
        <VotingFlow
          electionId={electionId}
          positions={positions}
          candidates={candidates}
          votedPositionIds={votedPositionIds}
        />
      </div>
    </div>
  );
}
