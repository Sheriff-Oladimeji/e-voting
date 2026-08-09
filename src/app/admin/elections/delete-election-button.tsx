"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { deleteElectionAction } from "./actions";

export function DeleteElectionButton({ electionId, title }: { electionId: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Delete election">
            <Trash2 className="size-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{title}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the election, its positions, candidates, and any votes already cast. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="outline" />}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            render={
              <Button
                disabled={pending}
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() =>
                  startTransition(async () => {
                    setError(null);
                    try {
                      await deleteElectionAction(electionId);
                    } catch {
                      setError("Couldn't delete this election — please try again.");
                    }
                  })
                }
              >
                {pending ? "Deleting…" : "Delete"}
              </Button>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
