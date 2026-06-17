import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle, CheckCircle2, Circle, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Canva do Zero ao Profissional — Etek Academy" },
      { name: "description", content: "Sua área de aluno Etek Academy" },
    ],
  }),
  component: Index,
});

export const modules = [
  { id: "introducao", title: "Introdução ao Canva", lessons: 5, progress: 100 },
  { id: "ferramentas", title: "Ferramentas Essenciais", lessons: 8, progress: 60 },
  { id: "tipografia", title: "Tipografia e Cores", lessons: 6, progress: 25 },
  { id: "layouts", title: "Layouts e Composição", lessons: 7, progress: 0 },
  { id: "branding", title: "Branding Visual", lessons: 6, progress: 0 },
  { id: "projetos", title: "Projetos Práticos", lessons: 10, progress: 0 },
];

function getStatus(p: number) {
  if (p === 0) return { label: "Não iniciado", className: "bg-muted text-muted-foreground", Icon: Circle };
  if (p >= 100) return { label: "Concluído", className: "bg-primary/15 text-primary", Icon: CheckCircle2 };
  return { label: "Em andamento", className: "bg-amber-500/15 text-amber-400", Icon: PlayCircle };
}

function Index() {
  const totalLessons = modules.reduce((a, m) => a + m.lessons, 0);
  const completedLessons = modules.reduce((a, m) => a + Math.round((m.lessons * m.progress) / 100), 0);
  const overall = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Banner */}
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
              Canva do Zero ao <span className="text-primary">Profissional</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              Domine o Canva e crie peças visuais profissionais para o seu negócio.
            </p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="space-y-3 p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Progresso geral</p>
              <p className="text-xs text-muted-foreground">
                {completedLessons} de {totalLessons} aulas concluídas
              </p>
            </div>
            <span className="font-display text-2xl font-bold text-primary md:text-3xl">{overall}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
              style={{ width: `${overall}%` }}
            />
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">Módulos do curso</h2>
            <p className="text-sm text-muted-foreground">Acompanhe seu progresso em cada módulo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const status = getStatus(m.progress);
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
                    <h3 className="font-semibold leading-tight transition group-hover:text-primary">
                      {m.title}
                    </h3>
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {m.lessons} aulas
                  </p>

                  <div className="mt-auto space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold text-foreground">{m.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${m.progress}%` }}
                      />
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
