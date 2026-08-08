import Link from "next/link";
import { listStudents } from "@/db/queries/students";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CsvImportForm } from "./csv-import-form";
import { StudentsTable } from "./students-table";

export default async function StudentsPage() {
  const students = await listStudents();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Students</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Import students</CardTitle>
          <CardDescription>
            CSV with columns: <code className="rounded bg-muted px-1 py-0.5">matric_number</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">name</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">email</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">faculty</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">department</code>. Each new student gets an email to set
            their password. Re-uploading the same file skips students who already exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvImportForm />
        </CardContent>
      </Card>

      <div className="mt-10">
        <h2 className="font-medium">
          All students <span className="font-normal text-muted-foreground">({students.length})</span>
        </h2>
        <Card className="mt-3 py-0">
          <CardContent className="p-0">
            <StudentsTable students={students} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
