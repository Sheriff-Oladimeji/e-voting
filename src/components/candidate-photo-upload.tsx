"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";

export function CandidatePhotoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { startUpload, isUploading } = useUploadThing("candidatePhoto", {
    onClientUploadComplete: (res) => {
      const uploaded = res?.[0] as { ufsUrl?: string; url?: string } | undefined;
      const url = uploaded?.ufsUrl ?? uploaded?.url;
      if (url) onChange(url);
    },
    onUploadError: (err) => {
      setError(err.message || "Upload failed — please try again.");
    },
  });

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    startUpload([file]);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- external upload host, no next.config domain to register */}
        <img src={value} alt="Candidate" className="size-14 rounded-lg border border-border object-cover" />
        <Button type="button" variant="outline" size="sm" onClick={() => onChange("")}>
          <X className="size-4" /> Remove photo
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50">
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ImagePlus className="size-4" aria-hidden="true" />
        )}
        <span>{isUploading ? "Uploading…" : "Upload photo"}</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isUploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
