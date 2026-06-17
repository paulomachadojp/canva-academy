import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, PlayCircle, CheckCircle2, Circle, Clock } from "lucide-react";
import { findModule } from "@/lib/course-data";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/modulo/$moduleId")({
  head: () => ({ meta: [{ title: "Módulo — Etek Academy" }] }),
  loader: ({ params }) => {
    const mod = findModule(params.moduleId);
    if (!mod) throw notFound();
    return { moduleId: mod.id };
  },
  component: ModulePage,
});

function ModulePage() {
  const { moduleId } = Route.useLoaderData();
  const mod = findModule(moduleId)!;
  const { isCompleted, moduleProgress } = useProgress();
  const p = moduleProgress(mod.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao curso
      </Link>

      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[21/6] bg-gradient-to-br from-primary/30 via-accent to-card" />
        <div className="space-y-3 p-6 md:p-8">
          <p className="text-xs text-muted-foreground">Canva do Zero ao Profissional</p>
          <h1 className="text-2xl font-bold md:text-3xl">{mod.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{mod.lessons.length} aulas</span>
            <span>•</span>
            <span>{p.completed} concluídas</span>
            <span>•</span>
            <span className="font-semibold text-primary">{p.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${p.percent}%` }} />
          </div>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="px-1 text-lg font-bold">Aulas</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {mod.lessons.map((l, i) => {
            const done = isCompleted(l.id);
            return (
              <Link
                key={l.id}
                to="/modulo/$moduleId/aula/$lessonId"
                params={{ moduleId: mod.id, lessonId: l.id }}
                className="flex items-center gap-4 border-b border-border p-4 transition last:border-0 hover:bg-accent/40"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent">
                  {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <PlayCircle className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">
                    <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}.</span> {l.title}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {l.duration}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-primary">{done ? "Revisar" : "Assistir"}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
