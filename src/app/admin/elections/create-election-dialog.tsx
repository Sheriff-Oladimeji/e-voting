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
import { CreateElectionWizard } from "./create-election-wizard";

export function CreateElectionDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">
            <Plus className="size-4" /> New election
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] w-[70vw] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create election</DialogTitle>
          <DialogDescription>Set the details, positions, eligibility, and candidates step by step.</DialogDescription>
        </DialogHeader>
        <CreateElectionWizard onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
