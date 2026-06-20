import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchTopRanking, type RankingRow } from "@/lib/points";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/ranking")({
  component: AdminRanking,
});

function AdminRanking() {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopRanking(100).then((r) => { setRows(r); setLoading(false); });
  }, []);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2"><Trophy className="h-5 w-5" /> Ranking geral</h2>
      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.user_id}>
            <CardContent className="flex items-center gap-4 p-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {r.position}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{r.name || "Aluno"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{r.total_points}</p>
                <p className="text-xs text-muted-foreground">pontos</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">Nenhum aluno pontuado.</p>}
      </div>
    </div>
  );
}
