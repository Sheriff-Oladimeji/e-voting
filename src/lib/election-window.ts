export function isElectionOpen(
  election: { status: string; startAt: Date; endAt: Date },
  now: Date
): boolean {
  return election.status === "active" && now >= election.startAt && now <= election.endAt;
}
