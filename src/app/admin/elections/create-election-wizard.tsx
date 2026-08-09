"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACULTIES, departmentsForFaculty } from "@/lib/faculties";
import { createElectionAction } from "./actions";

const ANY_FACULTY = "__any__";

const STEPS = ["Details", "Positions", "Eligibility", "Candidates"] as const;

type CandidateDraft = {
  name: string;
  photoUrl: string;
  manifesto: string;
  faculty: string;
  department: string;
};

const EMPTY_DRAFT: CandidateDraft = { name: "", photoUrl: "", manifesto: "", faculty: "", department: "" };

export function CreateElectionWizard({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [positionTitles, setPositionTitles] = useState<string[]>([""]);
  const [faculty, setFaculty] = useState(ANY_FACULTY);
  const [departments, setDepartments] = useState<string[]>([]);
  const [candidatesByPosition, setCandidatesByPosition] = useState<Record<number, CandidateDraft[]>>({});
  const [draftByPosition, setDraftByPosition] = useState<Record<number, CandidateDraft>>({});

  const availableDepartments = faculty === ANY_FACULTY ? [] : departmentsForFaculty(faculty);
  const finalPositions = positionTitles.map((t) => t.trim()).filter(Boolean);

  function draftFor(index: number): CandidateDraft {
    return draftByPosition[index] ?? EMPTY_DRAFT;
  }

  function updateDraft(index: number, patch: Partial<CandidateDraft>) {
    setDraftByPosition((prev) => ({ ...prev, [index]: { ...draftFor(index), ...patch } }));
  }

  function addCandidateDraft(index: number) {
    const d = draftFor(index);
    if (!d.name.trim()) return;
    setCandidatesByPosition((prev) => ({ ...prev, [index]: [...(prev[index] ?? []), d] }));
    setDraftByPosition((prev) => ({ ...prev, [index]: EMPTY_DRAFT }));
  }

  function removeCandidateDraft(index: number, candidateIndex: number) {
    setCandidatesByPosition((prev) => ({
      ...prev,
      [index]: (prev[index] ?? []).filter((_, i) => i !== candidateIndex),
    }));
  }

  function goNext() {
    setStepError(null);
    if (step === 0) {
      if (!title.trim() || !startAt || !endAt) {
        setStepError("Fill in the title and both dates.");
        return;
      }
      if (new Date(endAt) <= new Date(startAt)) {
        setStepError("The end date must be after the start date.");
        return;
      }
    }
    if (step === 1 && finalPositions.length === 0) {
      setStepError("Add at least one position.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleCreate() {
    setPending(true);
    setStepError(null);
    try {
      await createElectionAction({
        title,
        startAt,
        endAt,
        positionTitles: finalPositions,
        eligibleFaculties: faculty === ANY_FACULTY ? [] : [faculty],
        eligibleDepartments: faculty === ANY_FACULTY ? [] : departments,
        positionCandidates: finalPositions.map((_, i) => candidatesByPosition[i] ?? []),
      });
      router.refresh();
      onCreated();
    } catch {
      setStepError("Couldn't create the election — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={
                  i < step
                    ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white dark:bg-emerald-500"
                    : i === step
                      ? "flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 text-xs font-medium text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
                      : "flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground"
                }
              >
                {i < step ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className={i === step ? "text-sm font-medium whitespace-nowrap" : "text-sm whitespace-nowrap text-muted-foreground"}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="mx-3 h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
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
        </div>
      )}

      {step === 1 && (
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
                autoFocus={i === 0}
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
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
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
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            Add candidates now, or skip this and add them later from the election page.
          </p>
          {finalPositions.map((posTitle, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <p className="font-medium">{posTitle}</p>

              {(candidatesByPosition[i] ?? []).length > 0 && (
                <div className="flex flex-col divide-y divide-border rounded-md border border-border">
                  {(candidatesByPosition[i] ?? []).map((c, ci) => (
                    <div key={ci} className="flex items-center justify-between gap-4 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        {(c.faculty || c.department) && (
                          <p className="text-xs text-muted-foreground">
                            {[c.faculty, c.department].filter(Boolean).join(" — ")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove candidate"
                        onClick={() => removeCandidateDraft(i, ci)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Candidate name"
                  value={draftFor(i).name}
                  onChange={(e) => updateDraft(i, { name: e.target.value })}
                />
                <Input
                  placeholder="Faculty (optional)"
                  value={draftFor(i).faculty}
                  onChange={(e) => updateDraft(i, { faculty: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Department (optional)"
                  value={draftFor(i).department}
                  onChange={(e) => updateDraft(i, { department: e.target.value })}
                />
                <Input
                  placeholder="Photo URL (optional)"
                  value={draftFor(i).photoUrl}
                  onChange={(e) => updateDraft(i, { photoUrl: e.target.value })}
                />
              </div>
              <Textarea
                placeholder="Manifesto (optional)"
                rows={2}
                value={draftFor(i).manifesto}
                onChange={(e) => updateDraft(i, { manifesto: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => addCandidateDraft(i)}
                disabled={!draftFor(i).name.trim()}
              >
                <Plus className="size-4" /> Add candidate
              </Button>
            </div>
          ))}
        </div>
      )}

      {stepError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{stepError}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || pending}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={goNext}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleCreate}
            disabled={pending}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            {pending ? "Creating…" : "Create election"}
          </Button>
        )}
      </div>
    </div>
  );
}
