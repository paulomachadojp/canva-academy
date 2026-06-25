import { createFileRoute } from "@tanstack/react-router";
import { Award, Download, Lock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress";
import { supabase } from "@/integrations/supabase/client";
import { usePrimaryCourse, useCourseLessons } from "@/lib/queries";

export const Route = createFileRoute("/certificado")({
  head: () => ({ meta: [{ title: "Certificado — Academy" }] }),
  component: Certificado,
});

function totalHoursFromDurations(durations: (string | null)[]) {
  let totalMin = 0;
  for (const d of durations) {
    if (!d) continue;
    const [mm, ss] = d.split(":").map(Number);
    totalMin += (mm || 0) + (ss || 0) / 60;
  }
  return Math.max(1, Math.round(totalMin / 60));
}

function makeValidationCode(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `CRT-${h.toString(36).toUpperCase().padStart(8, "0").slice(0, 8)}`;
}

function Certificado() {
  const courseQ = usePrimaryCourse();
  const lessonsQ = useCourseLessons(courseQ.data?.id);
  const { progressFor } = useProgress();
  const [studentName, setStudentName] = useState("Aluno Etek");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", data.user.id).maybeSingle();
      if (profile?.name) setStudentName(profile.name);
    });
  }, []);

  if (courseQ.isLoading || lessonsQ.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (courseQ.error || lessonsQ.error) {
    return <p className="text-sm text-destructive">Erro ao carregar curso.</p>;
  }
  if (!courseQ.data) {
    return <p className="text-sm text-muted-foreground">Nenhum curso disponível.</p>;
  }

  const course = courseQ.data;
  const lessons = lessonsQ.data ?? [];
  const overall = progressFor(lessons.map((l) => l.id));
  const completed = overall.total > 0 && overall.percent >= 100;
  const hours = totalHoursFromDurations(lessons.map((l) => l.duration));
  const completionDate = new Date().toLocaleDateString("pt-BR");
  const validationCode = makeValidationCode(`${userId ?? "guest"}|${course.id}`);

  function downloadPdf() {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    doc.setFillColor(15, 18, 26);
    doc.rect(0, 0, w, h, "F");

    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(3);
    doc.rect(24, 24, w - 48, h - 48);
    doc.setLineWidth(0.5);
    doc.rect(34, 34, w - 68, h - 68);

    doc.setTextColor(217, 119, 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ACADEMY", w / 2, 80, { align: "center" });

    doc.setTextColor(240, 240, 240);
    doc.setFontSize(36);
    doc.text("CERTIFICADO DE CONCLUSÃO", w / 2, 140, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(200, 200, 200);
    doc.text("Certificamos que", w / 2, 200, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(255, 255, 255);
    doc.text(studentName, w / 2, 250, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(200, 200, 200);
    doc.text(`concluiu com êxito o curso "${course.name}",`, w / 2, 295, { align: "center" });
    doc.text(`com carga horária total de ${hours} horas.`, w / 2, 318, { align: "center" });

    const footerY = h - 110;
    doc.setDrawColor(120, 120, 120);
    doc.line(80, footerY, 260, footerY);
    doc.line(w - 260, footerY, w - 80, footerY);

    doc.setFontSize(11);
    doc.setTextColor(180, 180, 180);
    doc.text("Data de conclusão", 170, footerY + 18, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(completionDate, 170, footerY + 36, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("Código de validação", w - 170, footerY + 18, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(validationCode, w - 170, footerY + 36, { align: "center" });

    doc.save(`certificado-${validationCode}.pdf`);
  }

  if (!completed) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Certificado</h1>
          <p className="text-muted-foreground">Conclua o curso para emitir seu certificado.</p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-muted text-muted-foreground">
            <Lock className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">Certificado bloqueado</h2>
          <p className="mt-2 text-muted-foreground">Complete todas as aulas para liberar seu certificado.</p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {overall.completed} de {overall.total} aulas
              </span>
              <span className="font-semibold text-primary">{overall.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${overall.percent}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Certificado</h1>
        <p className="text-muted-foreground">Parabéns! Você concluiu o curso.</p>
      </header>
      <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-card to-primary/10 p-10 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-primary">
          <Award className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Certificado disponível</h2>
        <p className="mt-2 text-muted-foreground">{course.name}</p>

        <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4 text-left text-sm">
          <div>
            <dt className="text-muted-foreground">Aluno</dt>
            <dd className="font-semibold">{studentName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Carga horária</dt>
            <dd className="font-semibold">{hours} horas</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Data de conclusão</dt>
            <dd className="font-semibold">{completionDate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Código de validação</dt>
            <dd className="font-mono font-semibold">{validationCode}</dd>
          </div>
        </dl>

        <Button onClick={downloadPdf} size="lg" className="mt-8">
          <Download className="h-4 w-4" /> Baixar Certificado
        </Button>
      </div>
    </div>
  );
}
