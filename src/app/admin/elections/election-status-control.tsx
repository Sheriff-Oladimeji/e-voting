"use client";

import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateElectionStatusAction } from "./actions";

const nextStatus = {
  draft: "active",
  active: "closed",
  closed: null,
} as const;

const nextLabel = {
  draft: "Activate",
  active: "Close",
  closed: null,
} as const;

export function ElectionStatusControl({
  electionId,
  status,
}: {
  electionId: string;
  status: "draft" | "active" | "closed";
}) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const next = nextStatus[current];

  if (!next) {
    return <span className="text-sm text-muted-foreground">Closed</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(false);
            try {
              await updateElectionStatusAction(electionId, next);
              setCurrent(next);
            } catch {
              setError(true);
            }
          })
        }
      >
        {pending ? "Updating…" : nextLabel[current]}
      </Button>
      {error && (
        <span title="Couldn't update status — try again" className="text-destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
