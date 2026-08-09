"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { updateStudentAction, removeStudentAction } from "./actions";

type Student = {
  id: string;
  username: string | null;
  name: string;
  email: string;
  faculty: string | null;
  department: string | null;
};

export function StudentsTable({ students }: { students: Student[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  if (students.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No students imported yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {removeError && (
        <div
          role="alert"
          className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{removeError}</span>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20%]">Name</TableHead>
            <TableHead className="w-[15%] whitespace-nowrap">Matric number</TableHead>
            <TableHead className="w-[25%]">Email</TableHead>
            <TableHead className="w-[25%] whitespace-nowrap">Faculty / Department</TableHead>
            <TableHead className="w-[15%] text-right whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) =>
            editingId === s.id ? (
              <EditRow key={s.id} student={s} onCancel={() => setEditingId(null)} onSaved={() => setEditingId(null)} />
            ) : (
              <TableRow key={s.id}>
                <TableCell className="py-4 font-medium">{s.name}</TableCell>
                <TableCell className="py-4 text-muted-foreground">{s.username}</TableCell>
                <TableCell className="py-4 text-muted-foreground">{s.email}</TableCell>
                <TableCell className="py-4 text-muted-foreground">
                  {[s.faculty, s.department].filter(Boolean).join(" — ") || "—"}
                </TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setEditingId(s.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      aria-label="Remove"
                      onClick={() =>
                        startTransition(async () => {
                          setRemoveError(null);
                          try {
                            await removeStudentAction(s.id);
                          } catch {
                            setRemoveError(`Couldn't remove ${s.name} — please try again.`);
                          }
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function EditRow({
  student,
  onCancel,
  onSaved,
}: {
  student: Student;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(student.name);
  const [faculty, setFaculty] = useState(student.faculty ?? "");
  const [department, setDepartment] = useState(student.department ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <TableRow>
      <TableCell>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
      </TableCell>
      <TableCell className="text-muted-foreground">{student.username}</TableCell>
      <TableCell className="text-muted-foreground">{student.email}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="Faculty" className="h-8" />
          <Input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department"
            className="h-8"
          />
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label="Save"
            onClick={() =>
              startTransition(async () => {
                setError(null);
                try {
                  await updateStudentAction(student.id, { name, faculty, department });
                  onSaved();
                } catch {
                  setError("Couldn't save — please try again.");
                }
              })
            }
          >
            <Check className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Cancel" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
