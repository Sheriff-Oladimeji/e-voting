import Link from "next/link";
import { listStudents } from "@/db/queries/students";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CsvImportForm } from "./csv-import-form";
import { AddSingleStudentForm } from "./add-single-student-form";
import { StudentsTable } from "./students-table";

export default async function StudentsPage() {
  const students = await listStudents();

  return (
    <div className="w-full px-10 py-12">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Students</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add students</CardTitle>
          <CardDescription>Import a CSV for many students at once, or add one directly.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="csv">
            <TabsList>
              <TabsTrigger value="csv">Bulk import (CSV)</TabsTrigger>
              <TabsTrigger value="single">Add one student</TabsTrigger>
            </TabsList>
            <TabsContent value="csv" className="mt-4">
              <p className="mb-4 text-sm text-muted-foreground">
                CSV with columns: <code className="rounded bg-muted px-1 py-0.5">matric_number</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">name</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">email</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">faculty</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">department</code>. Each new student gets an email to
                set their password. Re-uploading the same file skips students who already exist.
              </p>
              <CsvImportForm />
            </TabsContent>
            <TabsContent value="single" className="mt-4">
              <AddSingleStudentForm />
            </TabsContent>
          </Tabs>
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
