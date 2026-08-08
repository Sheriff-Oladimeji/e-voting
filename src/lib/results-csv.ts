function csvEscape(value: string | number): string {
  // Prefix formula-like leading characters so spreadsheet apps (Excel,
  // Sheets) never interpret a cell as a formula — a malicious election/
  // candidate name like "=cmd|'/c calc'!A1" would otherwise execute when
  // an admin opens the exported file.
  const raw = String(value);
  const str = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvLine(cells: (string | number)[]): string {
  return cells.map(csvEscape).join(",");
}

export function buildResultsCsv(input: {
  electionTitle: string;
  tally: { positionTitle: string; candidateName: string; voteCount: number }[];
  turnout: {
    totalEligible: number;
    totalVoted: number;
    byFaculty: { label: string; eligible: number; voted: number }[];
    byDepartment: { label: string; eligible: number; voted: number }[];
  };
}): string {
  const lines: string[] = [];

  lines.push(toCsvLine([`Results — ${input.electionTitle}`]));
  lines.push(toCsvLine(["Position", "Candidate", "Votes"]));
  for (const row of input.tally) {
    lines.push(toCsvLine([row.positionTitle, row.candidateName, row.voteCount]));
  }

  lines.push("");
  lines.push(toCsvLine(["Turnout"]));
  lines.push(toCsvLine(["Total eligible", input.turnout.totalEligible]));
  lines.push(toCsvLine(["Total voted", input.turnout.totalVoted]));

  lines.push("");
  lines.push(toCsvLine(["By faculty", "Eligible", "Voted"]));
  for (const row of input.turnout.byFaculty) {
    lines.push(toCsvLine([row.label, row.eligible, row.voted]));
  }

  lines.push("");
  lines.push(toCsvLine(["By department", "Eligible", "Voted"]));
  for (const row of input.turnout.byDepartment) {
    lines.push(toCsvLine([row.label, row.eligible, row.voted]));
  }

  return lines.join("\n");
}
