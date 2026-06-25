
-- 1. profiles: drop broad SELECT policies, restrict to own profile
DROP POLICY IF EXISTS "Authenticated users can view all profiles for ranking" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible to authenticated users" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 2. lesson_reviews: require auth
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.lesson_reviews;
CREATE POLICY "Authenticated users can read reviews" ON public.lesson_reviews
  FOR SELECT TO authenticated USING (true);

-- 3. user_points: remove self-insert
DROP POLICY IF EXISTS "Users can insert their own points" ON public.user_points;

-- 4. Drop SECURITY DEFINER view (points feature removed in MVP)
DROP VIEW IF EXISTS public.user_points_ranking;

-- 5. Drop unused SECURITY DEFINER function (points removed)
DROP FUNCTION IF EXISTS public.award_daily_login();

-- 6. Lock down remaining SECURITY DEFINER functions: revoke from anon/public, keep authenticated (required by RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
-- handle_new_user runs as auth trigger only
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
