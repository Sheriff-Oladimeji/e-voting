import Link from "next/link";
import { listActiveElections } from "@/db/queries/elections";
import { getSessionUser } from "@/lib/get-session";
import { isStudentEligibleForElection } from "@/lib/eligibility";

export default async function StudentHome() {
  const user = await getSessionUser();
  const student = { faculty: (user as { faculty?: string })?.faculty ?? null, department: (user as { department?: string })?.department ?? null };

  const activeElections = await listActiveElections();
  const eligibleElections = activeElections.filter((e) => isStudentEligibleForElection(e, student));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Your elections</h1>
      <p className="mt-2 text-sm text-muted-foreground">Elections currently open for you to vote in.</p>

      <div className="mt-6 flex flex-col divide-y divide-border rounded-lg border border-border">
        {eligibleElections.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No elections are open for you right now.</p>
        )}
        {eligibleElections.map((e) => (
          <Link
            key={e.id}
            href={`/dashboard/vote/${e.id}`}
            className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"
          >
            <div>
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">Closes {new Date(e.endAt).toLocaleString()}</p>
            </div>
            <span className="text-sm text-emerald-700 dark:text-emerald-400">Vote →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
