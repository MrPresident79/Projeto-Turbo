import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, Award, BookOpen, Check, ChevronRight, Clock3, Copy, Gauge, Headphones, KeyRound, LockKeyhole, LogOut, Menu, Search, Settings2, ShieldAlert, ShieldCheck, Sparkles, Volume2, VolumeX, Wrench, X, Zap } from "lucide-react";
import { api, ApiError, type Catalog, type GlossaryEntry, type LearningModule, type Lesson, type LessonSummary, type Profile } from "./api";
import { formatAccessCode, greeting, greetingTitle, speak } from "./utils";
import Laboratory from "./Laboratory";
type Page = "dashboard" | "welcome" | "module" | "lesson" | "laboratory" | "audio" | "glossary" | "account";
const failure = (error: unknown) => error instanceof Error ? error.message : "Ocorreu um problema inesperado.";
function Logo() { return <div className="logo"><span className="logo-symbol"><svg viewBox="0 0 44 44" fill="none"><path d="M22 3 41 22 22 41 3 22Z" stroke="currentColor" strokeWidth="1.8"/><path d="m12 29 10-17 10 17M17 25h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="logo-title">TURBO<b>.</b><small>ESTÚDIO AUTOMOTIVO</small></span></div>; }
function Tag({ children }: { children: ReactNode }) { return <div className="tag"><i/>{children}</div>; }
function Head({ label, title, info }: {label:string;title:string;info?:ReactNode}) {return <div className="section-head"><div><Tag>{label}</Tag><h2>{title}</h2></div>{info}</div>;}
function Ring({ value }: { value: number }) { return <div className="ring" style={{ background: `conic-gradient(#269ff4 ${value}%, rgba(255,255,255,.09) 0)` }}><div><strong>{value}%</strong><span>CONCLUÍDO</span></div></div>; }

export default function App() {
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [user,setUser] = useState<Profile|null>(null);
  const [page,setPage] = useState<Page>("dashboard");
  const [mode,setMode] = useState<"activate"|"recover">("activate");
  const [code,setCode] = useState("");
  const [recovery,setRecovery] = useState("");
  const [recoveryIssued,setRecoveryIssued] = useState("");
  const [name,setName] = useState("");
  const [catalog,setCatalog] = useState<Catalog|null>(null);
  const [course,setCourse] = useState<LearningModule|null>(null);
  const [lesson,setLesson] = useState<Lesson|null>(null);
  const [answer,setAnswer] = useState<number|null>(null);
  const [feedback,setFeedback] = useState<{correct:boolean;explanation:string}|null>(null);
  const [terms,setTerms] = useState<GlossaryEntry[]>([]);
  const [search,setSearch] = useState("");
  const [drawer,setDrawer] = useState(false);
  const [voice,setVoice] = useState(false);
  async function refresh() { const value = await api<Catalog>("/api/catalog");setCatalog(value);return value; }
  useEffect(()=> {
    let alive=true;
    api<{user:Profile}>("/api/me").then(async ({user})=>{
      if(!alive)return;
      setUser(user);setName(user.name||"");setPage(user.name?"dashboard":"welcome");
      if(user.name){const value=await api<Catalog>("/api/catalog");if(alive)setCatalog(value);}
    }).catch(e=>{if(alive&&!(e instanceof ApiError&&e.status===401))setNotice(failure(e));}).finally(()=>{if(alive)setLoading(false);});
    return ()=>{alive=false;};
  },[]);
  function go(next:Page){setPage(next);setError("");setDrawer(false);window.scrollTo({top:0,behavior:"smooth"});if(next==="glossary"&&!terms.length)api<{terms:GlossaryEntry[]}>("/api/glossary").then(r=>setTerms(r.terms)).catch(e=>setError(failure(e)));}
  async function activate(e:FormEvent){
    e.preventDefault();setBusy(true);setError("");
    try {
      if(mode==="activate"){const r=await api<{user:Profile;recoveryCode:string}>("/api/activate",{code});setUser(r.user);setRecoveryIssued(r.recoveryCode);setPage("welcome");}
      else {const r=await api<{user:Profile}>("/api/recover",{recoveryCode:recovery});setUser(r.user);setName(r.user.name||"");setPage(r.user.name?"dashboard":"welcome");if(r.user.name)await refresh();}
    }catch(err){setError(failure(err));}finally{setBusy(false);}
  }
  async function saveName(e:FormEvent){
    e.preventDefault();setBusy(true);setError("");
    try{const r=await api<{user:Profile}>("/api/profile",{name});setUser(r.user);await refresh();setPage("dashboard");}
    catch(err){setError(failure(err));}finally{setBusy(false);}
  }
  function openCourse(m:LearningModule){if(m.unlocked){setCourse(m);go("module");}}
  async function openLesson(item:LessonSummary){
    if(!item.unlocked)return;setBusy(true);setError("");
    try{const r=await api<{lesson:Lesson}>(`/api/lesson/${encodeURIComponent(item.id)}`);setLesson(r.lesson);setAnswer(null);setFeedback(null);go("lesson");}
    catch(err){setError(failure(err));}finally{setBusy(false);}
  }
  async function complete(){
    if(!lesson||answer===null)return;setBusy(true);setError("");
    try{const r=await api<{correct:boolean;explanation:string;catalog:Catalog}>("/api/complete",{lessonId:lesson.id,answer});setFeedback(r);if(r.correct){setCatalog(r.catalog);const updated=r.catalog.modules.find(m=>m.id===course?.id);if(updated)setCourse(updated);}}
    catch(err){setError(failure(err));}finally{setBusy(false);}
  }
  async function logout(){
    setBusy(true);try{await api("/api/logout",{},"POST");}catch{}
    setUser(null);setCode("");setCatalog(null);setCourse(null);setLesson(null);setRecoveryIssued("");setMode("activate");setBusy(false);if("speechSynthesis"in window)window.speechSynthesis.cancel();
  }
  function toggleVoice(){
    const next=!voice;setVoice(next);localStorage.setItem("turbo.voice",next?"on":"off");
    if(!next&&"speechSynthesis"in window)window.speechSynthesis.cancel();
    if(next&&user?.name)speak(greeting(user.name,new Date().getHours()));
  }
  const activeCourse=catalog?.modules.find(m=>m.id===course?.id)||course;
  const nextLesson=catalog?.modules.flatMap(m=>m.lessons).find(l=>l.unlocked&&!l.completed);
  const nextCourse=catalog?.modules.find(m=>m.lessons.some(l=>l.id===nextLesson?.id));
  const visibleTerms=useMemo(()=>terms.filter(t=>`${t.term} ${t.definition}`.toLowerCase().includes(search.toLowerCase())),[terms,search]);
  if(loading)return <div className="splash"><Logo/><div className="splash-line"/><span>INICIALIZANDO SISTEMA</span></div>;
  if(!user)return <div className="public">
    <header className="public-header"><Logo/><span>ACESSO EXCLUSIVO POR CONVITE <i className="status-dot"/></span></header>
    <main className="activation">
      <div className="activation-copy"><Tag>UM CONVITE À CULTURA AUTOMOTIVA</Tag><h1>Aprenda a<br/><em>linguagem</em><br/>dos carros<span>.</span></h1><p>Uma coleção de descobertas para quem quer entender a engenharia, a mecânica e os sistemas por trás dos automóveis.</p><div className="intro-stats"><div><strong>15</strong><small>ETAPAS</small></div><div><strong>33</strong><small>AULAS INICIAIS</small></div><div><strong>01</strong><small>JORNADA</small></div></div><div className="orbital-art" aria-hidden="true"><span>01</span><small>IGNITION SYSTEM</small></div></div>
      <section className="activation-card"><div className="card-corner"><LockKeyhole size={19}/></div><span className="serial">SEQUÊNCIA DE ACESSO / 001</span><span className="access-emblem"><KeyRound size={26}/></span><h2>{mode==="activate"?<>O início da<br/><em>sua coleção.</em></>:<>Bem-vindo<br/><em>de volta.</em></>}</h2><p>{mode==="activate"?"Seu presente abre uma coleção de conhecimento automotivo. Insira seu código para começar a explorar.":"Use sua chave de recuperação para continuar de onde parou."}</p>
        <form onSubmit={activate}><label htmlFor="access">{mode==="activate"?"CÓDIGO DE ATIVAÇÃO":"CHAVE DE RECUPERAÇÃO"}</label><input id="access" type="text" required autoComplete="off" inputMode={mode==="activate"?"numeric":"text"} maxLength={mode==="activate"?16:40} placeholder={mode==="activate"?"0000  0000  0000":"XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"} value={mode==="activate"?formatAccessCode(code):recovery} onChange={e=>mode==="activate"?setCode(e.target.value.replace(/\D/g,"").slice(0,12)):setRecovery(e.target.value)}/><div className="field-help"><span>{mode==="activate"?"12 DÍGITOS • USO ÚNICO":"CHAVE ENTREGUE NA PRIMEIRA ATIVAÇÃO"}</span><ShieldCheck size={16}/></div><button className="btn-primary" type="submit" disabled={busy||(mode==="activate"?code.length!==12:recovery.replace(/[^a-fA-F0-9]/g,"").length!==32)}>{busy?"VALIDANDO...":mode==="activate"?"ACESSAR MINHA COLEÇÃO":"RECUPERAR MINHA GARAGEM"}<ArrowUpRight size={19}/></button></form>
        {error&&<div className="alert error" role="alert"><ShieldAlert size={17}/>{error}</div>}{notice&&<div className="alert"><ShieldAlert size={17}/>{notice}</div>}
        <button className="swap-mode" onClick={()=>{setMode(mode==="activate"?"recover":"activate");setError("");}}>{mode==="activate"?"Já ativou? Entrar com sua chave de recuperação":"Tenho um novo código para ativar"}<ArrowRight size={16}/></button>
      </section>
    </main><footer className="public-footer"><span>© PROJETO TURBO · A EXPERIÊNCIA COMEÇA AQUI</span><span>CONHECER. ENTENDER. EVOLUIR.</span></footer>
  </div>;
  if(page==="welcome"||!user.name)return <div className="public">
    <header className="public-header"><Logo/><span>SEU NOVO CAPÍTULO COMEÇA AGORA</span></header>
    <main className="activation"><div className="activation-copy"><Tag>ACESSO LIBERADO</Tag><h1>UMA PAIXÃO.<br/><em>INFINITAS</em><br/>DESCOBERTAS.</h1><p>Seu acesso está pronto. Antes de ligar os motores, queremos saber como chamar você.</p></div><section className="activation-card welcome-card"><span className="serial">01 — SUA IDENTIDADE</span><span className="access-emblem"><Sparkles size={25}/></span><h2>Como podemos<br/>chamar você?</h2><form onSubmit={saveName}><label htmlFor="student-name">SEU PRIMEIRO NOME</label><input id="student-name" maxLength={40} required value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: João"/><button type="submit" className="btn-primary" disabled={busy||!name.trim()}>ENTRAR NA GARAGEM <ArrowRight size={19}/></button></form>{recoveryIssued&&<div className="recovery-panel"><strong><ShieldCheck size={17}/> GUARDE SUA CHAVE DE RECUPERAÇÃO</strong><p>Seu código presente só funciona uma vez. Guarde esta chave para entrar em outro dispositivo.</p><div className="recovery-key"><code>{recoveryIssued}</code><button aria-label="Copiar chave" onClick={()=>void navigator.clipboard.writeText(recoveryIssued).catch(()=>setError("Copie a chave manualmente."))}><Copy size={17}/></button></div><small>Ela não poderá ser exibida novamente.</small></div>}{error&&<div className="alert error" role="alert">{error}</div>}</section></main>
  </div>;
  return <div className="shell">
    {drawer&&<button className="drawer-mask" onClick={()=>setDrawer(false)} aria-label="Fechar menu"/>}
    <aside className={`sidebar ${drawer?"show":""}`}>
      <div className="sidebar-top"><Logo/><button className="close-menu" onClick={()=>setDrawer(false)}><X size={21}/></button></div>
      <span className="sidebar-caption">CENTRAL DE CONHECIMENTO</span>
      <nav aria-label="Navegação principal">{([["dashboard",Gauge,"Visão geral"],["laboratory",Settings2,"Laboratório"],["audio",Headphones,"Sons & motores"],["glossary",BookOpen,"Dicionário"]] as const).map(([dest,Icon,label])=><button key={dest} onClick={()=>go(dest)} className={`nav-item ${page===dest||(dest==="dashboard"&&(page==="module"||page==="lesson"))?"selected":""}`}><Icon size={19}/>{label}<ChevronRight size={15}/></button>)}</nav>
      <div className="sidebar-progress"><div><span>SEU PERCURSO</span><strong>{catalog?.completedLessons||0}/{catalog?.totalLessons||33}</strong></div><div className="meter"><i style={{width:`${catalog?.percentage||0}%`}}/></div></div><div className="sidebar-fill"/>
      <div className="sidebar-quote"><Tag>UMA IDEIA PARA LEVAR</Tag><p>O que move um carro começa bem antes do acelerador.</p></div>
      <button className="sidebar-profile" onClick={()=>go("account")}><span className="avatar">{user.name.charAt(0).toUpperCase()}</span><span><strong>{user.name}</strong><small>LEITOR DA COLEÇÃO</small></span><ChevronRight size={16}/></button>
    </aside>
    <main className="workspace"><header className="toolbar"><button className="open-menu" aria-label="Abrir menu" onClick={()=>setDrawer(true)}><Menu size={22}/></button><div className="breadcrumb">PROJETO TURBO <ChevronRight size={14}/><strong>{page==="dashboard"?"Central":page==="module"?activeCourse?.title:page==="lesson"?lesson?.title:page==="laboratory"?"Laboratório":page==="audio"?"Acervo sonoro":page==="glossary"?"Dicionário":"Minha conta"}</strong></div><div className="toolbar-end"><span className="toolbar-online"><i/> SISTEMA ONLINE</span><button className="toolbar-btn" onClick={toggleVoice} aria-label={voice?"Silenciar voz":"Ativar voz"}>{voice?<Volume2 size={19}/>:<VolumeX size={19}/>}</button><span className="avatar small">{user.name.charAt(0).toUpperCase()}</span></div></header>
      {error&&<div className="global-error" role="alert"><ShieldAlert size={18}/>{error}<button onClick={()=>setError("")}><X size={17}/></button></div>}
      <div className="content">
      {page==="dashboard"&&<div className="fade-in"><div className="page-meta"><span>PAINEL DE CONTROLE</span><span>EXPERIÊNCIA 001 / TURBO</span></div>
        <section className="dash-hero"><div className="dash-copy"><Tag>ESTE É O SEU PONTO DE PARTIDA</Tag><h1>{greetingTitle(new Date().getHours())}, {user.name.split(" ")[0]}.<br/>Conheça o carro.<br/><em>Entenda a máquina.</em></h1><p>Um capítulo de cada vez. Da primeira marcha aos motores que marcaram a história.</p><div className="hero-actions">{nextLesson?<button className="btn-primary fit" onClick={()=>{if(nextCourse)setCourse(nextCourse);void openLesson(nextLesson);}}>RETOMAR MINHA LEITURA <ArrowUpRight size={18}/></button>:<span><Award size={20}/> Trilha inicial concluída</span>}<button className="btn-outline" onClick={()=>document.querySelector(".journey")?.scrollIntoView({behavior:"smooth"})}>EXPLORAR CAPÍTULOS <ArrowRight size={17}/></button></div></div><div className="studio-cover" aria-hidden="true"><div className="studio-cover-label"><span>TURBO / STUDY</span><span>EDIÇÃO Nº 01</span></div><strong>01—15</strong><p>Mecânica, cultura e engenharia em uma coleção para entender.</p></div></section>
        <div className="stats"><div className="stat"><div className="stat-top">SEU PROGRESSO <Activity size={19}/></div><div className="stat-big">{catalog?.percentage||0}<small>%</small></div><div className="meter"><i style={{width:`${catalog?.percentage||0}%`}}/></div><small>SUA EVOLUÇÃO</small></div><div className="stat"><div className="stat-top">AULAS CONCLUÍDAS <Check size={19}/></div><div className="stat-big">{String(catalog?.completedLessons||0).padStart(2,"0")}<small> / {catalog?.totalLessons||33}</small></div><div className="stat-bottom">APRENDIZADO REAL <ArrowUpRight size={16}/></div></div><div className="stat"><div className="stat-top">CAPÍTULOS DISPONÍVEIS <Zap size={19}/></div><div className="stat-big">{String(catalog?.modules.filter(m=>m.unlocked).length||1).padStart(2,"0")}<small> / 15</small></div><div className="stat-bottom">CONTINUE AVANÇANDO <ArrowUpRight size={16}/></div></div><div className="stat ring-stat"><Ring value={catalog?.percentage||0}/><div><span>SEU RITMO</span><strong>Entender o porquê. Não só o como.</strong></div></div></div>
        <section className="journey"><Head label="UMA COLEÇÃO PARA EXPLORAR" title="Os capítulos" info={<span className="head-note">{catalog?.modules.length||15} MÓDULOS · {catalog?.totalLessons||33} AULAS</span>}/><p className="section-intro">Comece pelo essencial e avance quando estiver pronto. Seu conhecimento se constrói em capítulos.</p><div className="journey-list">{catalog?.modules.map((m,i)=><div className={`journey-row ${m.unlocked?"unlocked":"locked"}`} key={m.id}><div className="journey-node"><span className={`diamond ${m.progress===100?"complete":m.unlocked?"active":""}`}>{m.progress===100?<Check size={19}/>:m.unlocked?String(i+1).padStart(2,"0"):<LockKeyhole size={17}/>}</span>{i<catalog.modules.length-1&&<span className="connector"/>}</div><button className="journey-card" disabled={!m.unlocked} onClick={()=>openCourse(m)}><div className="journey-caption"><span>{m.eyebrow}</span><span>{m.progress===100?"CONCLUÍDO":m.unlocked?m.progress?"EM PROGRESSO":"LIBERADO":"BLOQUEADO"}</span></div><div className="journey-main"><div><h3>{m.title}</h3><p>{m.description}</p></div><div className="journey-side"><strong>{m.progress}%</strong><ArrowUpRight size={19}/></div></div><div className="journey-footer"><span>{m.completed} DE {m.total} AULAS</span><div className="meter"><i style={{width:`${m.progress}%`}}/></div><span>{m.category.toUpperCase()}</span></div></button></div>)}</div></section>
        <div className="feature-banner"><div className="feature-emblem"><Settings2 size={28}/></div><div><span>ALÉM DA TEORIA</span><h3>Experimente o laboratório automotivo.</h3><p>RPM, relações de marcha e escolhas de preparação interativas.</p></div><button className="btn-outline" onClick={()=>go("laboratory")}>ABRIR LABORATÓRIO <ArrowUpRight size={18}/></button></div>
      </div>}
      {page==="module"&&activeCourse&&<div className="fade-in"><button className="back" onClick={()=>go("dashboard")}><ArrowLeft size={17}/> VOLTAR AO MAPA</button><div className="module-hero"><div><Tag>{activeCourse.eyebrow}</Tag><h1>{activeCourse.title}<span>.</span></h1><p>{activeCourse.description}</p><div className="module-meta"><span><BookOpen size={15}/>{activeCourse.total} AULAS</span><span><Clock3 size={15}/>{activeCourse.lessons.reduce((n,l)=>n+l.minutes,0)} MINUTOS</span><span><Check size={15}/>{activeCourse.progress}% COMPLETO</span></div></div><div className="module-icon"><Gauge size={74} strokeWidth={1}/><small>ETAPA {String(activeCourse.index).padStart(2,"0")}</small></div></div><Head label="CONTEÚDO DO MÓDULO" title="Sua próxima descoberta" info={<span className="head-note">{activeCourse.completed}/{activeCourse.total} CONCLUÍDAS</span>}/><div className="lessons">{activeCourse.lessons.map((l,i)=><button className="lesson-row" disabled={!l.unlocked||busy} key={l.id} onClick={()=>void openLesson(l)}><span className="lesson-index">{String(i+1).padStart(2,"0")}</span><span className="lesson-info"><strong>{l.title}</strong><small><Clock3 size={13}/>{l.minutes} MIN • {l.completed?"CONCLUÍDA":l.unlocked?"DISPONÍVEL":"BLOQUEADA"}</small></span>{l.completed?<Check size={21}/>:l.unlocked?<ArrowUpRight size={21}/>:<LockKeyhole size={19}/>}</button>)}</div><div className="tip"><ShieldCheck size={20}/> Conclua a verificação de cada aula para desbloquear a próxima.</div></div>}
      {page==="lesson"&&lesson&&<div className="fade-in"><button className="back" onClick={()=>go("module")}><ArrowLeft size={17}/> VOLTAR AO MÓDULO</button><header className="reading-hero"><Tag>AULA EXCLUSIVA / PROJETO TURBO</Tag><h1>{lesson.title}<span>.</span></h1><p>{lesson.lead}</p><div className="reading-meta"><span><Clock3 size={15}/>{lesson.minutes} MIN DE LEITURA</span><span><ShieldCheck size={15}/> CONTEÚDO EDUCACIONAL</span></div></header><div className="reading-grid"><article className="article"><section className="article-intro"><span>01 / INTRODUÇÃO</span><h3>Conhecimento que faz diferença.</h3><p>Leia os conceitos e valide o que aprendeu no exercício ao final.</p></section>{lesson.sections.map((section,i)=><section className="article-section" key={i}><span>{String(i+2).padStart(2,"0")} / FUNDAMENTO</span><h2>{section.title}</h2><p>{section.text}</p></section>)}<div className="quiz"><span className="quiz-tag"><BookOpen size={16}/> VERIFICAÇÃO DE CONHECIMENTO</span><h2>Hora de colocar à prova.</h2><p>{lesson.question.prompt}</p><div className="answers">{lesson.question.options.map((option,i)=><button key={i} className={answer===i?"chosen":""} disabled={Boolean(feedback?.correct)} onClick={()=>{setAnswer(i);setFeedback(null);}}><b>{String.fromCharCode(65+i)}</b>{option}<span>{answer===i?"●":""}</span></button>)}</div>{feedback&&<div className={`feedback ${feedback.correct?"correct":"wrong"}`} role="status"><strong>{feedback.correct?"EXCELENTE! AULA CONCLUÍDA.":"REVEJA O RACIOCÍNIO:"}</strong><p>{feedback.explanation}</p></div>}<div className="quiz-end"><button className="btn-primary fit" disabled={!feedback?.correct&&(answer===null||busy)} onClick={()=>feedback?.correct?go("module"):void complete()}>{feedback?.correct?"CONTINUAR EVOLUINDO":busy?"VERIFICANDO...":feedback?"TENTAR NOVAMENTE":"VERIFICAR RESPOSTA"}<ArrowRight size={18}/></button><span>APRENDA, NÃO DECORE.</span></div></div></article><aside className="reading-aside"><span>SEU MAPA</span><h3>Compreender.<br/>Experimentar.<br/>Dominar.</h3><p>Seu progresso é registrado depois de validar a resposta correta.</p></aside></div></div>}
      {page==="laboratory"&&<Laboratory/>}
      {page==="audio"&&<div className="fade-in"><div className="page-meta"><span>EXPERIÊNCIA DE ACÚSTICA</span><span>ACERVO EM CONSTRUÇÃO</span></div><div className="standard-hero"><Tag>SONS QUE CONTAM HISTÓRIAS</Tag><h1>Escute o que<br/><em>a engenharia produz.</em></h1><p>O áudio pode revelar características de um motor, mas não garante identificar um modelo com certeza.</p></div><div className="audio-notice"><Headphones size={38}/><div><span>ACERVO DE GRAVAÇÕES</span><h2>Biblioteca licenciada em preparação.</h2><p>Nenhum áudio real está publicado nesta versão. Cada gravação será identificada por fonte e licença.</p></div><small>AGUARDANDO LICENÇAS</small></div><Head label="ANTES DE APERTAR PLAY" title="O que devemos escutar?"/><div className="audio-grid">{[["Turbo","O compressor, o fluxo de admissão e o alívio de pressão."],["Supercharger","Ruído de acionamento e relação com a rotação."],["Família JZ","Comparações com contexto de RPM e preparação."],["Sons de falhas","Ruídos suspeitos não substituem diagnóstico técnico."]].map(([t,d])=><div className="audio-card" key={t}><Headphones size={24}/><span>FUTURO REGISTRO</span><h3>{t}</h3><p>{d}</p><small>ÁUDIO AINDA NÃO DISPONÍVEL</small></div>)}</div><div className="tip"><ShieldCheck size={20}/> Só serão publicados áudios com direitos de uso comercial verificados.</div></div>}
      {page==="glossary"&&<div className="fade-in"><div className="page-meta"><span>BIBLIOTECA TÉCNICA</span><span>DICIONÁRIO AUTOMOTIVO</span></div><div className="standard-hero"><Tag>O IDIOMA DOS MOTORES</Tag><h1>Conhecimento<br/><em>em cada detalhe.</em></h1><p>Termos essenciais das pistas, oficinas e da engenharia.</p></div><label className="search-box"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Busque: RPM, turbo, diferencial..."/><span>{visibleTerms.length} TERMOS</span></label><div className="glossary-grid">{visibleTerms.map(t=><div className="term-card" key={t.term}><span>TERMO TÉCNICO</span><h3>{t.term}</h3><p>{t.definition}</p></div>)}</div></div>}
      {page==="account"&&<div className="fade-in"><div className="page-meta"><span>CONFIGURAÇÕES</span><span>ACESSO EXCLUSIVO</span></div><div className="standard-hero"><Tag>SUA GARAGEM DIGITAL</Tag><h1>Feito para<br/><em>{user.name}.</em></h1><p>Seu progresso fica vinculado à conta, não só a este dispositivo.</p></div><div className="account-hero"><span className="avatar giant">{user.name.charAt(0).toUpperCase()}</span><div><small>PERFIL DO ALUNO</small><h2>{user.name}</h2><p>MEMBRO EXCLUSIVO • PROJETO TURBO</p></div><Ring value={catalog?.percentage||0}/></div><div className="account-options"><div><Volume2 size={23}/><span><strong>Saudação por voz</strong><small>Áudio disponível após interação permitida pelo navegador.</small></span><button className={`toggle ${voice?"on":""}`} onClick={toggleVoice} aria-label="Alternar saudação"><i/></button></div><div><ShieldCheck size={23}/><span><strong>Proteção da conta</strong><small>Guarde a chave de recuperação recebida na primeira ativação.</small></span></div><div><LogOut size={23}/><span><strong>Sair deste dispositivo</strong><small>Seu progresso permanece salvo com segurança.</small></span><button className="btn-outline" disabled={busy} onClick={()=>void logout()}>SAIR <ArrowRight size={17}/></button></div></div></div>}
      </div><footer className="workspace-footer"><span>PROJETO TURBO © 2026</span><span>EVOLUÇÃO SEM ATALHOS. CONHECIMENTO DE VERDADE.</span></footer>
    </main>
  </div>;
}
