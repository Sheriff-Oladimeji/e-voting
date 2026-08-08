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
import { CreateElectionForm } from "./create-election-form";

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create election</DialogTitle>
          <DialogDescription>Set the title, window, positions, and who&apos;s eligible to vote.</DialogDescription>
        </DialogHeader>
        <CreateElectionForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
