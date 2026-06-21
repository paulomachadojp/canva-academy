import { useCallback, useEffect, useState } from "react";

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

export type ProgressInfo = { completed: number; total: number; percent: number };

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

  const isCompleted = useCallback(
    (lessonId: string) => completed.has(lessonId),
    [completed],
  );

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
