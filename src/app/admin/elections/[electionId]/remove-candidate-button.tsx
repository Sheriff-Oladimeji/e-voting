"use client";

import { useState, useTransition } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeCandidateAction } from "./actions";

export function RemoveCandidateButton({ electionId, candidateId }: { electionId: string; candidateId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(false);
            try {
              await removeCandidateAction(electionId, candidateId);
            } catch {
              setError(true);
            }
          })
        }
        aria-label="Remove candidate"
      >
        <X className="size-4" />
      </Button>
      {error && (
        <span title="Couldn't remove candidate — try again" className="text-destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
