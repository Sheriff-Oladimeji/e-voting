import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { election, position } from "@/db/schema";
import { createElection, getElection, listPositionsForElection, updateElectionStatus } from "./elections";

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
