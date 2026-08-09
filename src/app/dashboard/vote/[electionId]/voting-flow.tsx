"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVotingStore } from "@/lib/stores/voting-store";
import { submitVotesAction } from "./actions";

type Candidate = {
  id: string;
  name: string;
  photoUrl: string | null;
  manifesto: string | null;
  faculty: string | null;
  department: string | null;
  positionId: string;
  positionTitle: string;
};

type Position = { id: string; title: string };

export function VotingFlow({
  electionId,
  positions,
  candidates,
  votedPositionIds,
}: {
  electionId: string;
  positions: Position[];
  candidates: Candidate[];
  votedPositionIds: string[];
}) {
  const router = useRouter();
  const { searchQuery, setSearchQuery, selections, selectCandidate, clearSelections, reset } = useVotingStore();
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<{ referenceCode: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const votedSet = useMemo(() => new Set(votedPositionIds), [votedPositionIds]);
  const unvotedPositions = positions.filter((p) => !votedSet.has(p.id));

  const query = searchQuery.trim().toLowerCase();
  const matches = (c: Candidate) =>
    !query ||
    c.name.toLowerCase().includes(query) ||
    c.faculty?.toLowerCase().includes(query) ||
    c.department?.toLowerCase().includes(query);

  const allSelected = unvotedPositions.every((p) => selections[p.id]);

  async function handleSubmit() {
    setPending(true);
    setErrors([]);
    const positionSelections = Object.fromEntries(
      unvotedPositions.map((p) => [p.id, selections[p.id]]).filter(([, v]) => v)
    );
    const result = await submitVotesAction(electionId, positionSelections);
    setPending(false);
    if (!result.success) {
      setErrors(result.errors);
      if (result.succeededPositionIds.length > 0) {
        // Some positions in this batch committed before the failure — drop
        // them from the local selection and refresh votedPositionIds so a
        // retry doesn't resend them.
        clearSelections(result.succeededPositionIds);
        router.refresh();
      }
      return;
    }
    setConfirmation({ referenceCode: result.referenceCode });
    reset();
    router.refresh();
  }

  if (confirmation) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-10 text-center">
        <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h2 className="text-xl font-semibold">✓ Vote Successfully Submitted</h2>
        <p className="text-sm text-muted-foreground">Your vote has been recorded. Keep this reference code:</p>
        <p className="font-mono text-lg font-medium tracking-wide">{confirmation.referenceCode}</p>
      </div>
    );
  }

  if (unvotedPositions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">
        <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        You&apos;ve already voted in every position for this election.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search candidates by name, faculty, or department"
          className="pl-9"
        />
      </div>

      {unvotedPositions.map((position) => {
        const positionCandidates = candidates.filter((c) => c.positionId === position.id && matches(c));
        return (
          <div key={position.id}>
            <h2 className="font-medium">{position.title}</h2>
            <div className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border">
              {positionCandidates.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No candidates match your search.</p>
              )}
              {positionCandidates.map((c) => {
                const selected = selections[position.id] === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCandidate(position.id, c.id)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {c.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external upload host, no next.config domain to register
                        <img src={c.photoUrl} alt={c.name} className="size-10 shrink-0 rounded-full border border-border object-cover" />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {c.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        {(c.faculty || c.department) && (
                          <p className="text-xs text-muted-foreground">
                            {[c.faculty, c.department].filter(Boolean).join(" — ")}
                          </p>
                        )}
                        {c.manifesto && <p className="mt-1 text-xs text-muted-foreground">{c.manifesto}</p>}
                      </div>
                    </div>
                    <span
                      className={
                        selected
                          ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500"
                          : "size-5 shrink-0 rounded-full border border-border"
                      }
                    >
                      {selected && <CheckCircle2 className="size-3.5 text-white" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {errors.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!allSelected || pending}
        className="self-start bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
      >
        {pending ? "Submitting…" : "Submit votes"}
      </Button>
    </div>
  );
}
