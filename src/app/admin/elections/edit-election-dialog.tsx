"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditElectionForm } from "./edit-election-form";

export function EditElectionDialog({
  electionId,
  initial,
}: {
  electionId: string;
  initial: {
    title: string;
    startAt: Date;
    endAt: Date;
    eligibleFaculties: string[] | null;
    eligibleDepartments: string[] | null;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Edit election">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] w-[70vw] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit election</DialogTitle>
          <DialogDescription>Positions are managed from the election page, not here.</DialogDescription>
        </DialogHeader>
        <EditElectionForm electionId={electionId} initial={initial} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
