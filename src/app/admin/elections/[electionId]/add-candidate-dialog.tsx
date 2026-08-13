"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddCandidateForm } from "./add-candidate-form";

export function AddCandidateDialog({
  electionId,
  positionId,
  positionTitle,
  electionFaculty,
}: {
  electionId: string;
  positionId: string;
  positionTitle: string;
  electionFaculty: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus className="size-4" /> Add candidate
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add candidate</DialogTitle>
          <DialogDescription>Running for {positionTitle}.</DialogDescription>
        </DialogHeader>
        <AddCandidateForm
          electionId={electionId}
          positionId={positionId}
          electionFaculty={electionFaculty}
          onAdded={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
