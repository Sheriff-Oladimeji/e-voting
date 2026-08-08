import { describe, it, expect } from "vitest";
import { buildResultsCsv } from "./results-csv";

describe("buildResultsCsv", () => {
  it("includes the tally and turnout sections", () => {
    const csv = buildResultsCsv({
      electionTitle: "SUG Election",
      tally: [
        { positionTitle: "President", candidateName: "Amara Chukwu", voteCount: 42 },
        { positionTitle: "President", candidateName: "Tariq Bello", voteCount: 17 },
      ],
      turnout: {
        totalEligible: 100,
        totalVoted: 59,
        byFaculty: [{ label: "Engineering", eligible: 50, voted: 30 }],
        byDepartment: [{ label: "Computer Engineering", eligible: 20, voted: 12 }],
      },
    });

    expect(csv).toContain("Results — SUG Election");
    expect(csv).toContain("President,Amara Chukwu,42");
    expect(csv).toContain("Total eligible,100");
    expect(csv).toContain("Engineering,50,30");
    expect(csv).toContain("Computer Engineering,20,12");
  });

  it("quotes fields containing commas", () => {
    const csv = buildResultsCsv({
      electionTitle: "Election, 2026",
      tally: [{ positionTitle: "President", candidateName: "Doe, Jane", voteCount: 1 }],
      turnout: { totalEligible: 0, totalVoted: 0, byFaculty: [], byDepartment: [] },
    });

    expect(csv).toContain('"Results — Election, 2026"');
    expect(csv).toContain('"Doe, Jane"');
  });

  it("neutralizes formula-like leading characters to prevent CSV/Excel formula injection", () => {
    const csv = buildResultsCsv({
      electionTitle: "SUG Election",
      tally: [{ positionTitle: "President", candidateName: "=cmd|'/c calc'!A1", voteCount: 1 }],
      turnout: { totalEligible: 0, totalVoted: 0, byFaculty: [], byDepartment: [] },
    });

    expect(csv).toContain("President,'=cmd|'/c calc'!A1,1");
    expect(csv).not.toMatch(/,=cmd/);
  });
});
