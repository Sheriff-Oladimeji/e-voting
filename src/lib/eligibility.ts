export function isStudentEligibleForElection(
  election: { eligibleFaculties: string[] | null; eligibleDepartments: string[] | null },
  student: { faculty: string | null; department: string | null }
): boolean {
  const facultiesEmpty = !election.eligibleFaculties || election.eligibleFaculties.length === 0;
  const departmentsEmpty = !election.eligibleDepartments || election.eligibleDepartments.length === 0;

  if (facultiesEmpty && departmentsEmpty) {
    return true;
  }

  const facultyMatch = !facultiesEmpty && !!student.faculty && election.eligibleFaculties!.includes(student.faculty);
  const departmentMatch =
    !departmentsEmpty && !!student.department && election.eligibleDepartments!.includes(student.department);

  return facultyMatch || departmentMatch;
}
