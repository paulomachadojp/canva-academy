import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, PlayCircle, Clock, Download, FileText, Check, Loader2 } from "lucide-react";
import { useProgress } from "@/lib/progress";
import { useLesson, useLessons, useModule, useCourseLessons, extractYoutubeId } from "@/lib/queries";

export const Route = createFileRoute("/modulo/$moduleId/aula/$lessonId")({
  head: () => ({ meta: [{ title: "Aula — Academy" }] }),
  component: LessonPage,
});

function LessonPage() {
  const { moduleId, lessonId } = Route.useParams();
  const navigate = useNavigate();
  const lessonQ = useLesson(lessonId);
  const modQ = useModule(moduleId);
  const lessonsQ = useLessons(moduleId);
  const courseLessonsQ = useCourseLessons(modQ.data?.course_id);
  const { isCompleted, setLessonCompleted, progressFor } = useProgress();

  if (lessonQ.isLoading || modQ.isLoading || lessonsQ.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const error = lessonQ.error || modQ.error || lessonsQ.error;
  if (error) return <p className="text-sm text-destructive">Erro: {(error as Error).message}</p>;
  if (!lessonQ.data || !modQ.data) {
    return <p className="text-sm text-muted-foreground">Aula não encontrada.</p>;
  }

  const lesson = lessonQ.data;
  const mod = modQ.data;
  const lessons = lessonsQ.data ?? [];
  const allCourseLessons = courseLessonsQ.data ?? [];
  const done = isCompleted(lesson.id);
  const modP = progressFor(lessons.map((l) => l.id));
  const courseP = progressFor(allCourseLessons.map((l) => l.id));
  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
  const nextLesson = lessons[currentIndex + 1];
  const ytId = extractYoutubeId(lesson.youtube_url);

  const handleComplete = () => {
    setLessonCompleted(lesson.id, !done);
  };

  const handleCompleteAndNext = () => {
    if (!done) setLessonCompleted(lesson.id, true);
    if (nextLesson) {
      navigate({ to: "/modulo/$moduleId/aula/$lessonId", params: { moduleId: mod.id, lessonId: nextLesson.id } });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        to="/modulo/$moduleId"
        params={{ moduleId: mod.id }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao módulo
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main */}
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-black">
            <div className="relative aspect-video w-full">
              {ytId ? (
                <iframe
                  key={lesson.id}
                  src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                  title={lesson.name}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                  Vídeo indisponível
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{mod.name}</p>
                <h1 className="mt-1 text-xl font-bold md:text-2xl">{lesson.name}</h1>
                {lesson.duration && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {lesson.duration}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  onClick={handleComplete}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    done
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-accent text-foreground hover:border-primary/50"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  {done ? "Concluída" : "Marcar como concluída"}
                </button>
                {nextLesson && (
                  <button
                    onClick={handleCompleteAndNext}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Próxima aula
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso do módulo</span>
                <span className="font-semibold">{modP.percent}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${modP.percent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso do curso</span>
                <span className="font-semibold">{courseP.percent}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${courseP.percent}%` }} />
              </div>
            </div>
          </div>

          {lesson.description && (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold">Sobre esta aula</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{lesson.description}</p>
            </section>
          )}

          

          {lesson.material_url && (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold">Materiais</h2>
              <div className="space-y-2">
                <a
                  href={lesson.material_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 transition hover:border-primary/50 hover:bg-accent/40"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Material complementar</p>
                    <p className="text-xs text-muted-foreground">Download</p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              </div>
            </section>
          )}
        </div>

        {/* Playlist */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <p className="text-xs text-muted-foreground">Playlist</p>
              <h3 className="truncate font-bold">{mod.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {modP.completed} / {modP.total} aulas
              </p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto lg:max-h-[calc(100vh-220px)]">
              {lessons.map((l, i) => {
                const lDone = isCompleted(l.id);
                const isCurrent = l.id === lesson.id;
                return (
                  <Link
                    key={l.id}
                    to="/modulo/$moduleId/aula/$lessonId"
                    params={{ moduleId: mod.id, lessonId: l.id }}
                    className={`flex items-center gap-3 border-b border-border p-3 transition last:border-0 ${
                      isCurrent ? "bg-primary/10" : "hover:bg-accent/40"
                    }`}
                  >
                    {isCurrent && <span className="absolute left-0 h-10 w-1 rounded-r bg-primary" />}
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                        lDone
                          ? "bg-primary/20 text-primary"
                          : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {lDone ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <PlayCircle className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          isCurrent ? "font-semibold text-primary" : lDone ? "text-foreground" : "text-foreground/90"
                        }`}
                      >
                        {l.name}
                      </p>
                      {l.duration && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {l.duration}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
