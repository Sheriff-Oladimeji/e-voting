"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACULTIES, departmentsForFaculty } from "@/lib/faculties";
import { addCandidateAction } from "./actions";

export function AddCandidateForm({
  electionId,
  positionId,
  onAdded,
}: {
  electionId: string;
  positionId: string;
  onAdded: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [faculty, setFaculty] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDepartments = faculty ? departmentsForFaculty(faculty) : [];

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await addCandidateAction(electionId, {
        positionId,
        name,
        photoUrl,
        manifesto,
        faculty: faculty ?? "",
        department: department ?? "",
      });
      router.refresh();
      onAdded();
    } catch {
      setError("Couldn't add this candidate — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`name-${positionId}`}>Name</Label>
        <Input id={`name-${positionId}`} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`faculty-${positionId}`}>Faculty</Label>
          <Select
            value={faculty ?? undefined}
            onValueChange={(value) => {
              setFaculty(value);
              setDepartment(null);
            }}
          >
            <SelectTrigger id={`faculty-${positionId}`} className="w-full">
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              {FACULTIES.map((f) => (
                <SelectItem key={f.name} value={f.name}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`department-${positionId}`}>Department</Label>
          <Select value={department ?? undefined} onValueChange={setDepartment} disabled={!faculty}>
            <SelectTrigger id={`department-${positionId}`} className="w-full">
              <SelectValue placeholder={faculty ? "Select department" : "Pick a faculty first"} />
            </SelectTrigger>
            <SelectContent>
              {availableDepartments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`photo-${positionId}`}>Photo URL</Label>
        <Input id={`photo-${positionId}`} value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`manifesto-${positionId}`}>Manifesto</Label>
        <Textarea
          id={`manifesto-${positionId}`}
          value={manifesto}
          onChange={(e) => setManifesto(e.target.value)}
          rows={3}
        />
      </div>
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
        {pending ? "Adding…" : "Add candidate"}
      </Button>
    </form>
  );
}
