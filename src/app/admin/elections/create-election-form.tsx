"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACULTIES, departmentsForFaculty } from "@/lib/faculties";
import { createElectionAction } from "./actions";

const ANY_FACULTY = "__any__";

export function CreateElectionForm({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [positionTitles, setPositionTitles] = useState<string[]>([""]);
  const [faculty, setFaculty] = useState(ANY_FACULTY);
  const [departments, setDepartments] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const availableDepartments = faculty === ANY_FACULTY ? [] : departmentsForFaculty(faculty);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await createElectionAction({
      title,
      startAt,
      endAt,
      positionTitles,
      eligibleFaculties: faculty === ANY_FACULTY ? [] : [faculty],
      eligibleDepartments: faculty === ANY_FACULTY ? [] : departments,
    });
    setPending(false);
    router.refresh();
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startAt">Starts</Label>
          <Input
            id="startAt"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endAt">Ends</Label>
          <Input id="endAt" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Positions</Label>
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
        <Label htmlFor="faculty">Eligible faculty</Label>
        <Select
          value={faculty}
          onValueChange={(value) => {
            setFaculty(value ?? ANY_FACULTY);
            setDepartments([]);
          }}
        >
          <SelectTrigger id="faculty" className="w-full">
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
