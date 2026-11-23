import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { strict as assert } from "node:assert";
const values = Object.fromEntries(readFileSync(".dev.vars", "utf8").split(/\r?\n/).filter(x => /^[A-Z_]+=/.test(x)).map(x => x.split(/=(.*)/s).slice(0,2)));
const realCode = readFileSync(".local-activation-code", "utf8").trim();
assert.match(realCode, /^\d{12}$/);
assert.match(values.EMERGENCY_ACCESS_CODE, /^\d{12}$/);
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const server = spawn(npx, ["wrangler", "dev", "--local", "--port", "8787"], { stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
server.stdout.on("data", (buffer) => { logs += buffer.toString(); });
server.stderr.on("data", (buffer) => { logs += buffer.toString(); });
const origin = "http://127.0.0.1:8787";
async function request(path, body, cookie) {
  const result = await fetch(origin + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { response: result, data: await result.json(), cookie: result.headers.get("set-cookie")?.split(";")[0] };
}
try {
  let ready = false;
  for (let attempts=0;attempts<85;attempts++) {
    if (server.exitCode !== null) throw Error("Worker encerrou antes de iniciar.");
    try {
      const answer = await request("/api/health");
      if (answer.response.ok && answer.data.configured) { ready = true; break; }
    } catch {}
    await delay(600);
  }
  if (!ready) throw Error("Worker não ficou disponível: " + logs.slice(-2000));
  const guest = await request("/api/catalog");
  assert.equal(guest.response.status, 401, "Não autenticados não podem ler catálogo");
  const minted = await request("/api/activate", { code: realCode });
  assert.equal(minted.response.status, 201, JSON.stringify(minted.data));
  assert.match(minted.data.recoveryCode, /^[A-F0-9-]{35}$/);
  const cookie = minted.cookie;
  assert.ok(cookie?.startsWith("turbo_session="));
  const profile = await request("/api/profile", { name: "João" }, cookie);
  assert.equal(profile.data.user.name, "João");
  const catalog = await request("/api/catalog", undefined, cookie);
  assert.equal(catalog.data.modules.length, 15);
  assert.equal(catalog.data.totalLessons, 33);
  const first = await request("/api/lesson/anatomia-carro", undefined, cookie);
  assert.equal(first.response.status, 200, JSON.stringify(first.data));
  assert.ok(!("correct" in first.data.lesson.question), "O servidor não deve enviar resposta correta ao aluno");
  const wrong = await request("/api/complete", {lessonId:"anatomia-carro",answer:0}, cookie);
  assert.equal(wrong.data.correct, false);
  const right = await request("/api/complete", {lessonId:"anatomia-carro",answer:1}, cookie);
  assert.equal(right.data.correct, true);
  assert.equal(right.data.catalog.completedLessons, 1);
  const reused = await request("/api/activate", {code: realCode});
  assert.equal(reused.response.status, 401, "Código comum precisa ser de uso único");
  const demo = await request("/api/activate", {code:values.EMERGENCY_ACCESS_CODE});
  assert.equal(demo.response.status, 200, JSON.stringify(demo.data));
  assert.equal(demo.data.demo, true);
  assert.equal(demo.data.user.name, "Piloto Demo");
  assert.notEqual(demo.data.user.id, profile.data.user.id, "O demo não pode acessar conta de comprador");
  const demoProfileChange = await request("/api/profile", {name:"Outro"}, demo.cookie);
  assert.equal(demoProfileChange.response.status, 403, "Demo não pode alterar perfil compartilhado");
  console.log("PASSOU: ativação, código único, demo fixo, isolamento, sessão, quiz, progresso e acesso bloqueado.");
} catch (error) {
  console.error(String(error));
  console.error(logs.slice(-5000));
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
  await delay(500);
  if (server.exitCode === null) server.kill("SIGKILL");
}
