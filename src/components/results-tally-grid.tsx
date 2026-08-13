import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TallyRow = { candidateId: string; candidateName: string; voteCount: number };
type PositionTally = { positionId: string; positionTitle: string; candidates: TallyRow[] };

export function ResultsTallyGrid({ positions }: { positions: PositionTally[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {positions.map((p) => {
        const totalVotes = p.candidates.reduce((sum, c) => sum + c.voteCount, 0);
        const maxVotes = p.candidates.reduce((max, c) => Math.max(max, c.voteCount), 0);
        // Ties are common in small elections — mark every candidate at the
        // top vote count as a winner instead of picking one arbitrarily.
        const winnerIds = new Set(maxVotes > 0 ? p.candidates.filter((c) => c.voteCount === maxVotes).map((c) => c.candidateId) : []);
        const isTie = winnerIds.size > 1;

        return (
          <Card key={p.positionId} className="py-0">
            <CardHeader className="flex-row items-center justify-between gap-2 pt-6">
              <CardTitle>{p.positionTitle}</CardTitle>
              {isTie && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Tied for 1st
                </span>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pb-6">
              {p.candidates.length === 0 && <p className="text-sm text-muted-foreground">No candidates ran.</p>}
              {p.candidates.map((c) => {
                const isWinner = winnerIds.has(c.candidateId);
                const share = totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100) : 0;
                return (
                  <div key={c.candidateId} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className={`flex items-center gap-1.5 ${isWinner ? "font-semibold" : "font-medium"}`}>
                        {isWinner && (
                          <Trophy className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        )}
                        {c.candidateName}
                      </span>
                      <span className="shrink-0 font-mono text-muted-foreground">
                        {c.voteCount} {c.voteCount === 1 ? "vote" : "votes"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-[width] ${
                          isWinner ? "bg-emerald-600 dark:bg-emerald-500" : "bg-muted-foreground/30"
                        }`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
