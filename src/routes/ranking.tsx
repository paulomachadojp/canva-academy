import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Medal } from "lucide-react";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking — Etek Academy" }] }),
  component: Ranking,
});

const top = [
  { name: "Ana Souza", points: 1240 },
  { name: "Carlos Lima", points: 1180 },
  { name: "Você", points: 980 },
  { name: "Mariana Alves", points: 920 },
  { name: "João Pedro", points: 870 },
];

function Ranking() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Ranking</h1>
        <p className="text-muted-foreground">Veja os alunos mais engajados da plataforma.</p>
      </header>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {top.map((u, i) => (
          <div key={u.name} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
              {i < 3 ? <Medal className="h-5 w-5" /> : <span>{i + 1}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{u.name}</h3>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-primary">
              <Trophy className="h-4 w-4" />
              <span className="font-bold">{u.points}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
