
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX idx_user_points_created_at ON public.user_points(created_at DESC);
CREATE INDEX idx_user_points_action ON public.user_points(action);

GRANT SELECT, INSERT ON public.user_points TO authenticated;
GRANT ALL ON public.user_points TO service_role;

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points"
  ON public.user_points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
  ON public.user_points FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all points"
  ON public.user_points FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ranking view: total points per user joined with profile info
CREATE OR REPLACE VIEW public.user_points_ranking
WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar,
  COALESCE(SUM(up.points), 0)::INTEGER AS total_points,
  RANK() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC)::INTEGER AS position
FROM public.profiles p
LEFT JOIN public.user_points up ON up.user_id = p.id
GROUP BY p.id, p.name, p.avatar;

GRANT SELECT ON public.user_points_ranking TO authenticated;

-- Make profiles readable by all authenticated users so ranking displays names/avatars
DROP POLICY IF EXISTS "Authenticated users can view all profiles for ranking" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles for ranking"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- RPC: award a daily login point (2/1/0/0 for 1st/2nd/3rd+/etc on the day)
CREATE OR REPLACE FUNCTION public.award_daily_login()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  logins_today INTEGER;
  pts INTEGER;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COUNT(*) INTO logins_today
  FROM public.user_points
  WHERE user_id = uid
    AND action = 'login'
    AND created_at >= date_trunc('day', now());

  pts := CASE
    WHEN logins_today = 0 THEN 2
    WHEN logins_today = 1 THEN 1
    ELSE 0
  END;

  INSERT INTO public.user_points (user_id, points, action)
  VALUES (uid, pts, 'login');

  RETURN pts;
END;
$$;

REVOKE ALL ON FUNCTION public.award_daily_login() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_daily_login() TO authenticated;
