"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importStudentsFromCsv } from "./actions";
import type { StudentImportResult } from "@/db/queries/students";

export default function StudentsPage() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<StudentImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setPending(true);
    setResult(null);
    const text = await file.text();
    const outcome = await importStudentsFromCsv(text);
    setResult(outcome);
    setPending(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Import students</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        CSV with columns: <code className="rounded bg-muted px-1 py-0.5">matric_number</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5">name</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5">email</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5">faculty</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5">department</code>. Each new student gets an email to set
        their password. Re-uploading the same file skips students who already exist.
      </p>

      <label className="mt-6 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center hover:bg-muted/50">
        <UploadCloud className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium">{fileName ?? "Choose a CSV file"}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>

      {pending && <p className="mt-4 text-sm text-muted-foreground">Importing…</p>}

      {result && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>
              {result.created} created, {result.skipped} skipped (already existed)
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <span>{result.errors.length} row(s) had problems</span>
              </div>
              <ul className="flex flex-col gap-1 text-sm text-destructive">
                {result.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Button render={<Link href="/admin/elections" />} variant="outline" className="mt-8">
        Go to elections
      </Button>
    </div>
  );
}
