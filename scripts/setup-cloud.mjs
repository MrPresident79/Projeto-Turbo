import { createHmac, randomBytes, randomInt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const configPath = "wrangler.jsonc";
const secretPath = ".prod.secrets.json";
const activationPath = ".prod-activation-code";
const config = JSON.parse(readFileSync(configPath, "utf8"));
const db = config.d1_databases?.[0];
if (!db?.database_name || !db.binding) throw Error("D1 não configurado em wrangler.jsonc.");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const code = () => Array.from({length:12}, () => String(randomInt(10))).join("");
const format = (value) => value.match(/.{4}/g).join("-");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(executable,args,display=true) {
  const result = spawnSync(executable,args,{encoding:"utf8",stdio:"pipe"});
  if (result.error || result.status !== 0) {
    console.error(result.stderr || result.stdout || result.error);
    throw Error(`Comando falhou: ${executable} ${args.join(" ")}`);
  }
  if(display && result.stdout) console.log(result.stdout.trim());
  return result.stdout.trim();
}
function wrangler(args,display=true) { return run(npx,["wrangler",...args],display); }
function listD1() {
  const output = JSON.parse(wrangler(["d1","list","--json"],false));
  return Array.isArray(output) ? output : output.result || output.results || [];
}
function getId(item) { return item.uuid || item.database_id || item.id; }

console.log("Verificando sessão autenticada na Cloudflare...");
wrangler(["whoami"], false);
const matches = listD1().filter(item => item.name === db.database_name);
if (matches.length > 1) throw Error("Há mais de um banco com este nome na conta; não será escolhido um automaticamente.");
let id = db.database_id;
let newlyCreated = false;
if (!uuid.test(id) || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(id)) {
  if (matches.length === 1) {
    id = getId(matches[0]);
    if (!existsSync(secretPath)) throw Error("Banco remoto já existe. Para não substituir segredos de clientes, recupere .prod.secrets.json original antes de continuar.");
  } else {
    console.log("Criando novo banco Cloudflare D1...");
    wrangler(["d1","create",db.database_name,"--json"],false);
    const created = listD1().find(item => item.name === db.database_name);
    if (!created) throw Error("Banco criado mas não foi possível consultar o identificador; confira o painel Cloudflare.");
    id = getId(created);
    newlyCreated = true;
  }
  if (!uuid.test(id)) throw Error("A Cloudflare não retornou um identificador válido para o D1.");
  db.database_id = id;
  writeFileSync(configPath,JSON.stringify(config,null,2)+"\n");
}
if (!existsSync(secretPath) && !newlyCreated) throw Error("Segredos de produção não encontrados. Operação interrompida para impedir a rotação do segredo de compradores.");
if (!existsSync(secretPath)) {
  const values = {
    CODE_PEPPER: randomBytes(48).toString("hex"),
    ADMIN_API_TOKEN: randomBytes(48).toString("hex"),
    EMERGENCY_ACCESS_CODE: code()
  };
  writeFileSync(secretPath,JSON.stringify(values,null,2)+"\n",{mode:0o600});
}
const secrets = JSON.parse(readFileSync(secretPath,"utf8"));
if (secrets.CODE_PEPPER?.length < 32 || secrets.ADMIN_API_TOKEN?.length < 32 || !/^\d{12}$/.test(secrets.EMERGENCY_ACCESS_CODE)) {
  throw Error("Segredos de produção inválidos.");
}
console.log("Aplicando migrações remotas ao D1...");
wrangler(["d1","migrations","apply",db.database_name,"--remote"]);
console.log("Gerando frontend e verificando tipos...");
run(npm,["run","build"],false);
console.log("Publicando Worker com segredos protegidos...");
wrangler(["deploy","--secrets-file",secretPath]);
const gift = code();
const hash = createHmac("sha256",secrets.CODE_PEPPER).update(`access:${gift}`).digest("hex");
wrangler(["d1","execute",db.database_name,"--remote","--yes","--command",
  `INSERT OR IGNORE INTO access_codes (code_hash,note,issued_at) VALUES ('${hash}', 'primeiro acesso produção', ${Math.floor(Date.now()/1000)});`],false);
writeFileSync(activationPath,gift+"\n",{mode:0o600});
console.log("\nPUBLICAÇÃO CONCLUÍDA");
console.log("Código real de ativação, uso único: " + format(gift));
console.log("Código FIXO de emergência, somente demo: " + format(secrets.EMERGENCY_ACCESS_CODE));
console.log("Os segredos ficam em .prod.secrets.json, fora do Git.");
console.log("Guarde esses arquivos em local seguro e faça backup: perdê-los pode impedir o acesso de compradores.");
console.log("Verifique o endereço do Worker acima e teste a ativação.");
