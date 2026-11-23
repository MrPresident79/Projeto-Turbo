import { useState } from "react";
import { ArrowUpRight, Gauge, Settings2, ShieldCheck, Wrench } from "lucide-react";
import { theoreticalSpeed } from "./utils";

const gearRatios = [3.6, 2.19, 1.41, 1, 0.83];
export default function Laboratory() {
  const [rpm,setRpm] = useState(3500);
  const [gear,setGear] = useState(3);
  const [finalDrive,setFinalDrive] = useState(3.9);
  const [diameter,setDiameter] = useState(0.63);
  const [traction,setTraction] = useState("RWD");
  const [priority,setPriority] = useState("safety");
  const speed=theoreticalSpeed(rpm,gearRatios[gear-1],finalDrive,diameter);
  const result=traction==="RWD"&&priority==="safety"?"BASE COERENTE":traction==="RWD"?"REVEJA AS PRIORIDADES":"ESTUDE OUTRAS PLATAFORMAS";
  return <div className="fade-in">
    <div className="page-meta"><span>APRENDA EXPERIMENTANDO</span><span>LABORATÓRIO / MODELOS DIDÁTICOS</span></div>
    <div className="standard-hero"><div className="tag"><i/>EXPERIMENTAÇÃO INTERATIVA</div><h1>Entender é<br/><em>experimentar.</em></h1><p>Altere as variáveis e veja o efeito nos números. Uma experiência para aprender, não para substituir testes reais.</p></div>
    <div className="lab-panel"><div className="lab-top"><div><span>EXPERIÊNCIA 001</span><h2>Simulador de transmissão</h2><p>Cálculo cinemático ideal, sem patinação, perdas ou resistência aerodinâmica.</p></div><small><Settings2 size={17}/> MODELO ATIVO</small></div>
      <div className="sim-grid"><div className="sim-controls">
        <div className="range-head"><span>ROTAÇÃO DO MOTOR</span><strong>{rpm.toLocaleString("pt-BR")} <small>RPM</small></strong></div>
        <input type="range" className="rpm-range" min={800} max={7000} step={100} value={rpm} onChange={e=>setRpm(Number(e.target.value))} aria-label="Rotação do motor"/>
        <div className="range-ends"><span>800 RPM</span><span>7.000 RPM</span></div>
        <label className="lab-label">MARCHA SELECIONADA</label><div className="gear-row">{gearRatios.map((ratio,index)=><button type="button" className={`gear ${gear===index+1?"active":""}`} key={index} onClick={()=>setGear(index+1)}>{index+1}<small>{ratio.toFixed(2)}:1</small></button>)}</div>
        <div className="sim-fields"><label>RELAÇÃO FINAL<select value={finalDrive} onChange={e=>setFinalDrive(Number(e.target.value))}><option value={3.3}>3,30:1</option><option value={3.9}>3,90:1</option><option value={4.3}>4,30:1</option></select></label><label>DIÂMETRO DO PNEU<select value={diameter} onChange={e=>setDiameter(Number(e.target.value))}><option value={0.59}>0,59 m</option><option value={0.63}>0,63 m</option><option value={0.68}>0,68 m</option></select></label></div>
      </div><div className="sim-display"><span>VELOCIDADE TEÓRICA</span><div className="speed-reading">{speed.toFixed(1)}<small>km/h</small></div><div className="speed-meter"><i style={{width:`${Math.min(speed/250*100,100)}%`}}/></div><div className="sim-reading-bottom"><span>MARCHA {gear}</span><span>RELAÇÃO {gearRatios[gear-1].toFixed(2)}:1</span></div><p>RPM ÷ (RELAÇÃO × DIFERENCIAL) × CIRCUNFERÊNCIA DO PNEU</p></div></div>
      <div className="lab-note"><ShieldCheck size={17}/> O resultado é apenas teórico: não informa velocidade alcançável nem constitui orientação para dirigir.</div>
    </div>
    <div className="lab-panel"><div className="lab-top"><div><span>EXPERIÊNCIA 002</span><h2>Planejador de drift</h2><p>Analise decisões iniciais de um projeto conceitual exclusivo para pista.</p></div><small><Wrench size={17}/> PROJETO CONCEITUAL</small></div>
      <div className="builder-grid"><div className="builder-field"><label>TIPO DE TRAÇÃO</label>{[["RWD","Traseira (RWD)"],["FWD","Dianteira (FWD)"],["AWD","Integral (AWD)"]].map(([id,title])=><button className={traction===id?"selected":""} key={id} onClick={()=>setTraction(id)}>{title}{traction===id&&<ArrowUpRight size={18}/>}</button>)}</div><div className="builder-field"><label>PRIMEIRA PRIORIDADE</label>{[["safety","Revisão, freios e segurança"],["power","Potência máxima primeiro"],["looks","Visual antes da mecânica"]].map(([id,title])=><button className={priority===id?"selected":""} key={id} onClick={()=>setPriority(id)}>{title}{priority===id&&<ArrowUpRight size={18}/>}</button>)}</div></div>
      <div className="builder-result"><div><Gauge size={23}/><span>ANÁLISE DO PROJETO</span></div><h3>{result}</h3><p>{traction!=="RWD"?"Para drift tradicional, tração traseira é a arquitetura mais comum para controlar o deslizamento pelo acelerador. Outras configurações exigem técnicas e projetos diferentes.":priority!=="safety"?"A base é comum em drift, mas segurança, freios e revisão mecânica devem vir antes de ganhos de potência ou aparência.":"Uma base RWD íntegra, revisada e com equipamentos de segurança adequados é um bom começo conceitual. Um projeto real exige vistoria e acompanhamento profissional."}</p></div>
    </div>
  </div>;
}
