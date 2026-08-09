"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { parseCsvWithHeader } from "@/lib/csv";
import { importStudentBatchAction } from "./actions";
import type { StudentImportResult } from "@/db/queries/students";

const BATCH_SIZE = 5;

export function CsvImportForm() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<StudentImportResult | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    setFatalError(null);
    const text = await file.text();
    const rows = parseCsvWithHeader(text);

    const combined: StudentImportResult = { created: 0, skipped: 0, errors: [] };
    setProgress({ done: 0, total: rows.length });

    try {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const startRow = i + 2; // +1 for 0-index, +1 for the header row
        const batchResult = await importStudentBatchAction(batch, startRow);
        combined.created += batchResult.created;
        combined.skipped += batchResult.skipped;
        combined.errors.push(...batchResult.errors);
        setProgress({ done: Math.min(i + BATCH_SIZE, rows.length), total: rows.length });
      }
      setResult(combined);
      router.refresh();
    } catch {
      // Rows already imported by earlier batches stay imported — importStudents
      // treats re-imports as skips, so re-uploading the same file is safe.
      setResult(combined);
      setFatalError(
        `Stopped after ${combined.created + combined.skipped} of ${rows.length} rows — please try uploading the file again.`
      );
      router.refresh();
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center hover:bg-muted/50">
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

      {progress && (
        <div className="mt-4 flex flex-col gap-2">
          <Progress value={(progress.done / progress.total) * 100} />
          <p className="text-sm text-muted-foreground">
            Importing {progress.done} of {progress.total}…
          </p>
        </div>
      )}

      {fatalError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{fatalError}</span>
        </div>
      )}

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
    </div>
  );
}
