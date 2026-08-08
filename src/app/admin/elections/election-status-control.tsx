"use client";

import { useState, useTransition } from "react";
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
  const [pending, startTransition] = useTransition();
  const next = nextStatus[current];

  if (!next) {
    return <span className="text-sm text-muted-foreground">Closed</span>;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await updateElectionStatusAction(electionId, next);
          setCurrent(next);
        })
      }
    >
      {pending ? "Updating…" : nextLabel[current]}
    </Button>
  );
}
