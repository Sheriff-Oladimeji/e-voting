"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACULTIES, departmentsForFaculty } from "@/lib/faculties";
import { updateElectionAction } from "./actions";

const ANY_FACULTY = "__any__";

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditElectionForm({
  electionId,
  initial,
  onSaved,
}: {
  electionId: string;
  initial: {
    title: string;
    startAt: Date;
    endAt: Date;
    eligibleFaculties: string[] | null;
    eligibleDepartments: string[] | null;
  };
  onSaved: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [startAt, setStartAt] = useState(toDatetimeLocal(initial.startAt));
  const [endAt, setEndAt] = useState(toDatetimeLocal(initial.endAt));
  const [faculty, setFaculty] = useState(initial.eligibleFaculties?.[0] ?? ANY_FACULTY);
  const [departments, setDepartments] = useState<string[]>(initial.eligibleDepartments ?? []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDepartments = faculty === ANY_FACULTY ? [] : departmentsForFaculty(faculty);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await updateElectionAction(electionId, {
        title,
        startAt,
        endAt,
        eligibleFaculties: faculty === ANY_FACULTY ? [] : [faculty],
        eligibleDepartments: faculty === ANY_FACULTY ? [] : departments,
      });
      router.refresh();
      onSaved();
    } catch {
      setError("Couldn't save changes — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-startAt">Starts</Label>
          <Input
            id="edit-startAt"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-endAt">Ends</Label>
          <Input
            id="edit-endAt"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-faculty">Eligible faculty</Label>
        <Select
          value={faculty}
          onValueChange={(value) => {
            setFaculty(value ?? ANY_FACULTY);
            setDepartments([]);
          }}
        >
          <SelectTrigger id="edit-faculty" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_FACULTY}>All faculties</SelectItem>
            {FACULTIES.map((f) => (
              <SelectItem key={f.name} value={f.name}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {faculty !== ANY_FACULTY && (
        <div className="flex flex-col gap-2">
          <Label>
            Eligible departments{" "}
            <span className="font-normal text-muted-foreground">(none checked = whole faculty)</span>
          </Label>
          <ScrollArea className="h-32 rounded-lg border border-input">
            <div className="flex flex-col gap-2 p-3">
              {availableDepartments.map((dept) => (
                <label key={dept} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={departments.includes(dept)}
                    onCheckedChange={(checked) =>
                      setDepartments((prev) => (checked ? [...prev, dept] : prev.filter((d) => d !== dept)))
                    }
                  />
                  {dept}
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="self-start bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
      >
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
