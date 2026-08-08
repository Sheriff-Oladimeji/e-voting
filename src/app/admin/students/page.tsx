import Link from "next/link";
import { listStudents } from "@/db/queries/students";
import { CsvImportForm } from "./csv-import-form";
import { StudentsTable } from "./students-table";

export default async function StudentsPage() {
  const students = await listStudents();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Students</h1>

      <div className="mt-6">
        <CsvImportForm />
      </div>

      <div className="mt-10">
        <h2 className="font-medium">
          All students <span className="font-normal text-muted-foreground">({students.length})</span>
        </h2>
        <div className="mt-3">
          <StudentsTable students={students} />
        </div>
      </div>
    </div>
  );
}
