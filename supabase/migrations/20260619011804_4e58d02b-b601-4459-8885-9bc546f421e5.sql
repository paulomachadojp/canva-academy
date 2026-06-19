
CREATE TABLE public.lesson_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_reviews TO authenticated;
GRANT SELECT ON public.lesson_reviews TO anon;
GRANT ALL ON public.lesson_reviews TO service_role;

ALTER TABLE public.lesson_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.lesson_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews"
  ON public.lesson_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews"
  ON public.lesson_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews"
  ON public.lesson_reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews"
  ON public.lesson_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lesson_reviews_updated
  BEFORE UPDATE ON public.lesson_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_lesson_reviews_lesson ON public.lesson_reviews(lesson_id, created_at DESC);

-- Allow fractional points for the 0.5 review reward
DROP VIEW IF EXISTS public.user_points_ranking;
ALTER TABLE public.user_points ALTER COLUMN points TYPE NUMERIC(10,2);

CREATE VIEW public.user_points_ranking AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar,
  COALESCE(SUM(up.points), 0)::numeric(10,2) AS total_points,
  RANK() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC)::integer AS position
FROM public.profiles p
LEFT JOIN public.user_points up ON up.user_id = p.id
GROUP BY p.id, p.name, p.avatar;

GRANT SELECT ON public.user_points_ranking TO authenticated, anon;
