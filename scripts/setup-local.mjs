import { createHmac, randomBytes, randomInt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const varsPath = ".dev.vars";
const makeCode = () => Array.from({ length: 12 }, () => String(randomInt(10))).join("");
const format = (value) => value.match(/.{4}/g).join("-");
const parse = (source) => Object.fromEntries(source.split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line))
  .map((line) => { const idx = line.indexOf("="); return [line.slice(0, idx), line.slice(idx + 1).trim()]; }));

let content = existsSync(varsPath) ? readFileSync(varsPath, "utf8") : "";
let config = parse(content);
let modified = !existsSync(varsPath);
for (const [key, value] of Object.entries({
  CODE_PEPPER: () => randomBytes(48).toString("hex"),
  ADMIN_API_TOKEN: () => randomBytes(48).toString("hex"),
  EMERGENCY_ACCESS_CODE: makeCode
})) {
  if (!config[key] || config[key].startsWith("replace-with-")) {
    const generated = value();
    const existing = new RegExp(`^${key}=.*import { createHmac, randomBytes, randomInt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const varsPath = ".dev.vars";
const makeCode = () => Array.from({ length: 12 }, () => String(randomInt(10))).join("");
const format = (value) => value.match(/.{4}/g).join("-");
const parse = (source) => Object.fromEntries(source.split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line))
  .map((line) => { const idx = line.indexOf("="); return [line.slice(0, idx), line.slice(idx + 1).trim()]; }));

let content = existsSync(varsPath) ? readFileSync(varsPath, "utf8") : "";
let config = parse(content);
let modified = !existsSync(varsPath);
for (const [key, value] of Object.entries({
  CODE_PEPPER: () => randomBytes(48).toString("hex"),
  ADMIN_API_TOKEN: () => randomBytes(48).toString("hex"),
  EMERGENCY_ACCESS_CODE: makeCode
})) {
, "m");
    if (existing.test(content)) content = content.replace(existing, `${key}=${generated}`);
    else content += (content.length && !content.endsWith("\n") ? "\n" : "") + `${key}=${generated}\n`;
    modified = true;
  }
}
config = parse(content);
if (!/^\d{12}$/.test(config.EMERGENCY_ACCESS_CODE)) throw new Error("EMERGENCY_ACCESS_CODE precisa ter exatamente 12 dígitos.");
if (config.CODE_PEPPER.length < 32 || config.ADMIN_API_TOKEN.length < 32) throw new Error("Configure segredos fortes de pelo menos 32 caracteres em .dev.vars.");
if (modified) writeFileSync(varsPath, content, { mode: 0o600 });

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
function run(args) {
  const output = spawnSync(npx, ["wrangler", ...args], { encoding: "utf8", stdio: "pipe" });
  if (output.status !== 0) {
    console.error(output.stdout, output.stderr);
    throw Error(`Falha no comando Wrangler: ${args.join(" ")}`);
  }
}
console.log("Preparando banco D1 local...");
run(["d1", "migrations", "apply", "projeto-turbo", "--local"]);
const code = makeCode();
const hash = createHmac("sha256", config.CODE_PEPPER).update(`access:${code}`).digest("hex");
run(["d1", "execute", "projeto-turbo", "--local",
  "--command", `INSERT OR IGNORE INTO access_codes (code_hash,note,issued_at) VALUES ('${hash}', 'teste local', ${Math.floor(Date.now() / 1000)});`]);
writeFileSync(".local-activation-code", code, { mode: 0o600 });
console.log("\nCONFIGURAÇÃO LOCAL CONCLUÍDA");
console.log("Código novo de ativação (uso único): " + format(code));
console.log("Código fixo de emergência (apenas conta de demonstração): " + format(config.EMERGENCY_ACCESS_CODE));
console.log("A chave do administrador permanece somente em .dev.vars.");
console.log("Inicie dois terminais: npm run dev:api e npm run dev");
