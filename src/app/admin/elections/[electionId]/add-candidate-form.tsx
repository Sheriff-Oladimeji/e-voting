"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCandidateAction } from "./actions";

export function AddCandidateForm({ electionId, positionId }: { electionId: string; positionId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await addCandidateAction(electionId, { positionId, name, photoUrl, manifesto, faculty, department });
    setPending(false);
    setName("");
    setPhotoUrl("");
    setManifesto("");
    setFaculty("");
    setDepartment("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md bg-muted/50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Candidate name" required />
        <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Photo URL (optional)" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="Faculty (optional)" />
        <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department (optional)" />
      </div>
      <textarea
        value={manifesto}
        onChange={(e) => setManifesto(e.target.value)}
        placeholder="Manifesto (optional)"
        rows={2}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Adding…" : "Add candidate"}
      </Button>
    </form>
  );
}
