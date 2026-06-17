import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, PlayCircle, CheckCircle2, Lock, Clock } from "lucide-react";
import { modules } from "./index";

export const Route = createFileRoute("/modulo/$moduleId")({
  head: ({ params }) => ({
    meta: [{ title: `Módulo — Etek Academy` }, { name: "description", content: `Aulas do módulo ${params.moduleId}` }],
  }),
  loader: ({ params }) => {
    const mod = modules.find((m) => m.id === params.moduleId);
    if (!mod) throw notFound();
    return { mod };
  },
  component: ModulePage,
});

function ModulePage() {
  const { mod } = Route.useLoaderData();
  const completed = Math.round((mod.lessons * mod.progress) / 100);

  const lessons = Array.from({ length: mod.lessons }, (_, i) => {
    const done = i < completed;
    const current = i === completed && mod.progress < 100;
    return {
      id: i + 1,
      title: `Aula ${i + 1} — ${mod.title}`,
      duration: `${8 + i} min`,
      status: done ? "done" : current ? "current" : "locked",
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao curso
      </Link>

      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[21/6] bg-gradient-to-br from-primary/30 via-accent to-card" />
        <div className="space-y-3 p-6 md:p-8">
          <p className="text-xs text-muted-foreground">Canva do Zero ao Profissional</p>
          <h1 className="text-2xl font-bold md:text-3xl">{mod.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{mod.lessons} aulas</span>
            <span>•</span>
            <span>{completed} concluídas</span>
            <span>•</span>
            <span className="font-semibold text-primary">{mod.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${mod.progress}%` }} />
          </div>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="px-1 text-lg font-bold">Aulas</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="flex cursor-pointer items-center gap-4 border-b border-border p-4 transition last:border-0 hover:bg-accent/40"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent">
                {l.status === "done" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {l.status === "current" && <PlayCircle className="h-5 w-5 text-primary" />}
                {l.status === "locked" && <Lock className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{l.title}</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {l.duration}
                </p>
              </div>
              {l.status !== "locked" && (
                <span className="shrink-0 text-xs font-semibold text-primary">
                  {l.status === "done" ? "Revisar" : "Assistir"}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
