import Link from "next/link";
import { listElections } from "@/db/queries/elections";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { CreateElectionDialog } from "./create-election-dialog";
import { EditElectionDialog } from "./edit-election-dialog";
import { DeleteElectionButton } from "./delete-election-button";
import { ElectionStatusControl } from "./election-status-control";

const statusBadgeClass = {
  draft: "",
  active: "border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  closed: "border-transparent bg-muted text-muted-foreground",
};

export default async function ElectionsPage() {
  const elections = await listElections();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Admin
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Elections</h1>
        <CreateElectionDialog />
      </div>

      <Card className="mt-6 py-0">
        <CardContent className="p-0">
          {elections.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No elections yet — click &quot;New election&quot; to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elections.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link href={`/admin/elections/${e.id}`} className="font-medium hover:underline">
                        {e.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass[e.status]}>
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(e.startAt).toLocaleDateString()} – {new Date(e.endAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ElectionStatusControl electionId={e.id} status={e.status} />
                        <EditElectionDialog
                          electionId={e.id}
                          initial={{
                            title: e.title,
                            startAt: new Date(e.startAt),
                            endAt: new Date(e.endAt),
                            eligibleFaculties: e.eligibleFaculties,
                            eligibleDepartments: e.eligibleDepartments,
                          }}
                        />
                        <DeleteElectionButton electionId={e.id} title={e.title} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
