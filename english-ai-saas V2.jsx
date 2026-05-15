import { useState, useEffect, useRef, useCallback } from "react";

// ── Design tokens — iOS 26 Liquid Glass ─────────────────────────────
const T = {
  bg:      "#07070E",
  glass:   "rgba(255,255,255,0.06)",
  glassHi: "rgba(255,255,255,0.10)",
  border:  "rgba(255,255,255,0.10)",
  borderHi:"rgba(255,255,255,0.18)",
  purple:  "#8B5CF6",
  purpleD: "#6D28D9",
  purpleL: "#A78BFA",
  pink:    "#EC4899",
  blue:    "#3B82F6",
  text:    "#FFFFFF",
  muted:   "rgba(255,255,255,0.45)",
  subtle:  "rgba(255,255,255,0.20)",
  green:   "#34D399",
  amber:   "#FBBF24",
  red:     "#F87171",
  r:       "28px",    // card radius
  rBtn:    "50px",    // button radius
  blur:    "blur(28px) saturate(180%)",
  shadow:  "0 20px 60px rgba(0,0,0,0.55)",
  shadowSm:"0 8px 24px rgba(0,0,0,0.40)",
};

const glass = (extra="") =>
  `background:${T.glass};backdrop-filter:${T.blur};-webkit-backdrop-filter:${T.blur};border:1px solid ${T.border};${extra}`;

// ── Memoji-style avatars per character ──────────────────────────────
const MEMOJI = {
  en_barista:  "👩🏻‍🦰", en_driver:   "👨🏾",    en_friend:  "🧑🏼",
  en_coworker: "👩🏼‍💼",  en_cashier:  "👩🏽",    en_teacher: "👨🏻‍🏫",
  es_barista:  "👩🏽‍🦱",  es_driver:   "👨🏽",    es_friend:  "🧑🏽",
  es_coworker: "👩🏽‍💼",  es_cashier:  "👩🏽",    es_teacher: "👩🏻‍🏫",
};

// ── Voice profiles ──────────────────────────────────────────────────
const VP = {
  en_barista: {lang:"en-US",rate:1.00,pitch:1.15,prefer:["Samantha","Karen","Zira"]},
  en_driver:  {lang:"en-US",rate:1.05,pitch:0.88,prefer:["Alex","David","Microsoft David"]},
  en_friend:  {lang:"en-US",rate:1.12,pitch:0.95,prefer:["Alex","Tom"]},
  en_coworker:{lang:"en-US",rate:0.97,pitch:1.08,prefer:["Samantha","Karen","Zira"]},
  en_cashier: {lang:"en-US",rate:1.02,pitch:1.05,prefer:["Karen","Samantha"]},
  en_teacher: {lang:"en-GB",rate:0.82,pitch:0.90,prefer:["Daniel","Arthur","Google UK English Male"]},
  es_barista: {lang:"es-MX",rate:1.00,pitch:1.12,prefer:["Paulina","Monica","Sabina"]},
  es_driver:  {lang:"es-MX",rate:1.05,pitch:0.90,prefer:["Juan","Carlos"]},
  es_friend:  {lang:"es-MX",rate:1.10,pitch:0.95,prefer:["Jorge","Juan"]},
  es_coworker:{lang:"es-ES",rate:0.97,pitch:1.08,prefer:["Monica","Luciana","Mónica"]},
  es_cashier: {lang:"es-MX",rate:1.02,pitch:1.05,prefer:["Paulina","Monica"]},
  es_teacher: {lang:"es-ES",rate:0.80,pitch:0.88,prefer:["Monica","Luciana","Helena"]},
};

function pickVoice(voices, key) {
  const p = VP[key]; if (!p||!voices.length) return null;
  for (const n of p.prefer) {
    const v = voices.find(v=>v.name.toLowerCase().includes(n.toLowerCase()));
    if (v) return v;
  }
  const lv = voices.filter(v=>v.lang.startsWith(p.lang.split("-")[0]));
  return lv[0] || voices.find(v=>v.lang.startsWith("en")) || voices[0];
}

// ── Characters ──────────────────────────────────────────────────────
const CHARS = {
  english:[
    {id:"barista", name:"Emma",        role:"Coffee Shop Barista", color:"#F59E0B",
     scenario:"Downtown café · New York",  vibe:"Warm · Chatty · Seasonal drinks",
     voiceKey:"en_barista", accent:"🇺🇸 American",
     sys:`You are Emma, a friendly NYC barista. Warm, chatty, love recommending drinks. Casual American English. SHORT replies — 1-3 sentences. Sound human.`},
    {id:"driver",  name:"Marcus",      role:"Uber Driver",         color:"#38BDF8",
     scenario:"City ride · Chicago",       vibe:"Friendly · Curious · Sports talk",
     voiceKey:"en_driver",  accent:"🇺🇸 American",
     sys:`You are Marcus, an Uber driver in Chicago. Curious, chat about sports and city. Casual American English. SHORT replies — 1-3 sentences.`},
    {id:"friend",  name:"Jake",        role:"College Friend",      color:"#A78BFA",
     scenario:"Campus hangout",            vibe:"Casual · Slang · Funny",
     voiceKey:"en_friend",  accent:"🇺🇸 American",
     sys:`You are Jake, a college friend. Casual English with slang (dude, totally, vibe). Funny, sometimes sarcastic. SHORT — 1-3 sentences.`},
    {id:"coworker",name:"Sarah",       role:"Office Friend",       color:"#34D399",
     scenario:"Office · Lunch break",      vibe:"Professional · Friendly · Gossips",
     voiceKey:"en_coworker",accent:"🇺🇸 American",
     sys:`You are Sarah, a friendly coworker. Work projects, office life, weekend plans. Balance professional and casual. SHORT — 1-3 sentences.`},
    {id:"cashier", name:"Maria",       role:"Supermarket Cashier", color:"#FB7185",
     scenario:"Supermarket checkout",      vibe:"Efficient · Polite · Small talk",
     voiceKey:"en_cashier", accent:"🇺🇸 American",
     sys:`You are Maria, a friendly cashier. Efficient, polite, brief small talk. Simple English. VERY SHORT — 1-2 sentences.`},
    {id:"teacher", name:"Dr. Collins", role:"English Teacher",     color:"#818CF8",
     scenario:"Private lesson",            vibe:"Patient · Encouraging · Gentle corrections",
     voiceKey:"en_teacher", accent:"🇬🇧 British",
     sys:`You are Dr. Collins, a patient English teacher. Teach through conversation — correct gently inline, introduce vocabulary naturally. SHORT — 2-4 sentences.`},
  ],
  spanish:[
    {id:"barista", name:"Valentina",   role:"Barista de Café",     color:"#F59E0B",
     scenario:"Café · Ciudad de México",   vibe:"Cálida · Charlatana · Recomienda bebidas",
     voiceKey:"es_barista", accent:"🇲🇽 México",
     sys:`Eres Valentina, una barista amigable en CDMX. Cálida, recomienda bebidas, pregunta por el día. Español mexicano casual. Respuestas CORTAS — 1-3 oraciones.`},
    {id:"driver",  name:"Carlos",      role:"Conductor de Uber",   color:"#38BDF8",
     scenario:"Viaje · CDMX",              vibe:"Amistoso · Curioso · Fútbol",
     voiceKey:"es_driver",  accent:"🇲🇽 México",
     sys:`Eres Carlos, conductor de Uber en CDMX. Curioso, habla de fútbol y tráfico. Español coloquial. CORTAS — 1-3 oraciones.`},
    {id:"friend",  name:"Diego",       role:"Amigo de la Universidad",color:"#A78BFA",
     scenario:"Campus universitario",      vibe:"Casual · Slang · Divertido",
     voiceKey:"es_friend",  accent:"🇲🇽 México",
     sys:`Eres Diego, amigo de la universidad. Español casual con jerga (wey, órale, qué onda). Gracioso, sarcástico. CORTAS — 1-3 oraciones.`},
    {id:"coworker",name:"Sofía",       role:"Compañera de Trabajo", color:"#34D399",
     scenario:"Oficina · Hora de almuerzo",vibe:"Profesional · Amistosa · Chismosa",
     voiceKey:"es_coworker",accent:"🇪🇸 España",
     sys:`Eres Sofía, compañera de trabajo. Proyectos, vida de oficina, planes del finde. Mezcla profesional y casual. CORTAS — 1-3 oraciones.`},
    {id:"cashier", name:"Rosa",        role:"Cajera de Supermercado",color:"#FB7185",
     scenario:"Caja del supermercado",     vibe:"Eficiente · Amable · Charla breve",
     voiceKey:"es_cashier", accent:"🇲🇽 México",
     sys:`Eres Rosa, cajera amable. Eficiente, amable, charla sobre ofertas. Español simple. MUY CORTAS — 1-2 oraciones.`},
    {id:"teacher", name:"Dra. Martínez",role:"Profesora de Español",color:"#818CF8",
     scenario:"Clase particular",          vibe:"Paciente · Alentadora · Corrige suave",
     voiceKey:"es_teacher", accent:"🇪🇸 España",
     sys:`Eres la Dra. Martínez, profesora de español paciente. Enseña conversando — corrige errores gentilmente, introduce vocabulario. CORTAS — 2-4 oraciones.`},
  ],
};

const LEVELS={
  english:[
    {id:"beginner",    label:"Beginner",    desc:"I know basic words",            emoji:"🌱",inst:"Very simple sentences, slow pace. Correct only critical errors."},
    {id:"intermediate",label:"Intermediate",desc:"Simple conversations",          emoji:"🌿",inst:"Natural sentences with idioms. Moderate corrections."},
    {id:"advanced",    label:"Advanced",    desc:"I want to sound native",        emoji:"🌳",inst:"Nuanced language, humor, native phrasing. Detailed corrections."},
  ],
  spanish:[
    {id:"beginner",    label:"Principiante",desc:"Sé palabras básicas",           emoji:"🌱",inst:"Oraciones muy simples, ritmo lento. Solo errores críticos."},
    {id:"intermediate",label:"Intermedio",  desc:"Conversaciones básicas",        emoji:"🌿",inst:"Oraciones naturales con expresiones. Correcciones moderadas."},
    {id:"advanced",    label:"Avanzado",    desc:"Quiero sonar nativo",           emoji:"🌳",inst:"Lenguaje matizado, humor, frases nativas. Correcciones detalladas."},
  ],
};
const GOALS={
  english:[
    {id:"travel",    label:"Travel",        emoji:"✈️"},{id:"work",      label:"Work",         emoji:"💼"},
    {id:"interview", label:"Job Interview", emoji:"🎯"},{id:"social",    label:"Socializing",  emoji:"🤝"},
    {id:"business",  label:"Business",      emoji:"📊"},{id:"casual",    label:"Daily Fluency",emoji:"💬"},
  ],
  spanish:[
    {id:"travel",    label:"Viajes",        emoji:"✈️"},{id:"work",      label:"Trabajo",      emoji:"💼"},
    {id:"interview", label:"Entrevistas",   emoji:"🎯"},{id:"social",    label:"Socializar",   emoji:"🤝"},
    {id:"business",  label:"Negocios",      emoji:"📊"},{id:"casual",    label:"Fluidez diaria",emoji:"💬"},
  ],
};

function buildPrompt(char,prof){
  const lvl=LEVELS[prof.lang]?.find(l=>l.id===prof.level);
  const goal=GOALS[prof.lang]?.find(g=>g.id===prof.goal);
  const es=prof.lang==="spanish";
  return `${char.sys}\n\n${es?"CONTEXTO":"CONTEXT"}:\n- ${es?"Nombre":"Name"}: ${prof.name}\n- ${es?"Nivel":"Level"}: ${lvl?.label} — ${lvl?.inst}\n- ${es?"Objetivo":"Goal"}: ${goal?.label}\n\n${es?"REGLAS":"RULES"}:\n- NEVER break character or say you are AI\n- Correct mistakes naturally inline — never like a formal lesson\n- Vary emotional reactions — no "Great job!" or "Excelente!"\n- Stay SHORT — chat not essay`;
}

const WELCOMES={
  english:{
    barista: n=>`Hey! Welcome to Brew & Co! What can I get you? We just got a new seasonal oat latte — it's honestly amazing.`,
    driver:  n=>`Hey, hop in! I'm Marcus. Traffic's decent today — so where we headed?`,
    friend:  n=>`Yooo ${n}! Finally! I've been here like 20 minutes haha. You good?`,
    coworker:n=>`${n}! Perfect timing — I was just grabbing coffee. Come with me, I need to vent about this morning's standup 😂`,
    cashier: n=>`Hi there! Find everything okay? We have buy-two-get-one on pasta this week if you need any.`,
    teacher: n=>`Hello ${n}! Good to see you. How have you been feeling about your English — any moments this week where you felt stuck?`,
  },
  spanish:{
    barista: n=>`¡Hola! ¡Bienvenido a Café Colibrí! ¿Qué le preparo? Tenemos un café de olla especial que está increíble hoy.`,
    driver:  n=>`¡Qué tal! Súbete, soy Carlos. El tráfico está pesado en el Periférico — ¿a dónde vamos?`,
    friend:  n=>`¡Ey ${n}, qué onda wey! Ya tenía rato esperándote 😂 ¿Cómo estás?`,
    coworker:n=>`¡${n}! Justo a tiempo — iba por un café. ¿Me acompañas? Necesito contarte lo que pasó en la junta 😅`,
    cashier: n=>`¡Buenas! ¿Encontró todo lo que buscaba? Tenemos oferta 2x1 en pasta esta semana.`,
    teacher: n=>`¡Hola ${n}! ¿Cómo te has sentido con tu español últimamente? ¿Hubo algún momento donde te bloqueaste?`,
  },
};

// ── Global CSS ───────────────────────────────────────────────────────
const css=`
  @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  html,body{background:${T.bg};color:${T.text};font-family:'Plus Jakarta Sans',system-ui,sans-serif;overflow-x:hidden;}
  ::-webkit-scrollbar{width:0;}
  input::placeholder{color:rgba(255,255,255,0.3);}

  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scalePop{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
  @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-40px) scale(1.08)}}
  @keyframes orbFloat2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,35px) scale(1.05)}}
  @keyframes orbFloat3{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-20px)}}
  @keyframes memojiPop{0%{transform:scale(0.5) rotate(-10deg);opacity:0}60%{transform:scale(1.12) rotate(3deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes ringPulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.15);opacity:.15}}
  @keyframes wave{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
  @keyframes barBounce{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
  @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}

  .fu{animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both}
  .fi{animation:fadeIn .3s ease both}
  .sp{animation:scalePop .4s cubic-bezier(.22,1,.36,1) both}
  .d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}.d4{animation-delay:.24s}.d5{animation-delay:.30s}
  .dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.4);animation:wave 1.2s ease-in-out infinite}
  .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
  .bar{border-radius:2px;transform-origin:bottom;animation:barBounce .65s ease-in-out infinite}
  .bar:nth-child(2){animation-delay:.12s}.bar:nth-child(3){animation-delay:.24s}
  .bar:nth-child(4){animation-delay:.08s}.bar:nth-child(5){animation-delay:.2s}

  .glass-btn{
    background:${T.glass};
    backdrop-filter:${T.blur};-webkit-backdrop-filter:${T.blur};
    border:1px solid ${T.border};
    border-radius:${T.rBtn};
    cursor:pointer;
    transition:all .2s cubic-bezier(.22,1,.36,1);
    color:${T.text};
    font-family:inherit;
  }
  .glass-btn:hover{background:${T.glassHi};border-color:${T.borderHi};}
  .primary-btn{
    background:linear-gradient(135deg,${T.purpleD},${T.purple} 60%,${T.pink});
    border:none;border-radius:${T.rBtn};cursor:pointer;color:#fff;
    font-family:inherit;font-weight:700;letter-spacing:.01em;
    box-shadow:0 8px 32px rgba(139,92,246,.45);
    transition:all .2s cubic-bezier(.22,1,.36,1);
  }
  .primary-btn:hover{transform:translateY(-1px);box-shadow:0 12px 40px rgba(139,92,246,.55);}
  .primary-btn:disabled{background:#2a2a3a;box-shadow:none;cursor:not-allowed;color:rgba(255,255,255,.25);}
`;

// ── Animated orb background ──────────────────────────────────────────
function OrbBg({ style={} }) {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",...style}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(109,40,217,.55) 0%,transparent 70%)",filter:"blur(80px)",animation:"orbFloat 12s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"10%",right:"-15%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,.40) 0%,transparent 70%)",filter:"blur(90px)",animation:"orbFloat2 15s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"-10%",left:"20%",width:550,height:550,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,.30) 0%,transparent 70%)",filter:"blur(100px)",animation:"orbFloat3 18s ease-in-out infinite"}}/>
    </div>
  );
}

// ── Memoji avatar ────────────────────────────────────────────────────
function Memoji({ emoji, color, size=64, speaking=false, ring=true }) {
  return (
    <div style={{position:"relative",flexShrink:0,width:size,height:size}}>
      {ring && speaking && (
        <>
          <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:`2px solid ${color}`,opacity:.5,animation:"ringPulse 1.2s ease-in-out infinite"}}/>
          <div style={{position:"absolute",inset:-12,borderRadius:"50%",border:`1.5px solid ${color}`,opacity:.2,animation:"ringPulse 1.2s ease-in-out infinite",animationDelay:".3s"}}/>
        </>
      )}
      <div style={{width:size,height:size,borderRadius:"50%",background:`radial-gradient(circle at 35% 35%, ${color}30, ${color}08)`,border:`1.5px solid ${color}${speaking?"88":"33"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.52,transition:"border-color .3s",boxShadow:`0 4px 20px ${color}${speaking?"40":"20"}`}}>
        {emoji}
      </div>
    </div>
  );
}

// ── Equalizer ─────────────────────────────────────────────────────────
function Eq({ color=T.purple, size=14 }) {
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:2,height:size}}>
      {[13,20,11,17,9].map((h,i)=>(
        <div key={i} className="bar" style={{width:3,height:h*size/20,background:color,animationDelay:`${i*.1}s`}}/>
      ))}
    </div>
  );
}
function BubbleWave({color}){
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:2,marginLeft:8,verticalAlign:"middle"}}>
      {[7,13,9,15,8,11,6].map((h,i)=>(
        <div key={i} className="bar" style={{width:2.5,height:h,background:color,opacity:.85,animationDelay:`${i*.09}s`}}/>
      ))}
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button onClick={()=>onChange(!on)}
      style={{width:48,height:28,borderRadius:14,background:on?`linear-gradient(135deg,${T.purpleD},${T.purple})`:"rgba(255,255,255,0.1)",border:on?"none":`1px solid ${T.border}`,cursor:"pointer",position:"relative",transition:"all .25s",flexShrink:0,boxShadow:on?"0 4px 16px rgba(139,92,246,.4)":"none"}}>
      <div style={{position:"absolute",top:3,left:on?23:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .25s",boxShadow:"0 2px 6px rgba(0,0,0,.3)"}}/>
    </button>
  );
}

// ── Gradient text ─────────────────────────────────────────────────────
function GradText({ children, style={} }) {
  return (
    <span style={{background:`linear-gradient(135deg,#fff 0%,${T.purpleL} 50%,${T.pink} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",...style}}>
      {children}
    </span>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────
export default function App() {
  const [screen,    setScreen]    = useState("splash");
  const [step,      setStep]      = useState(0);
  const [prof,      setProf]      = useState({name:"",lang:"english",level:"",goal:"",xp:0,streak:4,msgs:0});
  const [char,      setChar]      = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [history,   setHistory]   = useState([]);
  const [input,     setInput]     = useState("");
  const [typing,    setTyping]    = useState(false);
  const [recording, setRecording] = useState(false);
  const [tab,       setTab]       = useState("home");
  const [chats,     setChats]     = useState({});
  const [voices,    setVoices]    = useState([]);
  const [speakId,   setSpeakId]   = useState(null);
  const [autoPlay,  setAutoPlay]  = useState(true);
  const [ttsOk,     setTtsOk]     = useState(false);

  const endRef = useRef(null);
  const recRef = useRef(null);

  useEffect(()=>{
    function load(){const v=window.speechSynthesis?.getVoices()||[];if(v.length){setVoices(v);setTtsOk(true);}}
    load();
    window.speechSynthesis?.addEventListener("voiceschanged",load);
    return()=>window.speechSynthesis?.removeEventListener("voiceschanged",load);
  },[]);

  useEffect(()=>{const t=setTimeout(()=>setScreen("splash2"),2400);return()=>clearTimeout(t);},[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const stopSpeak=useCallback(()=>{window.speechSynthesis?.cancel();setSpeakId(null);},[]);

  const speakMsg=useCallback((text,key,id)=>{
    if(!window.speechSynthesis)return;
    window.speechSynthesis.cancel();
    const p=VP[key];
    const u=new SpeechSynthesisUtterance(text);
    u.rate=p?.rate??1;u.pitch=p?.pitch??1;u.lang=p?.lang??"en-US";
    const v=pickVoice(voices,key);if(v)u.voice=v;
    u.onstart=()=>setSpeakId(id);
    u.onend=u.onerror=()=>setSpeakId(null);
    window.speechSynthesis.speak(u);
  },[voices]);

  const toggleSpeak=useCallback((text,key,id)=>{
    if(speakId===id){stopSpeak();return;}
    speakMsg(text,key,id);
  },[speakId,speakMsg,stopSpeak]);

  const saveChat=useCallback((c,lang,msgs,hist)=>{
    setChats(prev=>({...prev,[`${lang}_${c.id}`]:{msgs,hist}}));
  },[]);

  const openChat=c=>{
    stopSpeak();setChar(c);
    const key=`${prof.lang}_${c.id}`;
    const saved=chats[key];
    if(saved){setMessages(saved.msgs);setHistory(saved.hist);}
    else{
      const fn=WELCOMES[prof.lang]?.[c.id];
      const txt=fn?fn(prof.name):`Hi ${prof.name}!`;
      const w={id:Date.now(),role:"ai",text:txt,time:new Date()};
      setMessages([w]);setHistory([{role:"assistant",content:txt}]);
      setTimeout(()=>{if(autoPlay)speakMsg(txt,c.voiceKey,w.id);},700);
    }
    setScreen("chat");setTab("chat");
  };

  const send=async text=>{
    if(!text.trim()||typing)return;
    stopSpeak();
    const uid=Date.now();
    const um={id:uid,role:"user",text,time:new Date()};
    const nm=[...messages,um];
    const nh=[...history,{role:"user",content:text}];
    setMessages(nm);setHistory(nh);setInput("");setTyping(true);
    await new Promise(r=>setTimeout(r,700+Math.random()*900));
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:buildPrompt(char,prof),messages:nh})
      });
      const data=await res.json();
      const txt=data.content?.[0]?.text||(prof.lang==="spanish"?"¿Puedes repetir eso?":"Can you say that again?");
      const aid=Date.now()+1;
      const am={id:aid,role:"ai",text:txt,time:new Date()};
      const fm=[...nm,am];const fh=[...nh,{role:"assistant",content:txt}];
      setMessages(fm);setHistory(fh);saveChat(char,prof.lang,fm,fh);
      setProf(p=>({...p,xp:p.xp+10,msgs:p.msgs+1}));
      if(autoPlay)speakMsg(txt,char.voiceKey,aid);
    }catch{
      setMessages(prev=>[...prev,{id:Date.now()+1,role:"ai",text:"Lost connection. Try again?",time:new Date()}]);
    }
    setTyping(false);
  };

  const toggleRec=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Speech recognition requires Chrome.");return;}
    if(recording){recRef.current?.stop();setRecording(false);return;}
    const r=new SR();
    r.lang=prof.lang==="spanish"?"es-MX":"en-US";
    r.continuous=false;r.interimResults=false;
    r.onresult=e=>{send(e.results[0][0].transcript);setRecording(false);};
    r.onerror=r.onend=()=>setRecording(false);
    r.start();recRef.current=r;setRecording(true);
  };

  const isES=prof.lang==="spanish";
  const chars=CHARS[prof.lang]||CHARS.english;
  const levels=LEVELS[prof.lang]||LEVELS.english;
  const goals=GOALS[prof.lang]||GOALS.english;
  const xpLvl=Math.floor(prof.xp/100)+1;
  const xpPct=prof.xp%100;

  // ── SPLASH 1 ─────────────────────────────────────────────────────────
  if(screen==="splash") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,position:"relative",overflow:"hidden"}}>
      <style>{css}</style>
      <OrbBg/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        <div style={{width:90,height:90,borderRadius:"50%",background:`linear-gradient(135deg,${T.purpleD},${T.purple} 50%,${T.pink})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,boxShadow:`0 0 0 16px rgba(139,92,246,.12), 0 0 0 32px rgba(139,92,246,.06)`,animation:"memojiPop .8s cubic-bezier(.22,1,.36,1) both"}}>
          🎙️
        </div>
        <div className="fu d2" style={{textAlign:"center"}}>
          <div style={{fontSize:36,fontWeight:800,letterSpacing:"-.5px"}}><GradText>FluentAI</GradText></div>
          <div style={{fontSize:14,color:T.muted,marginTop:6}}>Learn languages through real conversations</div>
        </div>
      </div>
    </div>
  );

  // ── SPLASH 2 — Beautiful entry ────────────────────────────────────────
  if(screen==="splash2") return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:T.bg,position:"relative",overflow:"hidden"}}>
      <style>{css}</style>
      <OrbBg/>

      {/* Top content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,position:"relative",zIndex:1,padding:"40px 24px 0"}}>

        {/* Floating memoji cluster */}
        <div className="sp" style={{position:"relative",width:240,height:240,marginBottom:8}}>
          {/* Center big memoji */}
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:110,height:110,borderRadius:"50%",background:`linear-gradient(135deg,${T.purpleD}40,${T.purple}30)`,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`2px solid rgba(139,92,246,.4)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:60,boxShadow:`0 8px 40px rgba(139,92,246,.4), inset 0 1px 0 rgba(255,255,255,.15)`}}>
            🧑‍💻
          </div>
          {/* Orbiting mini memojis */}
          {[
            {e:"👩🏻‍🦰",a:310,d:95,s:48,c:"#F59E0B"},{e:"👨🏾",a:55,d:95,s:48,c:"#38BDF8"},
            {e:"🧑🏼",a:165,d:88,s:44,c:"#A78BFA"},{e:"👩🏽‍💼",a:230,d:92,s:46,c:"#34D399"},
          ].map(({e,a,d,s,c},i)=>{
            const rad=a*Math.PI/180;
            const x=120+d*Math.cos(rad)-s/2;
            const y=120+d*Math.sin(rad)-s/2;
            return(
              <div key={i} style={{position:"absolute",left:x,top:y,width:s,height:s,borderRadius:"50%",background:`${c}20`,border:`1.5px solid ${c}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:s*.52,boxShadow:`0 4px 16px ${c}30`,animation:`orbFloat${(i%3)+1} ${10+i*2}s ease-in-out infinite`,animationDelay:`${i*.8}s`}}>
                {e}
              </div>
            );
          })}
          {/* Glow ring */}
          <div style={{position:"absolute",inset:-16,borderRadius:"50%",border:"1.5px solid rgba(139,92,246,.15)",animation:"ringPulse 3s ease-in-out infinite"}}/>
          <div style={{position:"absolute",inset:-32,borderRadius:"50%",border:"1px solid rgba(139,92,246,.08)",animation:"ringPulse 3s ease-in-out infinite",animationDelay:".6s"}}/>
        </div>

        {/* Headline */}
        <div className="fu d1" style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:42,fontWeight:800,letterSpacing:"-.8px",lineHeight:1.1}}>
            <GradText>Speak fluently.</GradText>
          </div>
          <div style={{fontSize:42,fontWeight:800,letterSpacing:"-.8px",lineHeight:1.1,color:T.text}}>
            Sound native.
          </div>
        </div>

        <div className="fu d2" style={{fontSize:16,color:T.muted,textAlign:"center",maxWidth:300,lineHeight:1.6,marginBottom:36}}>
          Practice real conversations with AI characters that actually feel like people.
        </div>

        {/* Language cards */}
        <div className="fu d3" style={{display:"flex",gap:14,width:"100%",maxWidth:380}}>
          {[
            {id:"english",label:"English",   flag:"🇺🇸",sub:"6 characters",   grad:`linear-gradient(135deg,#1E3A5F,#1a4080)`},
            {id:"spanish",label:"Español",   flag:"🇲🇽",sub:"6 personajes",  grad:`linear-gradient(135deg,#5F1E1E,#801a1a)`},
          ].map(l=>(
            <button key={l.id} onClick={()=>{setProf(p=>({...p,lang:l.id}));setStep(1);setScreen("onboard");}}
              style={{flex:1,background:l.grad,borderRadius:24,padding:"20px 16px",border:`1px solid rgba(255,255,255,.1)`,cursor:"pointer",textAlign:"center",backdropFilter:T.blur,WebkitBackdropFilter:T.blur,boxShadow:T.shadowSm,transition:"all .2s",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <span style={{fontSize:36}}>{l.flag}</span>
              <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{l.label}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>{l.sub}</div>
            </button>
          ))}
        </div>

        {/* Social proof */}
        <div className="fu d4" style={{display:"flex",alignItems:"center",gap:10,marginTop:28}}>
          <div style={{display:"flex"}}>
            {["🧑🏼","👩🏽","👨🏾","👩🏻","🧑🏿"].map((e,i)=>(
              <div key={i} style={{width:28,height:28,borderRadius:"50%",background:`rgba(255,255,255,.08)`,border:`2px solid ${T.bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginLeft:i?-8:0}}>
                {e}
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:T.muted}}>Join <b style={{color:T.purpleL}}>2,000+</b> learners already speaking</div>
        </div>
      </div>

      {/* Bottom pill */}
      <div className="fu d5" style={{padding:"0 24px 40px",position:"relative",zIndex:1,textAlign:"center"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,.2)"}}>Free 7-day trial · No credit card needed</div>
      </div>
    </div>
  );

  // ── ONBOARDING ────────────────────────────────────────────────────────
  if(screen==="onboard"){
    const steps=[
      // Step 1: Name
      <div key="name" style={{display:"flex",flexDirection:"column",gap:20}}>
        <div className="fu" style={{fontSize:12,fontWeight:600,color:T.purpleL,letterSpacing:".08em"}}>STEP 1 OF 3</div>
        <div className="fu d1" style={{fontSize:30,fontWeight:800,lineHeight:1.15,letterSpacing:"-.5px"}}>
          {isES?"¿Cómo te llamas?":"What should we\ncall you?"}</div>
        <div className="fu d2" style={{fontSize:14,color:T.muted}}>
          {isES?"Para que las conversaciones sean más personales.":"Your name makes conversations feel more personal."}
        </div>
        <div className="fu d3" style={{...Object.fromEntries(glass().split(";").filter(Boolean).map(s=>{const[k,...v]=s.split(":");return[k.trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v.join(":").trim()];})),borderRadius:18,padding:"4px 6px",marginTop:4}}>
          <input value={prof.name} onChange={e=>setProf(p=>({...p,name:e.target.value}))}
            onKeyDown={e=>e.key==="Enter"&&prof.name.trim()&&setStep(2)} autoFocus
            placeholder={isES?"Tu nombre...":"Your first name..."}
            style={{width:"100%",background:"none",border:"none",outline:"none",color:T.text,fontSize:17,padding:"14px 16px",fontFamily:"inherit",fontWeight:500}}
          />
        </div>
        <button className="fu d4 primary-btn" onClick={()=>prof.name.trim()&&setStep(2)} disabled={!prof.name.trim()}
          style={{padding:"16px",fontSize:15,fontWeight:700}}>{isES?"Continuar →":"Continue →"}</button>
      </div>,

      // Step 2: Level
      <div key="level" style={{display:"flex",flexDirection:"column",gap:16}}>
        <div className="fu" style={{fontSize:12,fontWeight:600,color:T.purpleL,letterSpacing:".08em"}}>STEP 2 OF 3</div>
        <div className="fu d1" style={{fontSize:30,fontWeight:800,lineHeight:1.15,letterSpacing:"-.5px"}}>
          {isES?"¿Cuál es tu nivel?":"What's your level?"}</div>
        <div className="fu d2" style={{fontSize:14,color:T.muted,marginBottom:4}}>
          {isES?"Adaptaré cada conversación a ti.":"I'll tailor every conversation to you."}</div>
        {levels.map((l,i)=>(
          <button key={l.id} onClick={()=>{setProf(p=>({...p,level:l.id}));setTimeout(()=>setStep(3),220);}}
            className={`fu d${i+2}`}
            style={{background:prof.level===l.id?`linear-gradient(135deg,rgba(109,40,217,.3),rgba(139,92,246,.2))`:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1.5px solid ${prof.level===l.id?T.purple:T.border}`,borderRadius:20,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all .2s",textAlign:"left",boxShadow:prof.level===l.id?`0 0 0 1px ${T.purple}40,0 8px 24px rgba(139,92,246,.2)`:"none"}}>
            <span style={{fontSize:28}}>{l.emoji}</span>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>{l.label}</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>{l.desc}</div>
            </div>
            {prof.level===l.id&&<div style={{marginLeft:"auto",width:22,height:22,borderRadius:"50%",background:T.purple,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✓</div>}
          </button>
        ))}
      </div>,

      // Step 3: Goal
      <div key="goal" style={{display:"flex",flexDirection:"column",gap:16}}>
        <div className="fu" style={{fontSize:12,fontWeight:600,color:T.purpleL,letterSpacing:".08em"}}>STEP 3 OF 3</div>
        <div className="fu d1" style={{fontSize:30,fontWeight:800,lineHeight:1.15,letterSpacing:"-.5px"}}>
          {isES?"¿Por qué aprendes?":"Why are you learning?"}</div>
        <div className="fu d2" style={{fontSize:14,color:T.muted,marginBottom:4}}>
          {isES?"Define tu vocabulario y escenarios.":"This shapes your vocabulary and scenarios."}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          {goals.map((g,i)=>(
            <button key={g.id} onClick={()=>setProf(p=>({...p,goal:g.id}))}
              className={`fu d${Math.min(i+2,5)}`}
              style={{background:prof.goal===g.id?`linear-gradient(135deg,rgba(109,40,217,.3),rgba(139,92,246,.2))`:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1.5px solid ${prof.goal===g.id?T.purple:T.border}`,borderRadius:20,padding:"16px 14px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:7,cursor:"pointer",transition:"all .2s",boxShadow:prof.goal===g.id?`0 0 0 1px ${T.purple}40`:"none"}}>
              <span style={{fontSize:24}}>{g.emoji}</span>
              <div style={{fontSize:13,fontWeight:700}}>{g.label}</div>
            </button>
          ))}
        </div>
        <button className="primary-btn" onClick={()=>prof.goal&&setScreen("main")} disabled={!prof.goal}
          style={{padding:"16px",fontSize:15,fontWeight:700,marginTop:4}}>
          {isES?"¡Empezar a aprender! 🚀":"Start Learning 🚀"}
        </button>
      </div>,
    ];

    return(
      <div style={{minHeight:"100vh",background:T.bg,position:"relative",overflow:"hidden"}}>
        <style>{css}</style>
        <OrbBg/>
        <div style={{position:"relative",zIndex:1,maxWidth:440,margin:"0 auto",padding:"56px 22px 40px"}}>
          {/* Progress dots */}
          <div style={{display:"flex",gap:6,marginBottom:36}}>
            {[1,2,3].map(i=>(
              <div key={i} style={{flex:i===step?2:1,height:4,borderRadius:4,background:i<=step?`linear-gradient(90deg,${T.purpleD},${T.purple})`:T.glass,transition:"all .35s cubic-bezier(.22,1,.36,1)",boxShadow:i===step?`0 0 12px ${T.purple}60`:"none"}}/>
            ))}
          </div>
          {steps[step-1]}
        </div>
      </div>
    );
  }

  // ── CHAT SCREEN ────────────────────────────────────────────────────────
  if(screen==="chat"&&char){
    const memojiKey=`${prof.lang}_${char.id}`;
    const memojiEmoji=MEMOJI[memojiKey]||char.id;
    const isSpeaking=speakId!==null;
    const fmt=d=>new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:T.bg,position:"relative"}}>
        <style>{css}</style>
        {/* Subtle orb tinted to character */}
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
          <div style={{position:"absolute",top:"-20%",left:"50%",transform:"translateX(-50%)",width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle,${char.color}22 0%,transparent 65%)`,filter:"blur(60px)"}}/>
        </div>

        {/* Header */}
        <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10,background:`rgba(7,7,14,.85)`,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,borderBottom:`1px solid ${T.border}`}}>
          <button onClick={()=>{stopSpeak();saveChat(char,prof.lang,messages,history);setScreen("main");setTab("home");}}
            style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:24,padding:"2px 4px",lineHeight:1}}>‹</button>

          <Memoji emoji={memojiEmoji} color={char.color} size={46} speaking={isSpeaking}/>

          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
              {char.name}
              {isSpeaking&&<span style={{fontSize:11,color:char.color,background:`${char.color}18`,padding:"2px 8px",borderRadius:10,fontWeight:500}}>{isES?"Hablando":"Speaking"} <Eq color={char.color} size={9}/></span>}
            </div>
            <div style={{fontSize:11,color:T.green,display:"flex",alignItems:"center",gap:4,marginTop:1}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:T.green,boxShadow:`0 0 6px ${T.green}`}}/>
              {char.role} · {char.accent}
            </div>
          </div>

          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isSpeaking&&(
              <button onClick={stopSpeak} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.red}}>⏹</button>
            )}
            <button onClick={()=>{stopSpeak();setAutoPlay(a=>!a);}}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:autoPlay?T.purpleL:T.muted}}>
              {autoPlay?"🔊":"🔇"}
            </button>
            <div style={{fontSize:11,color:T.muted,background:T.glass,padding:"3px 9px",borderRadius:20,border:`1px solid ${T.border}`}}>⚡{prof.xp}</div>
          </div>
        </div>

        {/* Muted banner */}
        {!autoPlay&&(
          <div style={{background:`rgba(251,191,36,.08)`,borderBottom:`1px solid rgba(251,191,36,.2)`,padding:"7px 16px",display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:9}}>
            <span style={{fontSize:11,color:T.amber}}>{isES?"🔇 Audio silenciado — toca 🔊 en un mensaje para escucharlo":"🔇 Audio muted — tap 🔊 on any message to hear it"}</span>
          </div>
        )}

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 14px",display:"flex",flexDirection:"column",gap:12,position:"relative",zIndex:1}}>
          {messages.map((m,idx)=>{
            const isUser=m.role==="user";
            const isMsgSpeaking=speakId===m.id;
            const showTime=idx===0||(new Date(m.time)-new Date(messages[idx-1].time))>60000;
            return(
              <div key={m.id}>
                {showTime&&<div style={{textAlign:"center",fontSize:11,color:T.muted,margin:"4px 0 10px"}}>{fmt(m.time)}</div>}
                <div style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",alignItems:"flex-end",gap:10}}>
                  {!isUser&&<Memoji emoji={memojiEmoji} color={char.color} size={34} speaking={isMsgSpeaking} ring={false}/>}
                  <div style={{maxWidth:"76%",display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start",gap:5}}>
                    {/* Bubble */}
                    <div style={{
                      padding:"12px 16px",
                      borderRadius:isUser?"18px 18px 5px 18px":"18px 18px 18px 5px",
                      background:isUser?`linear-gradient(135deg,${T.purpleD},${T.purple} 70%,${T.pink}20)`:`rgba(255,255,255,.07)`,
                      backdropFilter:isUser?"none":T.blur,WebkitBackdropFilter:isUser?"none":T.blur,
                      border:isUser?"none":`1px solid ${isMsgSpeaking?char.color:T.border}`,
                      color:T.text,fontSize:14,lineHeight:1.65,
                      boxShadow:isUser?`0 4px 20px rgba(109,40,217,.4)`:`0 4px 16px rgba(0,0,0,.3)`,
                      animation:"fadeUp .25s ease",
                      transition:"border-color .2s",
                      wordBreak:"break-word",
                    }}>
                      {m.text}
                      {isMsgSpeaking&&!isUser&&<BubbleWave color={char.color}/>}
                      {isUser&&<div style={{fontSize:10,color:"rgba(255,255,255,.35)",textAlign:"right",marginTop:4}}>✓✓</div>}
                    </div>
                    {/* Hear button */}
                    {!isUser&&(
                      <button onClick={()=>toggleSpeak(m.text,char.voiceKey,m.id)}
                        style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:isMsgSpeaking?char.color:T.muted,fontSize:11,padding:"2px 4px",borderRadius:8,transition:"color .2s"}}>
                        {isMsgSpeaking?<><span style={{fontSize:13}}>⏹</span>{isES?"Parar":"Stop"}</>:<><span style={{fontSize:13}}>🔊</span>{isES?"Escuchar":"Hear"}</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typing&&(
            <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
              <Memoji emoji={memojiEmoji} color={char.color} size={34} ring={false}/>
              <div style={{padding:"12px 18px",borderRadius:"18px 18px 18px 5px",background:"rgba(255,255,255,.07)",backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${T.border}`,display:"flex",gap:6,alignItems:"center"}}>
                <div className="dot"/><div className="dot"/><div className="dot"/>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Input bar */}
        <div style={{padding:"10px 14px 28px",background:`rgba(7,7,14,.9)`,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,borderTop:`1px solid ${T.border}`,display:"flex",gap:9,alignItems:"flex-end",position:"relative",zIndex:10}}>
          <div style={{flex:1,...Object.fromEntries(glass("border-radius:28px;").split(";").filter(s=>s.includes(":")).map(s=>{const[k,...v]=s.trim().split(":");return[k.trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v.join(":").trim()];})),padding:"10px 18px",display:"flex",alignItems:"center"}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send(input)}
              placeholder={isES?"Escribe un mensaje...":"Type a message..."}
              style={{flex:1,background:"none",border:"none",outline:"none",color:T.text,fontSize:14,fontFamily:"inherit"}}
            />
          </div>
          <button onClick={toggleRec}
            style={{width:46,height:46,borderRadius:"50%",background:recording?`rgba(248,113,113,.2)`:"rgba(255,255,255,.07)",border:`1.5px solid ${recording?T.red:T.border}`,cursor:"pointer",fontSize:19,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",animation:recording?"pulse 1s infinite":"none",flexShrink:0}}>
            🎙️
          </button>
          <button onClick={()=>send(input)} disabled={!input.trim()||typing}
            style={{width:46,height:46,borderRadius:"50%",background:input.trim()&&!typing?`linear-gradient(135deg,${T.purpleD},${T.purple})`:"rgba(255,255,255,.06)",border:"none",cursor:input.trim()&&!typing?"pointer":"not-allowed",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0,boxShadow:input.trim()&&!typing?`0 4px 20px rgba(139,92,246,.5)`:"none"}}>
            ➤
          </button>
        </div>
      </div>
    );
  }

  // ── HOME TAB ──────────────────────────────────────────────────────────
  const HomeTab=()=>(
    <div style={{padding:"28px 18px",display:"flex",flexDirection:"column",gap:22,position:"relative",zIndex:1}}>

      {/* Header */}
      <div className="fu" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:26,fontWeight:800,letterSpacing:"-.5px"}}>
            <GradText>{isES?`¡Hola, ${prof.name}!`:`Hi, ${prof.name} 👋`}</GradText>
          </div>
          <div style={{fontSize:13,color:T.muted,marginTop:3}}>{isES?"Aprendiendo Español":"Learning English"} · Level {xpLvl}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
          <div style={{fontSize:20,lineHeight:1}}>🔥</div>
          <div style={{fontSize:13,fontWeight:700,color:T.amber}}>{prof.streak} {isES?"días":"days"}</div>
        </div>
      </div>

      {/* XP glass card */}
      <div className="fu d1" style={{...Object.fromEntries(glass(`border-radius:22px;`).split(";").filter(s=>s.includes(":")).map(s=>{const[k,...v]=s.trim().split(":");return[k.trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v.join(":").trim()];})),padding:"16px 18px",boxShadow:T.shadowSm}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:700,color:T.purpleL}}>Level {xpLvl}</div>
          <div style={{fontSize:12,color:T.muted}}>{prof.xp} XP · {100-xpPct} to next</div>
        </div>
        <div style={{height:6,background:"rgba(255,255,255,.08)",borderRadius:8,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${xpPct}%`,background:`linear-gradient(90deg,${T.purpleD},${T.purple} 70%,${T.pink})`,borderRadius:8,transition:"width .7s",boxShadow:`0 0 12px ${T.purple}60`}}/>
        </div>
      </div>

      {/* Language switch */}
      <div className="fu d2" style={{display:"flex",gap:10}}>
        {[{id:"english",flag:"🇺🇸",label:"English"},{id:"spanish",flag:"🇲🇽",label:"Español"}].map(l=>(
          <button key={l.id} onClick={()=>{if(l.id!==prof.lang){stopSpeak();setProf(p=>({...p,lang:l.id,level:"",goal:""}));setChats({});setStep(2);setScreen("onboard");}}}
            style={{flex:1,background:prof.lang===l.id?`linear-gradient(135deg,${T.purpleD}50,${T.purple}30)`:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1.5px solid ${prof.lang===l.id?T.purple:T.border}`,borderRadius:16,padding:"10px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all .2s"}}>
            <span style={{fontSize:18}}>{l.flag}</span>
            <span style={{fontSize:13,fontWeight:600,color:prof.lang===l.id?T.text:T.muted}}>{l.label}</span>
          </button>
        ))}
      </div>

      {/* Characters */}
      <div className="fu d3">
        <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:".09em",marginBottom:14}}>{isES?"PERSONAJES":"CHARACTERS"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {chars.map((c,i)=>{
            const memojiKey=`${prof.lang}_${c.id}`;
            const memojiEmoji=MEMOJI[memojiKey]||"🧑";
            const hasChat=!!chats[`${prof.lang}_${c.id}`];
            return(
              <button key={c.id} onClick={()=>openChat(c)}
                className={`fu d${Math.min(i+1,4)}`}
                style={{background:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${T.border}`,borderRadius:24,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left",transition:"all .22s",boxShadow:T.shadowSm,position:"relative",overflow:"hidden"}}>
                {/* Color left stripe */}
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:`linear-gradient(${c.color},${c.color}80)`,borderRadius:"24px 0 0 24px"}}/>
                {/* Memoji */}
                <Memoji emoji={memojiEmoji} color={c.color} size={56}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                    <div style={{fontSize:15,fontWeight:700}}>{c.name}</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {hasChat&&<div style={{fontSize:10,color:T.green,background:`rgba(52,211,153,.12)`,padding:"2px 8px",borderRadius:10,border:`1px solid rgba(52,211,153,.2)`}}>{isES?"Activo":"Active"}</div>}
                      <div style={{fontSize:10,color:T.muted,background:"rgba(255,255,255,.06)",padding:"2px 8px",borderRadius:10}}>{c.accent}</div>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:c.color,marginTop:2,fontWeight:500}}>{c.role}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:3}}>{c.vibe}</div>
                </div>
                <div style={{color:T.muted,fontSize:18,opacity:.5}}>›</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── PROGRESS TAB ──────────────────────────────────────────────────────
  const ProgressTab=()=>{
    const badges=[
      {label:isES?"Primera Charla":"First Chat",   emoji:"💬",earned:prof.msgs>=1},
      {label:isES?"10 Mensajes":"10 Messages",     emoji:"🔟",earned:prof.msgs>=10},
      {label:"50 XP",                              emoji:"⚡",earned:prof.xp>=50},
      {label:isES?"Maestro de Voz":"Voice Master", emoji:"🎙️",earned:prof.msgs>=5},
      {label:isES?"3 Personajes":"3 Characters",   emoji:"🎭",earned:Object.keys(chats).length>=3},
      {label:isES?"Racha de 7 días":"Week Streak", emoji:"🔥",earned:prof.streak>=7},
    ];
    return(
      <div style={{padding:"28px 18px",display:"flex",flexDirection:"column",gap:20,position:"relative",zIndex:1}}>
        <div className="fu" style={{fontSize:26,fontWeight:800,letterSpacing:"-.5px"}}><GradText>{isES?"Tu Progreso":"Your Progress"}</GradText></div>
        <div className="fu d1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {label:isES?"XP Total":"Total XP",    val:prof.xp,                    emoji:"⚡",c:T.amber},
            {label:isES?"Mensajes":"Messages",    val:prof.msgs,                  emoji:"💬",c:T.purpleL},
            {label:isES?"Racha":"Day Streak",     val:prof.streak,                emoji:"🔥",c:T.red},
            {label:isES?"Personajes":"Characters",val:Object.keys(chats).length,  emoji:"🎭",c:T.green},
          ].map(s=>(
            <div key={s.label} style={{background:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${T.border}`,borderRadius:22,padding:"16px",boxShadow:T.shadowSm}}>
              <div style={{fontSize:24}}>{s.emoji}</div>
              <div style={{fontSize:28,fontWeight:800,color:s.c,marginTop:6,letterSpacing:"-.5px"}}>{s.val}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="fu d2" style={{background:`linear-gradient(135deg,rgba(109,40,217,.2),rgba(139,92,246,.1))`,border:`1px solid rgba(139,92,246,.3)`,borderRadius:22,padding:"18px",boxShadow:`0 4px 24px rgba(139,92,246,.15)`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:700}}>Level {xpLvl}</div>
            <div style={{fontSize:12,color:T.purpleL}}>{prof.xp} / {xpLvl*100} XP</div>
          </div>
          <div style={{height:7,background:"rgba(255,255,255,.08)",borderRadius:8,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${xpPct}%`,background:`linear-gradient(90deg,${T.purpleD},${T.purple})`,borderRadius:8,transition:"width .8s",boxShadow:`0 0 12px ${T.purple}60`}}/>
          </div>
          <div style={{fontSize:12,color:T.muted,marginTop:8}}>{isES?"+10 XP por respuesta · ¡Sigue chateando!":"+10 XP per AI reply · Keep chatting! 🚀"}</div>
        </div>
        <div className="fu d3">
          <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:".09em",marginBottom:12}}>{isES?"LOGROS":"ACHIEVEMENTS"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {badges.map(b=>(
              <div key={b.label} style={{background:b.earned?`linear-gradient(135deg,rgba(139,92,246,.2),rgba(167,139,250,.1))`:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${b.earned?`rgba(139,92,246,.4)`:T.border}`,borderRadius:18,padding:"14px 12px",opacity:b.earned?1:.4,textAlign:"center",boxShadow:b.earned?`0 4px 16px rgba(139,92,246,.15)`:"none",transition:"all .2s"}}>
                <div style={{fontSize:28,filter:b.earned?"none":"grayscale(1)"}}>{b.emoji}</div>
                <div style={{fontSize:11,fontWeight:600,marginTop:6}}>{b.label}</div>
                {b.earned&&<div style={{fontSize:10,color:T.green,marginTop:3}}>✓ {isES?"Ganado":"Earned"}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── PROFILE TAB ───────────────────────────────────────────────────────
  const ProfileTab=()=>{
    const lvl=levels.find(l=>l.id===prof.level);
    const goal=goals.find(g=>g.id===prof.goal);
    return(
      <div style={{padding:"28px 18px",display:"flex",flexDirection:"column",gap:18,position:"relative",zIndex:1}}>
        <div className="fu" style={{fontSize:26,fontWeight:800,letterSpacing:"-.5px"}}><GradText>Profile</GradText></div>
        {/* Avatar card */}
        <div className="fu d1" style={{background:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${T.border}`,borderRadius:28,padding:"28px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12,boxShadow:T.shadow}}>
          <div style={{position:"relative"}}>
            <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${T.purpleD}60,${T.purple}40)`,border:`2px solid rgba(139,92,246,.5)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,boxShadow:`0 0 0 8px rgba(139,92,246,.08)`}}>
              {prof.name[0]?.toUpperCase()}
            </div>
            <div style={{position:"absolute",bottom:-2,right:-2,width:26,height:26,borderRadius:"50%",background:T.amber,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,border:`2px solid ${T.bg}`}}>⚡</div>
          </div>
          <div style={{fontSize:20,fontWeight:800}}>{prof.name}</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"center"}}>
            <div style={{fontSize:11,background:"rgba(139,92,246,.2)",color:T.purpleL,padding:"4px 12px",borderRadius:20,border:`1px solid rgba(139,92,246,.3)`}}>{isES?"🇲🇽 Español":"🇺🇸 English"}</div>
            <div style={{fontSize:11,background:"rgba(251,191,36,.15)",color:T.amber,padding:"4px 12px",borderRadius:20,border:`1px solid rgba(251,191,36,.25)`}}>{lvl?.emoji} {lvl?.label}</div>
            <div style={{fontSize:11,background:"rgba(255,255,255,.07)",color:T.muted,padding:"4px 12px",borderRadius:20,border:`1px solid ${T.border}`}}>{goal?.emoji} {goal?.label}</div>
          </div>
        </div>

        {/* Audio */}
        <div className="fu d2" style={{background:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${T.border}`,borderRadius:22,padding:"16px 18px"}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>🔊 {isES?"Ajustes de Audio":"Audio Settings"}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <div style={{fontSize:13}}>{isES?"Reproducción automática":"Auto-play voices"}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>{isES?"Los personajes hablan solos":"Characters speak automatically"}</div>
            </div>
            <Toggle on={autoPlay} onChange={v=>{stopSpeak();setAutoPlay(v);}}/>
          </div>
          <div style={{fontSize:11,color:T.muted,borderTop:`1px solid ${T.border}`,paddingTop:10,display:"flex",alignItems:"center",gap:6}}>
            {ttsOk?<><span style={{color:T.green}}>●</span>{voices.length} {isES?"voces disponibles":"voices available"}</>:<><span style={{animation:"pulse 1s infinite"}}>●</span>{isES?"Cargando voces…":"Loading voices…"}</>}
          </div>
        </div>

        {[
          {label:isES?"Idioma":"Language",   val:`${isES?"🇲🇽 Español":"🇺🇸 English"}`},
          {label:isES?"Nivel":"Level",       val:`${lvl?.emoji} ${lvl?.label}`},
          {label:isES?"Objetivo":"Goal",     val:`${goal?.emoji} ${goal?.label}`},
          {label:"XP",                       val:`⚡ ${prof.xp}`},
          {label:isES?"Mensajes":"Messages", val:`💬 ${prof.msgs}`},
        ].map(r=>(
          <div key={r.label} className="fu d2" style={{background:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${T.border}`,borderRadius:16,padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,color:T.muted}}>{r.label}</div>
            <div style={{fontSize:13,fontWeight:600}}>{r.val}</div>
          </div>
        ))}

        <button onClick={()=>{stopSpeak();setProf({name:"",lang:"english",level:"",goal:"",xp:0,streak:0,msgs:0});setChats({});setScreen("splash2");}}
          style={{background:T.glass,backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px",fontSize:13,color:T.muted,cursor:"pointer",marginTop:4,fontFamily:"inherit",transition:"all .2s"}}>
          {isES?"Reiniciar y empezar de nuevo":"Reset & Start Over"}
        </button>
      </div>
    );
  };

  // ── MAIN LAYOUT ───────────────────────────────────────────────────────
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:T.bg,position:"relative"}}>
      <style>{css}</style>
      <OrbBg/>
      <div style={{flex:1,overflowY:"auto",paddingBottom:76}}>
        {tab==="home"     &&<HomeTab/>}
        {tab==="progress" &&<ProgressTab/>}
        {tab==="profile"  &&<ProfileTab/>}
      </div>

      {/* Bottom nav — iOS 26 floating pill */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"0 20px 28px",zIndex:20}}>
        <div style={{background:"rgba(12,12,20,.88)",backdropFilter:T.blur,WebkitBackdropFilter:T.blur,border:`1px solid ${T.border}`,borderRadius:30,display:"flex",padding:"6px",boxShadow:T.shadow}}>
          {[
            {id:"home",     emoji:"🏠",en:"Characters",es:"Personajes"},
            {id:"progress", emoji:"📊",en:"Progress",  es:"Progreso"},
            {id:"profile",  emoji:"👤",en:"Profile",   es:"Perfil"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,background:tab===t.id?`linear-gradient(135deg,${T.purpleD}70,${T.purple}50)`:"none",border:"none",borderRadius:24,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"9px 4px",transition:"all .25s"}}>
              <div style={{fontSize:20,filter:tab===t.id?"none":"grayscale(.4) opacity(.4)",transition:"filter .2s"}}>{t.emoji}</div>
              <div style={{fontSize:10,fontWeight:700,color:tab===t.id?"#fff":T.muted,transition:"color .2s",letterSpacing:".02em"}}>{isES?t.es:t.en}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
