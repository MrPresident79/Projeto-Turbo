import { modules, glossary, type Lesson } from "./curriculum";

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  CODE_PEPPER?: string;
  ADMIN_API_TOKEN?: string;
}

interface UserRecord { id: string; name: string | null }
type ApiError = { error: string; code?: string };
const SESSION_AGE = 60 * 24 * 60 * 60;
const encoder = new TextEncoder();
const hex = (data: Uint8Array) => Array.from(data, (b) => b.toString(16).padStart(2, "0")).join("");
const now = () => Math.floor(Date.now() / 1000);

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra
    }
  });

function err(message: string, status = 400, code = "INVALID_REQUEST") {
  return json({ error: message, code } satisfies ApiError, status);
}

async function bodyOf(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw Error("Envie os dados em formato JSON.");
  }
  const text = await request.text();
  if (text.length > 8192) throw Error("Solicitação muito grande.");
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("Dados inválidos.");
  return parsed as Record<string, unknown>;
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return hex(new Uint8Array(bytes));
}

async function sha256(value: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

function randomHex(bytes: number): string {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)));
}

function randomCode(): string {
  let digits = "";
  while (digits.length < 12) {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    for (const b of bytes) {
      if (b < 250 && digits.length < 12) digits += String(b % 10);
    }
  }
  return digits;
}

function sessionCookie(token: string, request: Request, maxAge = SESSION_AGE): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `turbo_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

async function issueSession(env: Env, userId: string, request: Request) {
  const token = randomHex(32);
  await env.DB.prepare("INSERT INTO sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)")
    .bind(await sha256(token), userId, now() + SESSION_AGE, now()).run();
  return sessionCookie(token, request);
}

async function currentUser(request: Request, env: Env): Promise<UserRecord | null> {
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)turbo_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  return await env.DB.prepare(
    "SELECT users.id,users.name FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?"
  ).bind(await sha256(token), now()).first<UserRecord>();
}

async function guardAttempt(request: Request, env: Env, scope: string): Promise<string | null> {
  const ip = request.headers.get("cf-connecting-ip") || "local";
  const key = await sign(`limit:${scope}:${ip}`, env.CODE_PEPPER!);
  const state = await env.DB.prepare("SELECT attempts,reset_at FROM rate_limits WHERE key=?")
    .bind(key).first<{ attempts: number; reset_at: number }>();
  if (state && state.reset_at > now() && state.attempts >= 8) return null;
  return key;
}
async function failedAttempt(env: Env, key: string) {
  await env.DB.prepare(
    "INSERT INTO rate_limits (key,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at <= ? THEN 1 ELSE attempts+1 END, reset_at=CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END"
  ).bind(key, now() + 900, now(), now()).run();
}

async function catalog(env: Env, userId: string) {
  const rows = await env.DB.prepare("SELECT lesson_id FROM completions WHERE user_id=?")
    .bind(userId).all<{ lesson_id: string }>();
  const finished = new Set((rows.results || []).map((row) => row.lesson_id));
  let previousComplete = true;
  const list = modules.map((mod, idx) => {
    let previousLessonComplete = true;
    const lessons = mod.lessons.map((lesson) => {
      const completed = finished.has(lesson.id);
      const unlocked = previousComplete && previousLessonComplete;
      previousLessonComplete = completed && previousLessonComplete;
      return {
        id: lesson.id, title: lesson.title, minutes: lesson.minutes,
        completed, unlocked: unlocked || completed
      };
    });
    const completeCount = lessons.filter((l) => l.completed).length;
    const unlocked = previousComplete || completeCount > 0;
    previousComplete = previousComplete && completeCount === lessons.length;
    return {
      id: mod.id, index: idx + 1, title: mod.title, eyebrow: mod.eyebrow,
      description: mod.description, category: mod.category, lessons,
      completed: completeCount, total: lessons.length,
      progress: Math.round((100 * completeCount) / lessons.length), unlocked
    };
  });
  const totalLessons = list.reduce((sum, mod) => sum + mod.total, 0);
  const completedLessons = list.reduce((sum, mod) => sum + mod.completed, 0);
  return {
    modules: list, completedLessons, totalLessons,
    percentage: totalLessons ? Math.round(100 * completedLessons / totalLessons) : 0
  };
}

async function adminAuthorized(request: Request, env: Env) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!env.ADMIN_API_TOKEN || !token) return false;
  const [a, b] = await Promise.all([sha256(token), sha256(env.ADMIN_API_TOKEN)]);
  return a === b;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method === "OPTIONS") return err("Método não permitido.", 405);
    if (!["GET", "POST"].includes(request.method)) return err("Método não permitido.", 405);
    const mutating = request.method === "POST";
    if (mutating) {
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin) return err("Origem não autorizada.", 403);
    }

    try {
      if (url.pathname === "/api/health" && !mutating) {
        return json({ status: "ok", database: Boolean(env.DB), configured: Boolean(env.CODE_PEPPER) });
      }
      if (!env.CODE_PEPPER || env.CODE_PEPPER.length < 32 || !env.DB) {
        return err("O servidor ainda não está configurado. Verifique os segredos e o banco D1.", 503, "NOT_CONFIGURED");
      }

      if (url.pathname === "/api/admin/codes" && mutating) {
        if (!await adminAuthorized(request, env)) return err("Não autorizado.", 401, "UNAUTHORIZED");
        const input = await bodyOf(request);
        const quantity = Number(input.quantity ?? 1);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) return err("Solicite entre 1 e 50 códigos.");
        const note = typeof input.note === "string" ? input.note.slice(0, 120) : "";
        const result: string[] = [];
        for (let n = 0; n < quantity; n++) {
          for (let tries = 0; tries < 10; tries++) {
            const code = randomCode();
            const codeHash = await sign(`access:${code}`, env.CODE_PEPPER);
            const save = await env.DB.prepare(
              "INSERT OR IGNORE INTO access_codes (code_hash,note,issued_at) VALUES (?,?,?)"
            ).bind(codeHash, note, now()).run();
            if (save.meta.changes === 1) {
              result.push(code.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3"));
              break;
            }
          }
        }
        return json({
          codes: result,
          warning: "Guarde esses códigos agora. Por segurança, eles não podem ser consultados novamente."
        }, 201);
      }

      if (url.pathname === "/api/activate" && mutating) {
        const key = await guardAttempt(request, env, "activate");
        if (!key) return err("Muitas tentativas. Tente novamente em 15 minutos.", 429, "RATE_LIMIT");
        const input = await bodyOf(request);
        const code = String(input.code || "").replace(/\D/g, "");
        if (!/^\d{12}$/.test(code)) return err("Insira os 12 números do seu código.");
        const codeHash = await sign(`access:${code}`, env.CODE_PEPPER);
        const access = await env.DB.prepare(
          "SELECT code_hash FROM access_codes WHERE code_hash=? AND redeemed_at IS NULL"
        ).bind(codeHash).first();
        if (!access) {
          await failedAttempt(env, key);
          return err("Código inválido ou já utilizado. Confira seu presente.", 401, "INVALID_CODE");
        }
        const id = crypto.randomUUID();
        const recovery = randomHex(16).toUpperCase();
        const recoveryHash = await sign(`recovery:${recovery}`, env.CODE_PEPPER);
        await env.DB.prepare("INSERT INTO users (id,name,recovery_hash,created_at,updated_at) VALUES (?,NULL,?,?,?)")
          .bind(id, recoveryHash, now(), now()).run();
        const redeemed = await env.DB.prepare(
          "UPDATE access_codes SET redeemed_at=?,user_id=? WHERE code_hash=? AND redeemed_at IS NULL"
        ).bind(now(), id, codeHash).run();
        if (redeemed.meta.changes !== 1) {
          await env.DB.prepare("DELETE FROM users WHERE id=?").bind(id).run();
          await failedAttempt(env, key);
          return err("Esse código acabou de ser ativado.", 409, "ALREADY_REDEEMED");
        }
        const cookie = await issueSession(env, id, request);
        await env.DB.prepare("DELETE FROM rate_limits WHERE key=?").bind(key).run();
        return json({
          activated: true,
          recoveryCode: recovery.match(/.{1,8}/g)?.join("-"),
          user: { id, name: null }
        }, 201, { "Set-Cookie": cookie });
      }

      if (url.pathname === "/api/recover" && mutating) {
        const key = await guardAttempt(request, env, "recover");
        if (!key) return err("Muitas tentativas. Tente novamente em 15 minutos.", 429, "RATE_LIMIT");
        const input = await bodyOf(request);
        const code = String(input.recoveryCode || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase();
        if (!/^[A-F0-9]{32}$/.test(code)) return err("Chave de recuperação inválida.");
        const record = await env.DB.prepare("SELECT id,name FROM users WHERE recovery_hash=?")
          .bind(await sign(`recovery:${code}`, env.CODE_PEPPER)).first<UserRecord>();
        if (!record) {
          await failedAttempt(env, key);
          return err("Chave não encontrada.", 401, "INVALID_RECOVERY");
        }
        const cookie = await issueSession(env, record.id, request);
        await env.DB.prepare("DELETE FROM rate_limits WHERE key=?").bind(key).run();
        return json({ user: record }, 200, { "Set-Cookie": cookie });
      }

      const user = await currentUser(request, env);
      if (!user) return err("Sua sessão terminou. Acesse com sua chave de recuperação.", 401, "UNAUTHORIZED");
      if (url.pathname === "/api/me" && !mutating) return json({ user });
      if (url.pathname === "/api/profile" && mutating) {
        const input = await bodyOf(request);
        const name = String(input.name || "").trim().replace(/\s+/g, " ");
        if (!/^[\p{L}][\p{L}\p{M}\s'-]{0,39}$/u.test(name)) {
          return err("Informe um nome válido de até 40 caracteres.");
        }
        await env.DB.prepare("UPDATE users SET name=?,updated_at=? WHERE id=?")
          .bind(name, now(), user.id).run();
        return json({ user: { ...user, name } });
      }
      if (url.pathname === "/api/logout" && mutating) {
        const token = request.headers.get("cookie")?.match(/(?:^|;\s*)turbo_session=([a-f0-9]{64})(?:;|$)/)?.[1];
        if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(token)).run();
        return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", request, 0) });
      }
      if (url.pathname === "/api/catalog" && !mutating) return json(await catalog(env, user.id));
      if (url.pathname === "/api/glossary" && !mutating) return json({ terms: glossary });
      if (url.pathname.startsWith("/api/lesson/") && !mutating) {
        const id = decodeURIComponent(url.pathname.slice("/api/lesson/".length));
        const item = modules.flatMap((m) => m.lessons).find((lesson) => lesson.id === id);
        if (!item) return err("Aula não encontrada.", 404, "NOT_FOUND");
        const overview = await catalog(env, user.id);
        if (!overview.modules.some((m) => m.lessons.some((l) => l.id === id && l.unlocked))) {
          return err("Complete as etapas anteriores para liberar esta aula.", 403, "LOCKED");
        }
        return json({ lesson: { ...item, question: { prompt: item.question.prompt, options: item.question.options } } });
      }
      if (url.pathname === "/api/complete" && mutating) {
        const input = await bodyOf(request);
        const id = String(input.lessonId || "");
        const answer = input.answer;
        const lesson: Lesson | undefined = modules.flatMap((m) => m.lessons).find((entry) => entry.id === id);
        if (!lesson) return err("Aula não encontrada.", 404);
        const overview = await catalog(env, user.id);
        if (!overview.modules.some((m) => m.lessons.some((l) => l.id === id && l.unlocked))) {
          return err("Esta aula ainda está bloqueada.", 403, "LOCKED");
        }
        const correct = Number.isInteger(answer) && answer === lesson.question.correct;
        if (correct) {
          await env.DB.prepare("INSERT OR IGNORE INTO completions (user_id,lesson_id,completed_at) VALUES (?,?,?)")
            .bind(user.id, id, now()).run();
        }
        return json({ correct, explanation: lesson.question.explanation, catalog: await catalog(env, user.id) });
      }
      return err("Rota não encontrada.", 404, "NOT_FOUND");
    } catch (error) {
      if (error instanceof SyntaxError) return err("JSON inválido.");
      if (error instanceof Error && ["Envie os dados em formato JSON.", "Solicitação muito grande.", "Dados inválidos."].includes(error.message)) {
        return err(error.message);
      }
      console.error("Projeto Turbo API failure", error);
      return err("Ocorreu um problema no servidor. Tente novamente.", 500, "SERVER_ERROR");
    }
  }
};
