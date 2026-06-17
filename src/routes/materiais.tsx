import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/materiais")({
  head: () => ({ meta: [{ title: "Materiais — Etek Academy" }] }),
  component: Materiais,
});

function Materiais() {
  const items = ["Apostila do Curso", "Templates Canva", "Paletas de Cores", "Guia de Tipografia"];
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Materiais</h1>
        <p className="text-muted-foreground">Recursos complementares para download.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div key={m} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/50">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{m}</h3>
              <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-foreground hover:bg-primary hover:text-primary-foreground">
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
