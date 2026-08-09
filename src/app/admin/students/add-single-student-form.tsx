"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACULTIES, departmentsForFaculty } from "@/lib/faculties";
import { addSingleStudentAction } from "./actions";

export function AddSingleStudentForm() {
  const router = useRouter();
  const [matricNumber, setMatricNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [faculty, setFaculty] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const availableDepartments = faculty ? departmentsForFaculty(faculty) : [];

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const outcome = await addSingleStudentAction({
        matric_number: matricNumber,
        name,
        email,
        faculty: faculty ?? undefined,
        department: department ?? undefined,
      });

      if (outcome.created === 1) {
        setResult({ success: true, message: `${name} was added. They can now sign in with their matric number and email.` });
        setMatricNumber("");
        setName("");
        setEmail("");
        setFaculty(null);
        setDepartment(null);
      } else if (outcome.skipped === 1) {
        setResult({ success: false, message: "A student with that matric number or email already exists." });
      } else {
        setResult({ success: false, message: outcome.errors[0]?.reason ?? "Couldn't add that student." });
      }
      router.refresh();
    } catch {
      setResult({ success: false, message: "Something went wrong — please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="single-matric">Matric number</Label>
          <Input id="single-matric" value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="single-name">Name</Label>
          <Input id="single-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="single-email">Email</Label>
        <Input id="single-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="single-faculty">Faculty</Label>
          <Select
            value={faculty ?? undefined}
            onValueChange={(value) => {
              setFaculty(value);
              setDepartment(null);
            }}
          >
            <SelectTrigger id="single-faculty" className="w-full">
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
          <Label htmlFor="single-department">Department</Label>
          <Select value={department ?? undefined} onValueChange={setDepartment} disabled={!faculty}>
            <SelectTrigger id="single-department" className="w-full">
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

      {result && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            result.success
              ? "border-emerald-600/20 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="self-start bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
      >
        {pending ? "Adding…" : "Add student"}
      </Button>
    </form>
  );
}
