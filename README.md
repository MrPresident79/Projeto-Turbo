# Projeto Turbo — Academy

Plataforma web de educação automotiva, pensada para ser oferecida como presente digital exclusivo. **Primeira versão funcional (MVP), ainda não pronta para comercialização em produção.**

## O que já existe

- Ativação por código numérico individual de 12 dígitos (formato `0000 0000 0000`), validado no servidor; cada código só pode ser ativado uma vez.
- Códigos e chaves de recuperação armazenados como HMAC-SHA-256, usando um segredo fora do repositório.
- Sessão por cookie `HttpOnly` + `SameSite=Lax`; expiração de 60 dias e chave de recuperação separada para novos aparelhos.
- Proteção básica de tentativas por IP (8 falhas por 15 minutos) e verificação de origem para requisições POST.
- Nome do aluno, saudação apropriada ao horário com síntese de voz do navegador e controle de áudio.
- Dashboard responsivo, trilha progressiva de módulos em losangos, aulas com quiz de correção **no backend**, progresso persistido no Cloudflare D1.
- **15 módulos e 33 aulas introdutórias reais**, incluindo transmissão, combustão, motores JZ, turbo, drift, diagnóstico e engenharia.
- Laboratório de transmissão (cálculo cinemático), planejador conceitual de drift e glossário de termos técnicos.
- Área de sons preparada editorialmente; **não inclui áudios reais** até que suas licenças de uso comercial sejam verificadas.

O conteúdo atual é uma **trilha introdutória** de cada assunto, não uma enciclopédia completa e nem uma certificação profissional. Simuladores são didáticos; o site não substitui treinamento prático, inspeções ou profissionais.

## Arquitetura

- **React + TypeScript + Vite** no frontend (`src/`).
- **Cloudflare Worker** no backend (`worker/index.ts`), com APIs em `/api/`.
- **Cloudflare D1 / SQLite** para chaves, sessões, perfis, progressos e limites de tentativa (`migrations/`).
- Conteúdo das aulas **servido pelo Worker somente após login**, e não incluído no bundle do navegador.
- **Cloudflare Workers Static Assets**, configurado por `wrangler.jsonc`. Assets em `dist/`.

### Requisitos

Node.js 22+, npm, uma conta Cloudflare e acesso de configuração ao D1.

### Início rápido: cria backend local, banco e códigos automaticamente

```bash
npm install
npm run setup:local
```

**Este comando cria o banco D1 local, executa as migrações, gera segredos em `.dev.vars` e imprime dois códigos:**

- **Código individual**, que funciona uma única vez para testar o fluxo de compra/presente.
- **Código fixo de emergência**, reutilizável, que entra **somente** no perfil compartilhado "Piloto Demo". Ele não dá acesso a dados, progresso ou ferramentas administrativas de compradores.

O código de emergência **local** padrão é `7294-1835-6027` e é guardado em `.dev.vars`; só acessa a conta compartilhada de teste, jamais contas de compradores ou a administração. A **produção** gera automaticamente outro código aleatório mantido em segredo, sem código mestre público. O código permanece igual em execuções futuras do setup. Os códigos impressos no terminal devem ser guardados em local seguro e não publicados.

Inicie dois terminais:

```bash
npm run dev:api
```

```bash
npm run dev
```

Abra `http://localhost:5173` e digite qualquer um dos códigos impressos. **Para verificar o backend automaticamente:** `npm run smoke:local` (esse teste consome o código individual de teste e usa um D1 local).

O acesso de emergência depende de **Worker e D1 funcionando**; ele não é um substituto para backup do banco ou para solucionar uma indisponibilidade de servidor. O modo de demonstração só deve ser ativado publicamente quando você realmente quiser conceder acesso a um perfil de teste compartilhado.

### Desenvolvimento local

```bash
npm install
cp .dev.vars.example .dev.vars
```

Edite `.dev.vars` com **dois segredos aleatórios independentes de pelo menos 32 caracteres**:

```env
CODE_PEPPER=SEU_SEGREDO_ALEATORIO_GRANDE
ADMIN_API_TOKEN=OUTRO_SEGREDO_ALEATORIO_GRANDE
```

Nunca envie `.dev.vars` ao Git. Prepare o app e o banco:

```bash
npm run build
npm run db:local
```

Abra **dois terminais** na pasta do projeto:

```bash
npm run dev:api
```

```bash
npm run dev
```

Abra o URL do Vite (normalmente `http://localhost:5173`). O Vite encaminha `/api` ao Worker em `http://127.0.0.1:8787`. Se mudar a porta do Worker, atualize também o proxy em `vite.config.ts`.

### Gerar códigos para testes ou vendas futuras

A API administrativa **não funciona sem `ADMIN_API_TOKEN` configurado**. Execute somente no ambiente de sua confiança:

```bash
curl -X POST http://127.0.0.1:8787/api/admin/codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ADMIN_API_TOKEN" \
  -d '{"quantity":3,"note":"lote inicial"}'
```

Resposta: lista de novos códigos no formato `1234-5678-9012`. **Guarde-os imediatamente**: depois são recuperáveis apenas como hashes e não podem ser exibidos. O código presente é ativado uma única vez; ao ativá-lo, o usuário recebe uma chave de recuperação aleatória **exibida apenas nessa ocasião**.

A API administrativa é **somente para operador**. Nunca coloque o token no frontend, em anúncios, links ou ferramentas de analytics.

### Publicação na Cloudflare

1. Crie o D1: `npx wrangler d1 create projeto-turbo`.
2. Substitua o `database_id` provisório em `wrangler.jsonc` pelo ID retornado.
3. Configure segredos separados no Worker publicado:
   ```bash
   npx wrangler secret put CODE_PEPPER
   npx wrangler secret put ADMIN_API_TOKEN
  npx wrangler secret put EMERGENCY_ACCESS_CODE
   ```
   Os segredos de produção devem ser mantidos de forma segura. **Perder `CODE_PEPPER` invalida os códigos existentes e as chaves de recuperação.**
4. Execute `npm run db:remote`.
5. Execute `npm run deploy` (requer autenticação Cloudflare).
6. Gere códigos de produção pela rota administrativa HTTPS, sem divulgar o token.

**Não existe integração com checkout nesta versão**. Para vendas reais ainda é preciso vincular confirmação de pagamento e emissão segura do código, implementar recuperação assistida com verificação de titularidade, monitoramento, proteção antiabuso na borda (WAF/Turnstile), termos/LGPD e backup/rotinas operacionais.

### APIs

| Método | Rota | Função |
|---|---|---|
| GET | `/api/health` | Estado do servidor e da configuração |
| POST | `/api/admin/codes` | Gerar 1–50 códigos, autenticando por Bearer no servidor |
| POST | `/api/activate` | Ativar código uma única vez e receber chave de recuperação |
| POST | `/api/recover` | Recuperar sessão com chave de 32 caracteres hexadecimais |
| GET | `/api/me` | Consultar aluno autenticado |
| POST | `/api/profile` | Salvar primeiro nome |
| POST | `/api/logout` | Encerrar sessão atual |
| GET | `/api/catalog` | Módulos, aulas e progresso autenticado |
| GET | `/api/lesson/:id` | Conteúdo da aula desbloqueada |
| POST | `/api/complete` | Validar resposta e concluir aula |
| GET | `/api/glossary` | Glossário autenticado |

### Conteúdo e próximos passos

As aulas ficam em `worker/curriculum.ts`; novos módulos podem ser adicionados com IDs estáveis (não altere os IDs de aulas já concluídas). O progresso é derivado dos IDs de aulas concluídas, gravados no banco. **A versão atual contém apenas duas a três aulas por assunto**; para transformar em curso completo, expandir a biblioteca e revisar editorialmente o conteúdo com especialistas.

Prioridades seguintes: acervo de áudio comercialmente licenciado com atribuições documentadas, imagens e diagramas técnicos autorizados, novos laboratórios, certificados verificáveis, painel seguro para compradores/presentes, checkout, painel operacional e testes de ponta a ponta em navegador.

### Qualidade

```bash
npm run check
npm test
npm run build
```

O GitHub Actions executa instalação, testes de TypeScript, build e um teste real da API com banco local, incluindo ativação única, login de demonstração, isolamento de conta e salvamento de progresso. Isso não substitui testes operacionais com banco D1, sessões e navegadores reais.

## Segurança e direitos

Áudios e vídeos de YouTube/MyInstants não estão automaticamente liberados para redistribuição comercial. O aplicativo não publica gravações sem autorização/licença. Conteúdo sobre drift é teórico e destinado a ambiente controlado; modificações mecânicas requerem inspeção especializada.

## Publicação assistida em uma única etapa

Se você tem uma conta Cloudflare autenticada no computador, o projeto agora oferece um comando de implantação que cria um **novo banco D1**, aplica migrações, gera segredos independentes de produção, envia o Worker, e gera um código comercial real e um **código fixo de demonstração**:

```bash
npm install
npx wrangler login
npm run setup:cloud
```

O comando imprime os dois códigos e o endereço da publicação. **Os dois códigos só funcionam após a implantação ter sido concluída na sua conta.** O código de emergência é reutilizável, mas acessa exclusivamente a conta compartilhada "Piloto Demo"; não concede acesso de administrador ou de clientes. Para o proprietário emitir mais códigos, existe `POST /api/admin/codes` protegido pelo token de administração guardado em `.prod.secrets.json`.

Os arquivos `.prod.secrets.json` e `.prod-activation-code` são excluídos do Git. Faça backup dos segredos em um cofre. Se um banco remoto já existir e os segredos originais não estiverem presentes, o script interrompe a operação para evitar perder o acesso dos usuários.

**O GitHub conectado ao chat não fornece acesso autenticado à Cloudflare:** este comando precisa rodar em um ambiente onde o titular da conta tenha autorizado a Cloudflare. Não coloque tokens ou senhas em mensagens públicas, commits ou capturas de tela.

## Limitação de publicação

O repositório está completo para execução local, mas **a publicação real depende de acesso à sua conta Cloudflare**. Sem acesso à conta não é possível criar o banco D1 remoto, definir secrets no Worker ou disponibilizar um URL real de produção. Não há senha ou código remoto ativo enquanto o backend não estiver implantado. Para produção, o código de emergência deve ser definido como segredo **diferente** do usado em ambiente local e deve abrir somente a conta de demonstração.

## Correção da tela branca e do HTTP 404 no Cloudflare Pages

**Não abra o `index.html` do Vite pelo Explorador de Arquivos.** Ele requer compilação. A partir desta versão, o `index.html` da raiz redireciona para **`demo/index.html`** quando aberto via `file://`. É uma prévia **autossuficiente**, com 15 módulos, 33 aulas, código de demonstração `7294-1835-6027`, laboratório, questionários e progresso **local**. Nenhuma instalação é necessária para demonstrar o visual.

Para fazer upload manual da prévia estática ao Cloudflare Pages, compacte **somente o conteúdo da pasta `demo/`**, deixando o arquivo `index.html` na raiz do ZIP. Não envie o repositório GitHub inteiro como ZIP para Direct Upload.

Para **publicar a aplicação comercial com backend real usando Git Integration** em um projeto Cloudflare Pages:

1. Em **Workers & Pages**, crie (ou abra) um projeto **Pages** conectado a este GitHub, branch `main`.
2. Em **Build settings**, configure **Framework = React (Vite)**, **Build command = `npm run build`**, **Output directory = `dist`**, diretório raiz = `/`. O Pages precisa publicar o conteúdo gerado em `dist`, não o repositório.
3. Crie um banco D1 com nome `projeto-turbo` na conta Cloudflare e aplique as migrações de `migrations/0001_initial.sql` pelo console D1 ou Wrangler.
4. Em **Pages project → Settings → Bindings**, associe o D1 à variável `DB`. O projeto inclui **`functions/api/[[path]].ts`** para servir `/api/*` com o mesmo backend usado em Workers.
5. Em **Settings → Variables and Secrets**, configure `CODE_PEPPER` e `ADMIN_API_TOKEN`, como segredos aleatórios diferentes, cada um com pelo menos 32 caracteres. Configure `EMERGENCY_ACCESS_CODE` (12 números) **opcionalmente**, apenas para a conta demo; **nunca use na produção o código público da prévia**. Se esses segredos forem rotacionados sem planejamento, os códigos/chaves de recuperação existentes podem parar de funcionar.
6. Faça **Redeploy** após adicionar os bindings e segredos. Confirme `https://SEU-DOMINIO.pages.dev/api/health`: deve retornar `status: ok`, `database: true`, `configured: true`.
7. Gere os **códigos comerciais** pelo endpoint de administração `POST /api/admin/codes` com token Bearer `ADMIN_API_TOKEN` (não publique nem coloque o token no frontend), e depois teste uma ativação real na sua URL.

**Importante:** o código `7294-1835-6027` é apenas da prévia independente e do teste local. Não foi criado nenhum código de ativação de produção em seu Cloudflare Pages, pois é preciso autenticação no seu painel. A versão estática é adequada a teste visual, mas não protege o conteúdo como um produto pago e não substitui o login do servidor.

A configuração `wrangler.jsonc` da raiz continua direcionada ao **Worker standalone**. No Pages a aplicação pode usar os bindings configurados no dashboard. Para atualizar o site **sem compilar localmente**, use a integração Git do Cloudflare Pages com as configurações acima. Se houver HTTP 404 após isso, verifique o histórico de deploy do projeto no painel e confirme que `dist/index.html` foi publicado.

