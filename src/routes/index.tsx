import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle, CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";
import { useProgress } from "@/lib/progress";
import { usePrimaryCourse, useModules, useCourseLessons } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Canva do Zero ao Profissional — Etek Academy" },
      { name: "description", content: "Sua área de aluno Etek Academy" },
    ],
  }),
  component: Index,
});

function getStatus(p: number) {
  if (p === 0) return { label: "Não iniciado", className: "bg-muted text-muted-foreground", Icon: Circle };
  if (p >= 100) return { label: "Concluído", className: "bg-primary/15 text-primary", Icon: CheckCircle2 };
  return { label: "Em andamento", className: "bg-amber-500/15 text-amber-400", Icon: PlayCircle };
}

function Index() {
  const { progressFor } = useProgress();
  const courseQ = usePrimaryCourse();
  const courseId = courseQ.data?.id;
  const modulesQ = useModules(courseId);
  const courseLessonsQ = useCourseLessons(courseId);

  const loading = courseQ.isLoading || modulesQ.isLoading || courseLessonsQ.isLoading;
  const error = courseQ.error || modulesQ.error || courseLessonsQ.error;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-destructive">Erro ao carregar curso: {(error as Error).message}</p>;
  }
  if (!courseQ.data) {
    return <p className="text-sm text-muted-foreground">Nenhum curso disponível.</p>;
  }

  const course = courseQ.data;
  const mods = modulesQ.data ?? [];
  const allLessons = courseLessonsQ.data ?? [];
  const overall = progressFor(allLessons.map((l) => l.id));

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[21/9] w-full bg-gradient-to-br from-primary/30 via-accent to-card md:aspect-[21/7]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Curso em andamento
            </span>
            <h1 className="mt-3 text-2xl font-bold leading-tight md:text-4xl lg:text-5xl">
              {course.name}
            </h1>
            {course.description && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
                {course.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Progresso geral</p>
              <p className="text-xs text-muted-foreground">
                {overall.completed} de {overall.total} aulas concluídas
              </p>
            </div>
            <span className="font-display text-2xl font-bold text-primary md:text-3xl">{overall.percent}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
              style={{ width: `${overall.percent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">Módulos do curso</h2>
          <p className="text-sm text-muted-foreground">Acompanhe seu progresso em cada módulo</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mods.map((m, i) => {
            const modLessons = allLessons.filter((l) => l.module_id === m.id);
            const p = progressFor(modLessons.map((l) => l.id));
            const status = getStatus(p.percent);
            return (
              <Link
                key={m.id}
                to="/modulo/$moduleId"
                params={{ moduleId: m.id }}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/25 via-accent to-card">
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-5xl font-bold text-foreground/20">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                  >
                    <status.Icon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Módulo {i + 1}</p>
                    <h3 className="font-semibold leading-tight transition group-hover:text-primary">{m.name}</h3>
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {modLessons.length} aulas
                  </p>

                  <div className="mt-auto space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold text-foreground">{p.percent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.percent}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
