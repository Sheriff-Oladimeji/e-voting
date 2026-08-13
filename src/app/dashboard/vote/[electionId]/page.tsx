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

  // getElection() lazily flips a past-due election to "closed" on read, so a
  // student who had this vote link open (or clicked an old one) lands on the
  // results page instead of a bare 404 once time runs out.
  if (election.status === "closed") redirect(`/dashboard/results/${electionId}`);

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
    <div className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
        ← Your elections
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{election.title}</h1>
        <p className="text-sm text-muted-foreground">Closes {new Date(election.endAt).toLocaleString()}</p>
      </div>

      <div className="mt-10">
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
