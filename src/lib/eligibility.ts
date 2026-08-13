export function isStudentEligibleForElection(
  election: { eligibleFaculties: string[] | null; eligibleDepartments: string[] | null },
  student: { faculty: string | null; department: string | null }
): boolean {
  const facultiesEmpty = !election.eligibleFaculties || election.eligibleFaculties.length === 0;
  const departmentsEmpty = !election.eligibleDepartments || election.eligibleDepartments.length === 0;

  // Each constraint only applies if it was actually set — an unset one
  // imposes no restriction, rather than being skipped from an OR. This is
  // what makes "no departments checked" mean the whole faculty (every
  // student in the eligible faculty passes, regardless of department),
  // while checking specific departments genuinely narrows down to them
  // instead of being a no-op — and a student can no longer slip in via a
  // department-name match against an unrelated, non-eligible faculty.
  const facultyOk = facultiesEmpty || (!!student.faculty && election.eligibleFaculties!.includes(student.faculty));
  const departmentOk =
    departmentsEmpty || (!!student.department && election.eligibleDepartments!.includes(student.department));

  return facultyOk && departmentOk;
}
