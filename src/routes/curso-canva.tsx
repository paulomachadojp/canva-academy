import { createFileRoute } from "@tanstack/react-router";
import { PlayCircle, CheckCircle2, Loader2 } from "lucide-react";
import { usePrimaryCourse, useModules, useCourseLessons } from "@/lib/queries";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/curso-canva")({
  head: () => ({ meta: [{ title: "Curso Canva — Etek Academy" }] }),
  component: CursoCanva,
});

function CursoCanva() {
  const courseQ = usePrimaryCourse();
  const courseId = courseQ.data?.id;
  const modulesQ = useModules(courseId);
  const lessonsQ = useCourseLessons(courseId);
  const { progressFor } = useProgress();

  if (courseQ.isLoading || modulesQ.isLoading || lessonsQ.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const error = courseQ.error || modulesQ.error || lessonsQ.error;
  if (error) return <p className="text-sm text-destructive">Erro: {(error as Error).message}</p>;
  if (!courseQ.data) return <p className="text-sm text-muted-foreground">Nenhum curso disponível.</p>;

  const course = courseQ.data;
  const mods = modulesQ.data ?? [];
  const lessons = lessonsQ.data ?? [];
  const totalAulas = lessons.length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-video bg-gradient-to-br from-primary/30 via-accent to-card grid place-items-center">
          <PlayCircle className="h-20 w-20 text-primary" />
        </div>
        <div className="space-y-3 p-6 md:p-8">
          <h1 className="text-2xl font-bold md:text-3xl">{course.name}</h1>
          {course.description && (
            <p className="text-muted-foreground">{course.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>{totalAulas} aulas</span><span>•</span><span>{mods.length} módulos</span><span>•</span><span>Certificado incluso</span>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Módulos</h2>
        <div className="space-y-2">
          {mods.map((m, i) => {
            const ml = lessons.filter((l) => l.module_id === m.id);
            const p = progressFor(ml.map((l) => l.id));
            return (
              <div key={m.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/50">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent">
                  {p.percent >= 100 ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <PlayCircle className="h-5 w-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">Módulo {i + 1}: {m.name}</h3>
                  <p className="text-sm text-muted-foreground">{ml.length} aulas · {p.percent}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
