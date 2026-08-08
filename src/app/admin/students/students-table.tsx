"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Mail, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStudentAction, removeStudentAction, resendInviteAction } from "./actions";

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
  const [invited, setInvited] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students imported yet.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {students.map((s) =>
        editingId === s.id ? (
          <EditRow
            key={s.id}
            student={s}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
          />
        ) : (
          <div key={s.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.username} · {s.email}
                {(s.faculty || s.department) && ` · ${[s.faculty, s.department].filter(Boolean).join(" — ")}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {invited === s.id ? (
                <span className="text-xs text-emerald-700 dark:text-emerald-400">Invite sent</span>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  aria-label="Resend invite"
                  onClick={() =>
                    startTransition(async () => {
                      await resendInviteAction(s.id);
                      setInvited(s.id);
                    })
                  }
                >
                  <Mail className="size-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setEditingId(s.id)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                aria-label="Remove"
                onClick={() => startTransition(() => removeStudentAction(s.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        )
      )}
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

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="grid grid-cols-3 gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="Faculty" />
        <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" />
      </div>
      <div className="flex gap-1 self-end">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label="Save"
          onClick={() =>
            startTransition(async () => {
              await updateStudentAction(student.id, { name, faculty, department });
              onSaved();
            })
          }
        >
          <Check className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Cancel" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
