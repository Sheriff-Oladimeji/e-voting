import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { election, candidate, ballot } from "@/db/schema";
import { user } from "@/db/auth-schema";

export async function getAdminDashboardStats() {
  const [[{ count: studentCount }], elections, [{ count: candidateCount }], [{ count: ballotCount }]] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(user).where(eq(user.role, "student")),
      db.select().from(election),
      db.select({ count: sql<number>`count(*)` }).from(candidate),
      db.select({ count: sql<number>`count(*)` }).from(ballot),
    ]);

  return {
    totalStudents: Number(studentCount),
    totalElections: elections.length,
    activeElections: elections.filter((e) => e.status === "active").length,
    draftElections: elections.filter((e) => e.status === "draft").length,
    closedElections: elections.filter((e) => e.status === "closed").length,
    totalCandidates: Number(candidateCount),
    totalVotesCast: Number(ballotCount),
  };
}
