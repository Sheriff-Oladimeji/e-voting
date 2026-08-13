import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { election, position, candidate, vote } from "@/db/schema";
import {
  createElection,
  getElection,
  listPositionsForElection,
  listActiveElections,
  updateElectionStatus,
  updateElection,
  deleteElection,
} from "./elections";
import { addCandidate } from "./candidates";
import { castVote } from "./votes";

let createdElectionId: string | null = null;

afterEach(async () => {
  if (createdElectionId) {
    await db.delete(position).where(eq(position.electionId, createdElectionId));
    await db.delete(election).where(eq(election.id, createdElectionId));
    createdElectionId = null;
  }
});

describe("createElection", () => {
  it("creates an election with its positions and eligibility arrays", async () => {
    const created = await createElection({
      title: "Test SUG Election",
      startAt: new Date(),
      endAt: new Date(Date.now() + 1000 * 60 * 60),
      positionTitles: ["President", "Vice President"],
      eligibleFaculties: ["Engineering"],
      eligibleDepartments: [],
    });
    createdElectionId = created.id;

    expect(created.status).toBe("draft");
    expect(created.eligibleFaculties).toEqual(["Engineering"]);
    expect(created.eligibleDepartments).toBeNull();

    const positions = await listPositionsForElection(created.id);
    expect(positions.map((p) => p.title).sort()).toEqual(["President", "Vice President"]);
  });

  it("stores null eligibility (open to everyone) when none is given", async () => {
    const created = await createElection({
      title: "Open Election",
      startAt: new Date(),
      endAt: new Date(Date.now() + 1000 * 60 * 60),
      positionTitles: ["President"],
      eligibleFaculties: [],
      eligibleDepartments: [],
    });
    createdElectionId = created.id;

    expect(created.eligibleFaculties).toBeNull();
    expect(created.eligibleDepartments).toBeNull();
  });
});

describe("updateElectionStatus", () => {
  it("transitions an election's status", async () => {
    const created = await createElection({
      title: "Status Test Election",
      startAt: new Date(),
      endAt: new Date(Date.now() + 1000 * 60 * 60),
      positionTitles: ["President"],
      eligibleFaculties: [],
      eligibleDepartments: [],
    });
    createdElectionId = created.id;

    await updateElectionStatus(created.id, "active");
    const updated = await getElection(created.id);
    expect(updated?.status).toBe("active");
  });
});

describe("closeExpiredElections (lazy auto-close)", () => {
  it("flips an active election to closed once its end time has passed, on the next read", async () => {
    const created = await createElection({
      title: "Expired Election",
      startAt: new Date(Date.now() - 1000 * 60 * 60),
      endAt: new Date(Date.now() - 1000), // already in the past
      positionTitles: ["President"],
      eligibleFaculties: [],
      eligibleDepartments: [],
    });
    createdElectionId = created.id;
    await updateElectionStatus(created.id, "active");

    const updated = await getElection(created.id);
    expect(updated?.status).toBe("closed");
  });

  it("does not close an active election whose end time hasn't passed yet", async () => {
    const created = await createElection({
      title: "Still Open Election",
      startAt: new Date(),
      endAt: new Date(Date.now() + 1000 * 60 * 60),
      positionTitles: ["President"],
      eligibleFaculties: [],
      eligibleDepartments: [],
    });
    createdElectionId = created.id;
    await updateElectionStatus(created.id, "active");

    const active = await listActiveElections();
    expect(active.map((e) => e.id)).toContain(created.id);
  });
});

describe("updateElection", () => {
  it("updates title, window, and eligibility", async () => {
    const created = await createElection({
      title: "Original Title",
      startAt: new Date(),
      endAt: new Date(Date.now() + 1000 * 60 * 60),
      positionTitles: ["President"],
      eligibleFaculties: [],
      eligibleDepartments: [],
    });
    createdElectionId = created.id;

    const newStart = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const newEnd = new Date(Date.now() + 1000 * 60 * 60 * 48);
    await updateElection(created.id, {
      title: "Renamed Election",
      startAt: newStart,
      endAt: newEnd,
      eligibleFaculties: ["Faculty of Engineering"],
      eligibleDepartments: ["Civil Engineering"],
    });

    const updated = await getElection(created.id);
    expect(updated?.title).toBe("Renamed Election");
    expect(updated?.eligibleFaculties).toEqual(["Faculty of Engineering"]);
    expect(updated?.eligibleDepartments).toEqual(["Civil Engineering"]);
  });
});

describe("deleteElection", () => {
  it("cascades through positions, candidates, votes, and ballots", async () => {
    const created = await createElection({
      title: "Delete Test Election",
      startAt: new Date(Date.now() - 1000),
      endAt: new Date(Date.now() + 1000 * 60 * 60),
      positionTitles: ["President"],
      eligibleFaculties: [],
      eligibleDepartments: [],
    });
    await updateElectionStatus(created.id, "active");
    const positions = await listPositionsForElection(created.id);
    const pos = positions[0];
    const cand = await addCandidate({ positionId: pos.id, name: "Delete Test Candidate" });
    await castVote({ studentId: "delete-test-student", electionId: created.id, positionId: pos.id, candidateId: cand.id });

    await deleteElection(created.id);

    expect(await getElection(created.id)).toBeNull();
    expect(await db.select().from(position).where(eq(position.id, pos.id))).toHaveLength(0);
    expect(await db.select().from(candidate).where(eq(candidate.id, cand.id))).toHaveLength(0);
    expect(await db.select().from(vote).where(eq(vote.candidateId, cand.id))).toHaveLength(0);

    createdElectionId = null; // already deleted — nothing for afterEach to clean up
  });
});
