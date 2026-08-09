import { NextResponse } from "next/server";
import { getElection } from "@/db/queries/elections";
import { getVoteTallyForElection, getTurnoutForElection } from "@/db/queries/results";
import { buildResultsCsv } from "@/lib/results-csv";
import { requireAdmin } from "@/lib/get-session";

export async function GET(_request: Request, { params }: { params: Promise<{ electionId: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { electionId } = await params;
  const election = await getElection(electionId);
  if (!election) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (election.status !== "closed") {
    return NextResponse.json({ error: "Results aren't exportable until the election is closed" }, { status: 409 });
  }

  const [tally, turnout] = await Promise.all([
    getVoteTallyForElection(electionId),
    getTurnoutForElection(electionId),
  ]);

  const csv = buildResultsCsv({
    electionTitle: election.title,
    tally,
    turnout: turnout ?? { totalEligible: 0, totalVoted: 0, byFaculty: [], byDepartment: [] },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${election.title.replace(/[^a-z0-9]+/gi, "-")}-results.csv"`,
    },
  });
}
