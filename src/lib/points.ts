import { supabase } from "@/integrations/supabase/client";

export type PointAction =
  | "login"
  | `lesson_complete:${string}`
  | `lesson_rate:${string}`
  | `module_complete:${string}`
  | `course_complete:${string}`;

const POINTS = {
  lesson_complete: 3,
  lesson_rate: 0.5,
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

export async function awardDailyLogin(): Promise<number | null> {
  const uid = await currentUserId();
  if (!uid) return null;
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
  // Fetch module's lessons and its course
  const { data: mod } = await supabase
    .from("modules")
    .select("id, course_id")
    .eq("id", moduleId)
    .maybeSingle();
  if (!mod) return;

  const { data: modLessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId);
  const modLessonIds = (modLessons ?? []).map((l) => l.id);
  if (modLessonIds.length === 0) return;

  const modActions = modLessonIds.map((id) => `lesson_complete:${id}`);
  const { data: modRows } = await supabase
    .from("user_points")
    .select("action")
    .eq("user_id", userId)
    .in("action", modActions);
  const doneInMod = new Set((modRows ?? []).map((r) => r.action));
  if (doneInMod.size < modLessonIds.length) return;

  const modAction = `module_complete:${moduleId}`;
  if (!(await hasAction(userId, modAction))) {
    await insertPoints(userId, modAction, POINTS.module_complete);
  }

  // Course completion check
  const { data: courseMods } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", mod.course_id);
  const courseModIds = (courseMods ?? []).map((m) => m.id);
  if (courseModIds.length === 0) return;
  const { data: courseLessons } = await supabase
    .from("lessons")
    .select("id")
    .in("module_id", courseModIds);
  const courseLessonIds = (courseLessons ?? []).map((l) => l.id);
  if (courseLessonIds.length === 0) return;
  const courseActions = courseLessonIds.map((id) => `lesson_complete:${id}`);
  const { data: courseRows } = await supabase
    .from("user_points")
    .select("action")
    .eq("user_id", userId)
    .in("action", courseActions);
  const totalDone = new Set((courseRows ?? []).map((r) => r.action)).size;
  if (totalDone < courseLessonIds.length) return;

  const courseAction = `course_complete:${mod.course_id}`;
  if (!(await hasAction(userId, courseAction))) {
    await insertPoints(userId, courseAction, POINTS.course_complete);
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
