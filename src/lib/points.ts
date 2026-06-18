import { supabase } from "@/integrations/supabase/client";
import { modules } from "./course-data";

export type PointAction =
  | "login"
  | `lesson_complete:${string}`
  | `lesson_rate:${string}`
  | `module_complete:${string}`
  | `course_complete:${string}`;

const POINTS = {
  lesson_complete: 3,
  lesson_rate: 1,
  module_complete: 15,
  course_complete: 50,
};

const RANKING_EVENT = "etek:ranking";
function emitRanking() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(RANKING_EVENT));
}

export function onRankingChange(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(RANKING_EVENT, handler);
  return () => window.removeEventListener(RANKING_EVENT, handler);
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function hasAction(userId: string, action: string): Promise<boolean> {
  const { count } = await supabase
    .from("user_points")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action);
  return (count ?? 0) > 0;
}

async function insertPoints(userId: string, action: string, points: number) {
  const { error } = await supabase
    .from("user_points")
    .insert({ user_id: userId, action, points });
  if (error) {
    console.error("[points] insert failed", action, error);
    return false;
  }
  emitRanking();
  return true;
}

/** Award daily login points via SECURITY DEFINER RPC. Returns pts awarded or null. */
export async function awardDailyLogin(): Promise<number | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  // Once per browser-session debounce
  if (typeof window !== "undefined") {
    const key = `etek:login-awarded:${uid}:${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return 0;
    sessionStorage.setItem(key, "1");
  }
  const { data, error } = await supabase.rpc("award_daily_login" as never);
  if (error) {
    console.error("[points] award_daily_login failed", error);
    return null;
  }
  emitRanking();
  return (data as unknown as number) ?? 0;
}

async function maybeAwardModuleAndCourse(userId: string, moduleId: string) {
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) return;

  // Count distinct lesson_complete actions for lessons in this module
  const lessonActions = mod.lessons.map((l) => `lesson_complete:${l.id}`);
  const { data: modRows } = await supabase
    .from("user_points")
    .select("action")
    .eq("user_id", userId)
    .in("action", lessonActions);

  const doneLessons = new Set((modRows ?? []).map((r) => r.action));
  if (doneLessons.size >= mod.lessons.length) {
    const modAction = `module_complete:${mod.id}`;
    if (!(await hasAction(userId, modAction))) {
      await insertPoints(userId, modAction, POINTS.module_complete);
    }

    // Check whole course
    const allLessonActions = modules.flatMap((m) =>
      m.lessons.map((l) => `lesson_complete:${l.id}`),
    );
    const { data: courseRows } = await supabase
      .from("user_points")
      .select("action")
      .eq("user_id", userId)
      .in("action", allLessonActions);
    const totalDone = new Set((courseRows ?? []).map((r) => r.action)).size;
    const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
    if (totalDone >= totalLessons) {
      const courseAction = `course_complete:canva`;
      if (!(await hasAction(userId, courseAction))) {
        await insertPoints(userId, courseAction, POINTS.course_complete);
      }
    }
  }
}

export async function awardLessonComplete(moduleId: string, lessonId: string) {
  const uid = await currentUserId();
  if (!uid) return;
  const action = `lesson_complete:${lessonId}`;
  if (await hasAction(uid, action)) return;
  const ok = await insertPoints(uid, action, POINTS.lesson_complete);
  if (ok) await maybeAwardModuleAndCourse(uid, moduleId);
}

export async function awardLessonRate(lessonId: string) {
  const uid = await currentUserId();
  if (!uid) return;
  const action = `lesson_rate:${lessonId}`;
  if (await hasAction(uid, action)) return;
  await insertPoints(uid, action, POINTS.lesson_rate);
}

export type RankingRow = {
  user_id: string;
  name: string | null;
  avatar: string | null;
  total_points: number;
  position: number;
};

export async function fetchTopRanking(limit = 10): Promise<RankingRow[]> {
  const { data, error } = await supabase
    .from("user_points_ranking" as never)
    .select("*")
    .order("position", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[points] fetch ranking failed", error);
    return [];
  }
  return (data as unknown as RankingRow[]) ?? [];
}

export async function fetchMyRanking(): Promise<RankingRow | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("user_points_ranking" as never)
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) {
    console.error("[points] fetch my ranking failed", error);
    return null;
  }
  return (data as unknown as RankingRow) ?? null;
}
