import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle, Clock, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Etek Academy" },
      { name: "description", content: "Sua área de membros Etek Academy" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/10 p-8 md:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <TrendingUp className="h-3 w-3" /> Continue de onde parou
          </span>
          <h1 className="text-3xl font-bold md:text-5xl">
            Bem-vindo de volta à <span className="text-primary">Etek Academy</span>
          </h1>
          <p className="text-muted-foreground md:text-lg">
            Sua jornada de aprendizado começa aqui. Acesse seus cursos, materiais e conquistas.
          </p>
          <Link
            to="/curso-canva"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <PlayCircle className="h-5 w-5" /> Continuar curso
          </Link>
        </div>
      </section>

      {/* Continue assistindo */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold md:text-2xl">Continue assistindo</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <article
              key={i}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent">
                <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                  <PlayCircle className="h-12 w-12 text-primary" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${20 * i}%` }} />
                </div>
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-semibold leading-tight">Aula {i} — Fundamentos do Canva</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {12 + i} min
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trilhas */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold md:text-2xl">Suas trilhas</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {["Design no Canva", "Branding Visual", "Mídias Sociais"].map((t) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6 transition hover:border-primary/50">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Trilha de aprendizado</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
