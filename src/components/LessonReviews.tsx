import { useEffect, useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { awardLessonRate } from "@/lib/points";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: { name: string | null; avatar: string | null } | null;
};

export function LessonReviews({ lessonId }: { lessonId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id ?? null;
    setUserId(uid);

    const { data, error } = await supabase
      .from("lesson_reviews")
      .select("id, user_id, rating, comment, created_at")
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[reviews] load failed", error);
      setReviews([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Review[];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, name, avatar")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      rows.forEach((r) => {
        const p = map.get(r.user_id);
        r.profile = p ? { name: p.name, avatar: p.avatar } : null;
      });
    }

    setReviews(rows);
    const mine = uid ? rows.find((r) => r.user_id === uid) ?? null : null;
    setMyReview(mine);
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment ?? "");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    setRating(0);
    setComment("");
    setMyReview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const handleSubmit = async () => {
    setError(null);
    if (!userId) {
      setError("Faça login para avaliar esta aula.");
      return;
    }
    if (rating < 1) {
      setError("Selecione de 1 a 5 estrelas.");
      return;
    }
    if (myReview) {
      setError("Você já avaliou esta aula.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("lesson_reviews").insert({
      lesson_id: lessonId,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    await awardLessonRate(lessonId);
    await load();
  };

  const avg =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Avaliações</h2>
          <p className="text-xs text-muted-foreground">
            {reviews.length === 0
              ? "Seja o primeiro a avaliar"
              : `${reviews.length} avaliação${reviews.length > 1 ? "ões" : ""} · média ${avg.toFixed(1)}/5`}
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-4 w-4 ${
                  n <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {!myReview && (
        <div className="space-y-3 rounded-lg border border-border bg-background/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">Sua avaliação</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 transition hover:scale-110"
                  aria-label={`${n} estrelas`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      n <= (hover || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deixe um comentário (opcional)"
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">+0.5 ponto ao avaliar</p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar
            </button>
          </div>
        </div>
      )}

      {myReview && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
          Você já avaliou esta aula. Obrigado!
        </div>
      )}

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!loading && reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
        )}
        {reviews.map((r) => {
          const name = r.profile?.name ?? "Aluno";
          const initial = name.charAt(0).toUpperCase();
          const date = new Date(r.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          return (
            <div key={r.id} className="flex gap-3 rounded-lg border border-border bg-background/40 p-4">
              {r.profile?.avatar ? (
                <img
                  src={r.profile.avatar}
                  alt={name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${
                        n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.comment}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
