"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeCandidateAction } from "./actions";

export function RemoveCandidateButton({ electionId, candidateId }: { electionId: string; candidateId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() => startTransition(() => removeCandidateAction(electionId, candidateId))}
      aria-label="Remove candidate"
    >
      <X className="size-4" />
    </Button>
  );
}
