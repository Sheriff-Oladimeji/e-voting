import { describe, it, expect } from "vitest";
import { isStudentEligibleForElection } from "./eligibility";

describe("isStudentEligibleForElection", () => {
  it("is open to everyone when both lists are empty", () => {
    const election = { eligibleFaculties: null, eligibleDepartments: null };
    expect(isStudentEligibleForElection(election, { faculty: "Sciences", department: "Physics" })).toBe(true);
    expect(isStudentEligibleForElection(election, { faculty: null, department: null })).toBe(true);
  });

  it("is eligible when the student's faculty is listed", () => {
    const election = { eligibleFaculties: ["Engineering"], eligibleDepartments: null };
    expect(isStudentEligibleForElection(election, { faculty: "Engineering", department: "Mechanical" })).toBe(true);
  });

  it("is eligible when the student's department is listed, even if faculty isn't", () => {
    const election = { eligibleFaculties: ["Engineering"], eligibleDepartments: ["Physics"] };
    expect(isStudentEligibleForElection(election, { faculty: "Sciences", department: "Physics" })).toBe(true);
  });

  it("is not eligible when neither faculty nor department matches a restricted election", () => {
    const election = { eligibleFaculties: ["Engineering"], eligibleDepartments: ["Physics"] };
    expect(isStudentEligibleForElection(election, { faculty: "Arts", department: "History" })).toBe(false);
  });

  it("is not eligible when the student has no faculty/department but the election is restricted", () => {
    const election = { eligibleFaculties: ["Engineering"], eligibleDepartments: null };
    expect(isStudentEligibleForElection(election, { faculty: null, department: null })).toBe(false);
  });
});
