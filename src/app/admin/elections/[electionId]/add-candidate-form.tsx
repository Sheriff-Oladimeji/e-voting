"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await addCandidateAction(electionId, { positionId, name, photoUrl, manifesto, faculty, department });
    setPending(false);
    router.refresh();
    onAdded();
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
          <Input id={`faculty-${positionId}`} value={faculty} onChange={(e) => setFaculty(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`department-${positionId}`}>Department</Label>
          <Input id={`department-${positionId}`} value={department} onChange={(e) => setDepartment(e.target.value)} />
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
