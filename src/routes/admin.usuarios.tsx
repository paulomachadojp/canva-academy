import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsuarios,
});

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  completed: number;
};

function AdminUsuarios() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: profiles, error: pErr }, { count }, { data: progress, error: prErr }] = await Promise.all([
        supabase.from("profiles").select("id,name,email,avatar").order("name"),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("lesson_progress").select("user_id,completed").eq("completed", true),
      ]);
      if (pErr) toast.error(pErr.message);
      if (prErr) toast.error(prErr.message);
      const counts = new Map<string, number>();
      (progress ?? []).forEach((p: { user_id: string }) => counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1));
      setRows((profiles ?? []).map((p) => ({ ...p, completed: counts.get(p.id) ?? 0 })));
      setTotalLessons(count ?? 0);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Usuários e progresso</h2>
      <div className="grid gap-3">
        {rows.map((u) => {
          const pct = totalLessons ? Math.round((u.completed / totalLessons) * 100) : 0;
          return (
            <Card key={u.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-semibold">
                  {u.avatar ? <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : (u.name?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{u.name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="w-64 max-w-[40%]">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{u.completed} / {totalLessons} aulas</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 && <p className="text-muted-foreground">Nenhum usuário.</p>}
      </div>
    </div>
  );
}
