import { describe, it, expect } from "vitest";
import { isStudentEligibleForElection } from "./eligibility";

describe("isStudentEligibleForElection", () => {
  it("is open to everyone when both lists are empty", () => {
    const election = { eligibleFaculties: null, eligibleDepartments: null };
    expect(isStudentEligibleForElection(election, { faculty: "Sciences", department: "Physics" })).toBe(true);
    expect(isStudentEligibleForElection(election, { faculty: null, department: null })).toBe(true);
  });

  it("admits every student in the eligible faculty when no departments are checked — a candidate's own department never restricts other voters in the same faculty", () => {
    const election = { eligibleFaculties: ["Engineering"], eligibleDepartments: null };
    expect(isStudentEligibleForElection(election, { faculty: "Engineering", department: "Mechanical" })).toBe(true);
    expect(isStudentEligibleForElection(election, { faculty: "Engineering", department: "Civil" })).toBe(true);
  });

  it("narrows to the checked departments (within the eligible faculty) when specific departments are set", () => {
    const election = { eligibleFaculties: ["Engineering"], eligibleDepartments: ["Mechanical"] };
    expect(isStudentEligibleForElection(election, { faculty: "Engineering", department: "Mechanical" })).toBe(true);
    // Same faculty, but not one of the checked departments — must be excluded now that
    // department is a real, narrowing constraint instead of an always-true OR branch.
    expect(isStudentEligibleForElection(election, { faculty: "Engineering", department: "Civil" })).toBe(false);
  });

  it("does not admit a student via a department-name match against a faculty they don't belong to", () => {
    // Regression guard: faculty and department constraints must both hold (AND), not
    // either-or — otherwise a student in an unrelated faculty could slip in just because
    // their department name happens to appear in another faculty's eligible list.
    const election = { eligibleFaculties: ["Engineering"], eligibleDepartments: ["Physics"] };
    expect(isStudentEligibleForElection(election, { faculty: "Sciences", department: "Physics" })).toBe(false);
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
