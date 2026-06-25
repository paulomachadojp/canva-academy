import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProgressInfo = { completed: number; total: number; percent: number };

function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return userId;
}

export function useProgress() {
  const userId = useUserId();
  const qc = useQueryClient();

  const { data: completedSet } = useQuery({
    queryKey: ["lesson_progress", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", userId!)
        .eq("completed", true);
      if (error) throw error;
      return new Set<string>((data ?? []).map((r) => r.lesson_id));
    },
  });

  const completed = completedSet ?? new Set<string>();

  const mutation = useMutation({
    mutationFn: async ({ lessonId, value }: { lessonId: string; value: boolean }) => {
      if (!userId) throw new Error("Não autenticado");
      if (value) {
        const { error } = await supabase.from("lesson_progress").upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lesson_progress")
          .delete()
          .eq("user_id", userId)
          .eq("lesson_id", lessonId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson_progress", userId] });
    },
  });

  const setLessonCompleted = useCallback(
    (lessonId: string, value: boolean) => {
      mutation.mutate({ lessonId, value });
    },
    [mutation],
  );

  const isCompleted = useCallback((lessonId: string) => completed.has(lessonId), [completed]);

  const progressFor = useCallback(
    (lessonIds: string[]): ProgressInfo => {
      const total = lessonIds.length;
      if (total === 0) return { completed: 0, total: 0, percent: 0 };
      const done = lessonIds.filter((id) => completed.has(id)).length;
      return { completed: done, total, percent: Math.round((done / total) * 100) };
    },
    [completed],
  );

  return { completed, isCompleted, setLessonCompleted, progressFor };
}
