
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_points TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

GRANT SELECT ON public.lesson_reviews TO anon;

GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.lessons TO service_role;
GRANT ALL ON public.lesson_progress TO service_role;
GRANT ALL ON public.lesson_reviews TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_points TO service_role;
GRANT ALL ON public.user_roles TO service_role;
