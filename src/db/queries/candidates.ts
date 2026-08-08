import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidate, position } from "@/db/schema";

export async function listCandidatesForPosition(positionId: string) {
  return db.select().from(candidate).where(eq(candidate.positionId, positionId));
}

export async function listCandidatesForElection(electionId: string) {
  return db
    .select({
      id: candidate.id,
      name: candidate.name,
      photoUrl: candidate.photoUrl,
      manifesto: candidate.manifesto,
      faculty: candidate.faculty,
      department: candidate.department,
      positionId: candidate.positionId,
      positionTitle: position.title,
    })
    .from(candidate)
    .innerJoin(position, eq(candidate.positionId, position.id))
    .where(eq(position.electionId, electionId));
}

export async function addCandidate(input: {
  positionId: string;
  name: string;
  photoUrl?: string;
  manifesto?: string;
  faculty?: string;
  department?: string;
}) {
  const [row] = await db
    .insert(candidate)
    .values({
      positionId: input.positionId,
      name: input.name,
      photoUrl: input.photoUrl || null,
      manifesto: input.manifesto || null,
      faculty: input.faculty || null,
      department: input.department || null,
    })
    .returning();
  return row;
}

export async function removeCandidate(candidateId: string) {
  await db.delete(candidate).where(eq(candidate.id, candidateId));
}
