import { createFileRoute } from "@tanstack/react-router";
import { PlayCircle, CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/curso-canva")({
  head: () => ({ meta: [{ title: "Curso Canva — Etek Academy" }] }),
  component: CursoCanva,
});

const modules = [
  { title: "Introdução ao Canva", lessons: 5, status: "done" as const },
  { title: "Ferramentas Essenciais", lessons: 8, status: "current" as const },
  { title: "Tipografia e Cores", lessons: 6, status: "locked" as const },
  { title: "Projetos Práticos", lessons: 10, status: "locked" as const },
];

function CursoCanva() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-video bg-gradient-to-br from-primary/30 via-accent to-card grid place-items-center">
          <PlayCircle className="h-20 w-20 text-primary" />
        </div>
        <div className="space-y-3 p-6 md:p-8">
          <h1 className="text-2xl font-bold md:text-3xl">Curso Completo de Canva</h1>
          <p className="text-muted-foreground">Aprenda a criar designs profissionais do zero ao avançado.</p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>29 aulas</span><span>•</span><span>4h 32min</span><span>•</span><span>Certificado incluso</span>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Módulos</h2>
        <div className="space-y-2">
          {modules.map((m, i) => (
            <div key={m.title} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/50">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent">
                {m.status === "done" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {m.status === "current" && <PlayCircle className="h-5 w-5 text-primary" />}
                {m.status === "locked" && <Lock className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">Módulo {i + 1}: {m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.lessons} aulas</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
