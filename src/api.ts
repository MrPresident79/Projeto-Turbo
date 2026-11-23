export interface Profile { id: string; name: string | null }
export interface Quiz { prompt: string; options: string[]; correct: number; explanation: string }
export interface Lesson {
  id: string; title: string; lead: string; minutes: number;
  sections: { title: string; text: string }[];
  question: Quiz;
}
export interface LessonSummary { id: string; title: string; minutes: number; completed: boolean; unlocked: boolean }
export interface LearningModule {
  id: string; index: number; eyebrow: string; title: string; category: string;
  description: string; lessons: LessonSummary[];
  completed: number; total: number; progress: number; unlocked: boolean;
}
export interface Catalog {
  modules: LearningModule[]; completedLessons: number; totalLessons: number; percentage: number;
}
export interface GlossaryEntry { term: string; definition: string }

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}
export async function api<T>(path: string, data?: unknown, method?: "GET" | "POST"): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: method ?? (data === undefined ? "GET" : "POST"),
      credentials: "include",
      headers: data === undefined ? {} : { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data)
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua internet.", 0, "NETWORK");
  }
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(String(body.error || "Não foi possível concluir a solicitação."), response.status, String(body.code || "ERROR"));
  }
  return body as T;
}
