import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";

export const Route = createFileRoute("/certificado")({
  head: () => ({ meta: [{ title: "Certificado — Etek Academy" }] }),
  component: Certificado,
});

function Certificado() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Certificado</h1>
        <p className="text-muted-foreground">Conclua o curso para emitir seu certificado.</p>
      </header>
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-primary/10 p-10 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-primary">
          <Award className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Em progresso</h2>
        <p className="mt-2 text-muted-foreground">Você está em 35% do curso. Continue para desbloquear seu certificado.</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[35%] bg-primary" />
        </div>
      </div>
    </div>
  );
}
