import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { candidate, position, vote, ballot } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { isStudentEligibleForElection } from "@/lib/eligibility";
import { getElection } from "./elections";

export async function getVoteTallyForElection(electionId: string) {
  const rows = await db
    .select({
      candidateId: candidate.id,
      candidateName: candidate.name,
      positionId: position.id,
      positionTitle: position.title,
      voteCount: sql<string>`count(${vote.id})`,
    })
    .from(candidate)
    .innerJoin(position, eq(candidate.positionId, position.id))
    .leftJoin(vote, eq(vote.candidateId, candidate.id))
    .where(eq(position.electionId, electionId))
    .groupBy(candidate.id, candidate.name, position.id, position.title);

  return rows.map((r) => ({ ...r, voteCount: Number(r.voteCount) }));
}

export async function getTurnoutForElection(electionId: string) {
  const electionRow = await getElection(electionId);
  if (!electionRow) return null;

  const students = await db.select().from(user).where(eq(user.role, "student"));
  const eligibleStudents = students.filter((s) =>
    isStudentEligibleForElection(electionRow, { faculty: s.faculty, department: s.department })
  );

  const votedRows = await db
    .selectDistinct({ studentId: ballot.studentId })
    .from(ballot)
    .where(eq(ballot.electionId, electionId));
  const votedIds = new Set(votedRows.map((r) => r.studentId));

  const byGroup = (key: "faculty" | "department") => {
    const groups = new Map<string, { eligible: number; voted: number }>();
    for (const s of eligibleStudents) {
      const label = (s[key] ?? "").trim() || "Unspecified";
      const entry = groups.get(label) ?? { eligible: 0, voted: 0 };
      entry.eligible++;
      if (votedIds.has(s.id)) entry.voted++;
      groups.set(label, entry);
    }
    return Array.from(groups.entries()).map(([label, counts]) => ({ label, ...counts }));
  };

  return {
    totalEligible: eligibleStudents.length,
    totalVoted: eligibleStudents.filter((s) => votedIds.has(s.id)).length,
    byFaculty: byGroup("faculty"),
    byDepartment: byGroup("department"),
  };
}
