import Link from "next/link";
import { listElections } from "@/db/queries/elections";
import { CreateElectionForm } from "./create-election-form";
import { ElectionStatusControl } from "./election-status-control";

const statusStyles = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  closed: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

export default async function ElectionsPage() {
  const elections = await listElections();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Elections</h1>

      <div className="mt-6 flex flex-col divide-y divide-border rounded-lg border border-border">
        {elections.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No elections yet — create one below.</p>
        )}
        {elections.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <Link href={`/admin/elections/${e.id}`} className="font-medium hover:underline">
                {e.title}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`rounded-full px-2 py-0.5 font-medium ${statusStyles[e.status]}`}>{e.status}</span>
                <span>
                  {new Date(e.startAt).toLocaleDateString()} – {new Date(e.endAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <ElectionStatusControl electionId={e.id} status={e.status} />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <CreateElectionForm />
      </div>
    </div>
  );
}
