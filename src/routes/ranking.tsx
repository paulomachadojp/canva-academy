import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Medal, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchMyRanking,
  fetchTopRanking,
  onRankingChange,
  type RankingRow,
} from "@/lib/points";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking — Etek Academy" }] }),
  component: Ranking,
});

function Avatar({ row }: { row: RankingRow }) {
  if (row.avatar) {
    return (
      <img
        src={row.avatar}
        alt={row.name ?? "Aluno"}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-muted-foreground">
      <UserIcon className="h-5 w-5" />
    </div>
  );
}

function RankBadge({ position }: { position: number }) {
  const isPodium = position <= 3;
  return (
    <div
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg font-bold ${
        position === 1
          ? "bg-amber-400/20 text-amber-400"
          : position === 2
          ? "bg-zinc-300/20 text-zinc-300"
          : position === 3
          ? "bg-orange-400/20 text-orange-400"
          : "bg-accent text-muted-foreground"
      }`}
    >
      {isPodium ? <Medal className="h-5 w-5" /> : <span>{position}</span>}
    </div>
  );
}

function Ranking() {
  const [top, setTop] = useState<RankingRow[]>([]);
  const [me, setMe] = useState<RankingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const load = async () => {
    const [list, mine, user] = await Promise.all([
      fetchTopRanking(10),
      fetchMyRanking(),
      supabase.auth.getUser(),
    ]);
    setTop(list);
    setMe(mine);
    setSignedIn(!!user.data.user);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const off = onRankingChange(load);
    const interval = setInterval(load, 30_000);
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      off();
      clearInterval(interval);
      sub.subscription.unsubscribe();
    };
  }, []);

  const meInTop = me && top.some((r) => r.user_id === me.user_id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Ranking</h1>
          <p className="text-muted-foreground">
            Top 10 alunos mais engajados da plataforma.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">Atualiza automaticamente</span>
      </header>

      {me && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
            Minha posição
          </p>
          <div className="flex items-center gap-4">
            <RankBadge position={me.position} />
            <Avatar row={me} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{me.name ?? "Você"}</h3>
              <p className="text-xs text-muted-foreground">
                #{me.position} no ranking geral
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-primary">
              <Trophy className="h-4 w-4" />
              <span className="text-lg font-bold">{me.total_points}</span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
          </div>
        </div>
      )}

      {signedIn === false && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Entre na sua conta para acumular pontos e aparecer no ranking.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando ranking...
          </div>
        ) : top.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Ainda não há pontuações registradas. Conclua aulas para entrar no ranking!
          </div>
        ) : (
          top.map((u) => {
            const isMe = me?.user_id === u.user_id;
            return (
              <div
                key={u.user_id}
                className={`flex items-center gap-4 border-b border-border p-4 last:border-0 ${
                  isMe ? "bg-primary/5" : ""
                }`}
              >
                <RankBadge position={u.position} />
                <Avatar row={u} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">
                    {u.name ?? "Aluno"}
                    {isMe && (
                      <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        Você
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-primary">
                  <Trophy className="h-4 w-4" />
                  <span className="font-bold">{u.total_points}</span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {me && !meInTop && (
        <p className="text-center text-xs text-muted-foreground">
          Continue concluindo aulas para subir no ranking!
        </p>
      )}
    </div>
  );
}
