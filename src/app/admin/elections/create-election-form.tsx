"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createElectionAction } from "./actions";

export function CreateElectionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [positionTitles, setPositionTitles] = useState<string[]>([""]);
  const [eligibleFaculties, setEligibleFaculties] = useState("");
  const [eligibleDepartments, setEligibleDepartments] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await createElectionAction({
      title,
      startAt,
      endAt,
      positionTitles,
      eligibleFaculties: eligibleFaculties.split(",").map((s) => s.trim()),
      eligibleDepartments: eligibleDepartments.split(",").map((s) => s.trim()),
    });
    setPending(false);
    setTitle("");
    setStartAt("");
    setEndAt("");
    setPositionTitles([""]);
    setEligibleFaculties("");
    setEligibleDepartments("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-border p-6">
      <h2 className="font-medium">Create election</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="startAt" className="text-sm font-medium">
            Starts
          </label>
          <Input
            id="startAt"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="endAt" className="text-sm font-medium">
            Ends
          </label>
          <Input id="endAt" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Positions</span>
        {positionTitles.map((value, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={value}
              onChange={(e) =>
                setPositionTitles((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              placeholder="e.g. President"
              required
            />
            {positionTitles.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPositionTitles((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove position"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setPositionTitles((prev) => [...prev, ""])}
        >
          <Plus className="size-4" /> Add position
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eligibleFaculties" className="text-sm font-medium">
          Eligible faculties <span className="font-normal text-muted-foreground">(comma-separated, blank = everyone)</span>
        </label>
        <Input
          id="eligibleFaculties"
          value={eligibleFaculties}
          onChange={(e) => setEligibleFaculties(e.target.value)}
          placeholder="e.g. Engineering, Sciences"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eligibleDepartments" className="text-sm font-medium">
          Eligible departments <span className="font-normal text-muted-foreground">(comma-separated, blank = everyone)</span>
        </label>
        <Input
          id="eligibleDepartments"
          value={eligibleDepartments}
          onChange={(e) => setEligibleDepartments(e.target.value)}
          placeholder="e.g. Computer Engineering"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="self-start bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
      >
        {pending ? "Creating…" : "Create election"}
      </Button>
    </form>
  );
}
