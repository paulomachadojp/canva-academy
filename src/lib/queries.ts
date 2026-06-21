import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Course = {
  id: string;
  name: string;
  description: string | null;
  banner: string | null;
  created_at: string;
  updated_at: string;
};

export type Module = {
  id: string;
  course_id: string;
  name: string;
  order_number: number;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  module_id: string;
  name: string;
  youtube_url: string | null;
  description: string | null;
  material_url: string | null;
  duration: string | null;
  order_number: number;
  created_at: string;
  updated_at: string;
};

export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });
}

export function usePrimaryCourse() {
  return useQuery({
    queryKey: ["courses", "primary"],
    queryFn: async (): Promise<Course | null> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as Course) ?? null;
    },
  });
}

export function useModules(courseId: string | undefined) {
  return useQuery({
    queryKey: ["modules", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<Module[]> => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId!)
        .order("order_number");
      if (error) throw error;
      return (data ?? []) as Module[];
    },
  });
}

export function useLessons(moduleId: string | undefined) {
  return useQuery({
    queryKey: ["lessons", moduleId],
    enabled: !!moduleId,
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId!)
        .order("order_number");
      if (error) throw error;
      return (data ?? []) as Lesson[];
    },
  });
}

export function useModule(moduleId: string | undefined) {
  return useQuery({
    queryKey: ["module", moduleId],
    enabled: !!moduleId,
    queryFn: async (): Promise<Module | null> => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Module) ?? null;
    },
  });
}

export function useLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["lesson", lessonId],
    enabled: !!lessonId,
    queryFn: async (): Promise<Lesson | null> => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Lesson) ?? null;
    },
  });
}

/** All lessons of a course, joined via modules. Used for course-wide progress/certificates. */
export function useCourseLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-lessons", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<Lesson[]> => {
      const { data: mods, error: modsErr } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId!);
      if (modsErr) throw modsErr;
      const ids = (mods ?? []).map((m) => m.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .in("module_id", ids)
        .order("order_number");
      if (error) throw error;
      return (data ?? []) as Lesson[];
    },
  });
}
