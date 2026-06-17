import { useCallback, useEffect, useState } from "react";
import { modules, totalLessons } from "./course-data";

const KEY = "etek:completed-lessons";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function emit() {
  window.dispatchEvent(new Event("etek:progress"));
}

export function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(() => read());

  useEffect(() => {
    const sync = () => setCompleted(read());
    window.addEventListener("etek:progress", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("etek:progress", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setLessonCompleted = useCallback((lessonId: string, value: boolean) => {
    const next = read();
    if (value) next.add(lessonId);
    else next.delete(lessonId);
    localStorage.setItem(KEY, JSON.stringify([...next]));
    emit();
  }, []);

  const isCompleted = useCallback((lessonId: string) => completed.has(lessonId), [completed]);

  const moduleProgress = useCallback(
    (moduleId: string) => {
      const mod = modules.find((m) => m.id === moduleId);
      if (!mod) return { completed: 0, total: 0, percent: 0 };
      const done = mod.lessons.filter((l) => completed.has(l.id)).length;
      return {
        completed: done,
        total: mod.lessons.length,
        percent: Math.round((done / mod.lessons.length) * 100),
      };
    },
    [completed],
  );

  const courseProgress = useCallback(() => {
    const done = completed.size;
    return { completed: done, total: totalLessons, percent: Math.round((done / totalLessons) * 100) };
  }, [completed]);

  return { isCompleted, setLessonCompleted, moduleProgress, courseProgress };
}
