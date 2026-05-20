/* Group A — UX states (empty / loading / error) + Group C — command palette, notifications, flows */
const { Card: CardS, Pill: PillS, Btn: BtnS, SectionLabel: SLS, Icon: IconS } = window.UI;

// ─────────────────────────────────────────────────────────────────────────────
// Reusable bits
// ─────────────────────────────────────────────────────────────────────────────
function StateHeader({ crumb, title, subtitle }) {
  return (
    <div style={{borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
      <div style={{padding:"16px 28px"}}>
        {crumb && (
          <div style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-subtle)", marginBottom:4}}>
            {crumb.map((c,i)=>(
              <React.Fragment key={i}>
                {i>0 && <span>/</span>}
                <span style={{color: i===crumb.length-1 ? "var(--fg-muted)" : "var(--fg-subtle)"}}>{c}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 style={{margin:0, fontSize:22, letterSpacing:"-0.025em", fontWeight:600}}>{title}</h1>
        {subtitle && <p style={{margin:"4px 0 0", fontSize:13, color:"var(--fg-muted)"}}>{subtitle}</p>}
      </div>
    </div>
  );
}

function pageShell(headerProps, body) {
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <StateHeader {...headerProps} />
      <div style={{flex:1, overflowY:"auto", padding:"24px 28px 48px", background:"var(--bg)"}}>
        {body}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATES
// ─────────────────────────────────────────────────────────────────────────────
function EmptyIllustration({ kind }) {
  // Simple decorative SVG illustrations by kind
  const common = { width:120, height:96 };
  const stroke = "var(--border-strong)";
  const accent = "var(--accent)";
  switch (kind) {
    case "inbox":
      return (
        <svg viewBox="0 0 160 120" {...common}>
          <rect x="20" y="30" width="120" height="76" rx="8" fill="var(--bg-subtle)" stroke={stroke}/>
          <path d="M20 30 L80 70 L140 30" fill="none" stroke={stroke} strokeWidth="1.5"/>
          <circle cx="120" cy="22" r="10" fill={accent}/>
          <text x="120" y="26" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">0</text>
        </svg>
      );
    case "applications":
      return (
        <svg viewBox="0 0 160 120" {...common}>
          <rect x="30" y="20" width="100" height="80" rx="8" fill="var(--bg-subtle)" stroke={stroke}/>
          <rect x="40" y="34" width="60" height="6" rx="2" fill={stroke}/>
          <rect x="40" y="46" width="80" height="4" rx="2" fill="var(--border)"/>
          <rect x="40" y="56" width="50" height="4" rx="2" fill="var(--border)"/>
          <rect x="40" y="72" width="80" height="14" rx="4" fill="none" stroke={stroke} strokeDasharray="3 3"/>
          <circle cx="115" cy="79" r="2" fill={accent}/>
        </svg>
      );
    case "loops":
      return (
        <svg viewBox="0 0 160 120" {...common}>
          <circle cx="80" cy="60" r="32" fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="3 4"/>
          <circle cx="80" cy="60" r="32" fill="none" stroke={accent} strokeWidth="3" strokeDasharray="20 200" transform="rotate(-90 80 60)"/>
          <circle cx="80" cy="60" r="6" fill={accent}/>
        </svg>
      );
    case "contacts":
      return (
        <svg viewBox="0 0 160 120" {...common}>
          {[0,1,2].map(i=>(
            <g key={i} transform={`translate(${30+i*30}, ${20+i*16})`}>
              <circle cx="20" cy="20" r="12" fill="var(--bg-subtle)" stroke={stroke}/>
              <rect x="38" y="14" width="60" height="4" rx="2" fill={stroke}/>
              <rect x="38" y="22" width="40" height="3" rx="1" fill="var(--border)"/>
            </g>
          ))}
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 160 120" {...common}>
          <circle cx="70" cy="55" r="28" fill="var(--bg-subtle)" stroke={stroke} strokeWidth="2"/>
          <line x1="90" y1="75" x2="115" y2="100" stroke={stroke} strokeWidth="5" strokeLinecap="round"/>
          <text x="70" y="63" textAnchor="middle" fontSize="18" fill="var(--fg-subtle)" fontWeight="600">?</text>
        </svg>
      );
    case "filter":
      return (
        <svg viewBox="0 0 160 120" {...common}>
          <path d="M40 30 H120 L92 62 V90 L68 80 V62 Z" fill="var(--bg-subtle)" stroke={stroke} strokeWidth="2"/>
          <circle cx="115" cy="35" r="10" fill={accent}/>
          <line x1="111" y1="31" x2="119" y2="39" stroke="#fff" strokeWidth="2"/>
          <line x1="119" y1="31" x2="111" y2="39" stroke="#fff" strokeWidth="2"/>
        </svg>
      );
    default:
      return null;
  }
}

function EmptyState({ kind, title, body, primary, secondary, tip }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      textAlign:"center", padding:"40px 24px",
      background:"var(--bg-elev)", border:"1px solid var(--border)", borderRadius:14,
      maxWidth:520, margin:"0 auto",
    }}>
      <div style={{marginBottom:18}}><EmptyIllustration kind={kind}/></div>
      <div style={{fontSize:17, fontWeight:600, letterSpacing:"-0.02em", marginBottom:8}}>{title}</div>
      <div style={{fontSize:13.5, color:"var(--fg-muted)", lineHeight:1.55, maxWidth:380, marginBottom:18}}>{body}</div>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center"}}>
        {primary && <BtnS variant="primary" size="md" icon={IconS.plus}>{primary}</BtnS>}
        {secondary && <BtnS variant="outline" size="md">{secondary}</BtnS>}
      </div>
      {tip && (
        <div style={{
          marginTop:24, padding:"10px 14px", borderRadius:7,
          background:"var(--bg-subtle)", border:"1px solid var(--border)",
          fontSize:11.5, color:"var(--fg-muted)", maxWidth:380,
        }}>
          <strong style={{color:"var(--fg)", fontWeight:500}}>Подсказка:</strong> {tip}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADERS
// ─────────────────────────────────────────────────────────────────────────────
function Sk({ w="100%", h=12, r=4, style }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:r,
      background:"linear-gradient(90deg, var(--bg-subtle) 0%, color-mix(in oklab, var(--bg-subtle) 50%, var(--bg-elev)) 50%, var(--bg-subtle) 100%)",
      backgroundSize:"200% 100%", animation:"sk-shimmer 1.6s linear infinite",
      ...style,
    }}/>
  );
}

function SkeletonTable() {
  return (
    <CardS padding={0}>
      <div style={{padding:"14px 16px", borderBottom:"1px solid var(--border)", background:"var(--bg-subtle)", display:"flex", gap:14}}>
        <Sk w={28} h={28}/>
        <Sk w={120} h={10}/>
        <div style={{flex:1}}/>
        <Sk w={70} h={10}/>
      </div>
      {Array.from({length:6}).map((_,i)=>(
        <div key={i} style={{padding:"14px 16px", borderBottom: i<5 ? "1px solid var(--border)" : "none", display:"flex", gap:14, alignItems:"center"}}>
          <Sk w={28} h={28}/>
          <div style={{flex:1, minWidth:0}}>
            <Sk w={Math.round(120 + Math.random()*100)} h={12}/>
            <div style={{height:6}}/>
            <Sk w={Math.round(80 + Math.random()*60)} h={10}/>
          </div>
          <Sk w={64} h={20} r={99}/>
          <Sk w={36} h={12}/>
        </div>
      ))}
    </CardS>
  );
}

function SkeletonCards() {
  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14}}>
      {Array.from({length:6}).map((_,i)=>(
        <CardS key={i} padding={18}>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:14}}>
            <Sk w={36} h={36} r={7}/>
            <Sk w={60} h={18} r={99}/>
          </div>
          <Sk w="80%" h={14}/>
          <div style={{height:6}}/>
          <Sk w="60%" h={11}/>
          <div style={{marginTop:18, paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between"}}>
            <Sk w={50} h={10}/>
            <Sk w={40} h={10}/>
          </div>
        </CardS>
      ))}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14, marginBottom:14}}>
        {Array.from({length:4}).map((_,i)=>(
          <CardS key={i} padding={20}>
            <Sk w={80} h={10}/>
            <div style={{height:14}}/>
            <Sk w={70} h={28}/>
            <div style={{height:8}}/>
            <Sk w={120} h={10}/>
          </CardS>
        ))}
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:14}}>
        <CardS padding={22}>
          <Sk w={140} h={14}/>
          <div style={{height:24}}/>
          <Sk w="100%" h={140} r={8}/>
        </CardS>
        <CardS padding={22}>
          <Sk w={140} h={14}/>
          <div style={{height:24}}/>
          <div style={{display:"flex", gap:24, alignItems:"center"}}>
            <Sk w={140} h={140} r={99}/>
            <div style={{flex:1, display:"flex", flexDirection:"column", gap:10}}>
              {Array.from({length:5}).map((_,i)=>(
                <div key={i} style={{display:"flex", justifyContent:"space-between"}}>
                  <Sk w={70+Math.random()*30} h={10}/>
                  <Sk w={30} h={10}/>
                </div>
              ))}
            </div>
          </div>
        </CardS>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATES
// ─────────────────────────────────────────────────────────────────────────────
function ErrorCard({ severity="error", title, body, code, primary, secondary }) {
  const tones = {
    error:   { bg:"rgb(220,38,38)",  bgSoft:"color-mix(in oklab, rgb(220,38,38) 8%, transparent)",  bd:"color-mix(in oklab, rgb(220,38,38) 30%, var(--border))" },
    warning: { bg:"rgb(218,113,38)", bgSoft:"color-mix(in oklab, rgb(218,113,38) 8%, transparent)", bd:"color-mix(in oklab, rgb(218,113,38) 30%, var(--border))" },
    offline: { bg:"var(--fg-subtle)",bgSoft:"var(--bg-subtle)",                                       bd:"var(--border)" },
  };
  const t = tones[severity];
  return (
    <div style={{
      padding:"22px 24px", borderRadius:12,
      background:t.bgSoft, border:"1px solid "+t.bd,
      display:"grid", gridTemplateColumns:"44px 1fr", gap:18, alignItems:"flex-start",
      maxWidth:640, margin:"0 auto",
    }}>
      <div style={{
        width:44, height:44, borderRadius:10,
        background:"color-mix(in oklab, "+t.bg+" 14%, var(--bg-elev))",
        color:t.bg, display:"grid", placeItems:"center",
        fontSize:22, fontWeight:700, flexShrink:0,
      }}>{severity==="offline" ? "○" : "!"}</div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:15, fontWeight:600, letterSpacing:"-0.015em", marginBottom:4}}>{title}</div>
        <div style={{fontSize:13, color:"var(--fg-muted)", lineHeight:1.55, marginBottom:12}}>{body}</div>
        {code && (
          <div style={{
            padding:"8px 10px", borderRadius:6, marginBottom:14,
            background:"var(--bg-elev)", border:"1px solid var(--border)",
            fontFamily:"var(--font-mono)", fontSize:11, color:"var(--fg-muted)", lineHeight:1.5,
            wordBreak:"break-all",
          }}>{code}</div>
        )}
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {primary && <BtnS variant="primary" size="sm">{primary}</BtnS>}
          {secondary && <BtnS variant="outline" size="sm">{secondary}</BtnS>}
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ tone="warning", icon="!", title, body, action }) {
  const map = {
    warning: { fg:"rgb(180,83,9)",  bg:"color-mix(in oklab, rgb(218,113,38) 10%, transparent)", bd:"color-mix(in oklab, rgb(218,113,38) 28%, var(--border))" },
    error:   { fg:"rgb(220,38,38)", bg:"color-mix(in oklab, rgb(220,38,38) 10%, transparent)",  bd:"color-mix(in oklab, rgb(220,38,38) 28%, var(--border))" },
    info:    { fg:"var(--accent-2)",bg:"color-mix(in oklab, var(--accent-2) 10%, transparent)", bd:"color-mix(in oklab, var(--accent-2) 28%, var(--border))" },
  };
  const t = map[tone];
  return (
    <div style={{
      padding:"10px 14px", borderRadius:8,
      background:t.bg, border:"1px solid "+t.bd,
      display:"flex", gap:10, alignItems:"center", flexWrap:"wrap",
    }}>
      <span style={{
        width:18, height:18, borderRadius:99, flexShrink:0,
        background:t.fg, color:"#fff", display:"grid", placeItems:"center",
        fontSize:11, fontWeight:700,
      }}>{icon}</span>
      <div style={{flex:1, minWidth:0}}>
        <span style={{fontSize:13, fontWeight:500, color:t.fg}}>{title}</span>
        {body && <span style={{fontSize:12.5, color:"var(--fg-muted)", marginLeft:8}}>· {body}</span>}
      </div>
      {action && <a style={{fontSize:12, color:t.fg, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap"}}>{action} →</a>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATES SHOWCASE
// ─────────────────────────────────────────────────────────────────────────────
function StatesShowcase({ setPage }) {
  const [section, setSection] = React.useState("empty");

  const sections = [
    { k:"empty",    l:"Пустые состояния" },
    { k:"loading",  l:"Загрузка (скелетоны)" },
    { k:"errors",   l:"Ошибки и оффлайн" },
    { k:"banners",  l:"Inline-бейджи" },
  ];

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <style>{`
        @keyframes sk-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
      <StateHeader
        crumb={["Loopboard","Состояния"]}
        title="UX-состояния"
        subtitle="Пустые экраны, загрузка, ошибки и баннеры — единый набор для всего продукта."
      />
      <div style={{padding:"0 28px", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <div style={{display:"flex", gap:0}}>
          {sections.map(s=>(
            <a key={s.k} onClick={()=>setSection(s.k)} style={{
              padding:"10px 14px", fontSize:13,
              cursor:"pointer",
              borderBottom: section===s.k ? "2px solid var(--fg)" : "2px solid transparent",
              color: section===s.k ? "var(--fg)" : "var(--fg-muted)",
              fontWeight: section===s.k ? 500 : 400,
              marginBottom:-1,
            }}>{s.l}</a>
          ))}
        </div>
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"28px 28px 48px", background:"var(--bg)"}}>
        {section === "empty" && (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(440px, 1fr))", gap:18, alignItems:"flex-start"}}>
            <EmptyState
              kind="applications"
              title="Пока нет заявок"
              body="Сохраняй вакансии в одном месте — добавь первую вручную или подключи поисковый цикл."
              primary="Новая заявка"
              secondary="Из поискового цикла"
              tip="Цикл собирает вакансии с 7 платформ автоматически."
            />
            <EmptyState
              kind="loops"
              title="Циклов поиска ещё нет"
              body="Один цикл превращает разрозненные ссылки на платформы в управляемый поток матчей."
              primary="Создать первый цикл"
              secondary="Открыть гайд"
            />
            <EmptyState
              kind="inbox"
              title="Inbox пуст"
              body="Сюда попадут письма от рекрутеров и системные уведомления Loopboard."
              secondary="Проверить интеграцию почты"
              tip="Подключи Gmail/Outlook в Настройках → Интеграции."
            />
            <EmptyState
              kind="contacts"
              title="Контакты не добавлены"
              body="Записывай рекрутеров и интервьюеров — Loopboard напомнит, когда пора писать."
              primary="Новый контакт"
              secondary="Импорт из CSV"
            />
            <EmptyState
              kind="search"
              title="По запросу ничего не найдено"
              body="Попробуй убрать часть слов или сбросить фильтры — возможно, ты слишком сузил выборку."
              primary="Сбросить фильтры"
              secondary="Изменить запрос"
            />
            <EmptyState
              kind="filter"
              title="Под эти фильтры пусто"
              body="Сейчас в этой вкладке нет ничего. Попробуй другой статус или включи 'Все источники'."
              primary="Сбросить фильтры"
            />
          </div>
        )}

        {section === "loading" && (
          <div style={{display:"flex", flexDirection:"column", gap:24}}>
            <div>
              <SLS><div style={{marginBottom:12}}>Список (таблица)</div></SLS>
              <SkeletonTable/>
            </div>
            <div>
              <SLS><div style={{marginBottom:12}}>Карточки</div></SLS>
              <SkeletonCards/>
            </div>
            <div>
              <SLS><div style={{marginBottom:12}}>Дашборд</div></SLS>
              <SkeletonDashboard/>
            </div>
          </div>
        )}

        {section === "errors" && (
          <div style={{display:"flex", flexDirection:"column", gap:18}}>
            <ErrorCard
              severity="error"
              title="Не удалось загрузить заявки"
              body="Сервер ответил ошибкой. Это могло произойти из-за временного сбоя. Попробуй обновить страницу или повторить запрос."
              code="Request ID: 7f2a-b8c1-2026 · 500 INTERNAL"
              primary="Повторить"
              secondary="Открыть статус сервиса"
            />
            <ErrorCard
              severity="warning"
              title="Источник AngelList отвечает с ошибкой"
              body="Не удалось получить вакансии с AngelList за последние 24 часа. Похоже, истёк access token — переподключи источник, чтобы возобновить синхронизацию."
              code="oauth2.invalid_grant — token expired at 2026-05-19T12:04:00Z"
              primary="Переподключить"
              secondary="Отключить источник"
            />
            <ErrorCard
              severity="offline"
              title="Нет соединения с интернетом"
              body="Ты работаешь оффлайн. Данные могут быть устаревшими — мы синхронизируем всё, как только подключение появится."
              primary="Попробовать снова"
              secondary="Работать оффлайн"
            />

            <div style={{textAlign:"center", padding:"40px 24px"}}>
              <div style={{
                fontSize:96, fontWeight:700, letterSpacing:"-0.06em", lineHeight:1,
                fontFamily:"var(--font-mono)",
                background:"linear-gradient(180deg, var(--fg) 30%, var(--fg-subtle))",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                backgroundClip:"text", color:"transparent",
              }}>500</div>
              <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.025em", marginTop:8}}>Что-то сломалось у нас</div>
              <div style={{fontSize:13, color:"var(--fg-muted)", marginTop:8, lineHeight:1.6, maxWidth:380, marginLeft:"auto", marginRight:"auto"}}>
                Команда уже получила уведомление. Попробуй обновить страницу через минуту.
              </div>
              <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:18}}>
                <BtnS variant="outline" size="md">Обновить</BtnS>
                <BtnS variant="primary" size="md">Написать в поддержку</BtnS>
              </div>
            </div>
          </div>
        )}

        {section === "banners" && (
          <div style={{display:"flex", flexDirection:"column", gap:12, maxWidth:760, margin:"0 auto"}}>
            <ErrorBanner tone="error"   title="Источник LinkedIn не отвечает" body="Последний успешный запрос — 3 часа назад." action="Переподключить"/>
            <ErrorBanner tone="warning" title="Профиль заполнен на 60%" body="Без полного профиля матч-скор менее точный." action="Заполнить"/>
            <ErrorBanner tone="warning" title="3 контакта ждут ответа > 5 дней" body="Долгое молчание снижает шанс пройти дальше." action="Открыть Inbox"/>
            <ErrorBanner tone="info"    title="Доступна новая версия 2.5" body="AI-чекер CV теперь поддерживает 5 языков." action="Что нового"/>
            <ErrorBanner tone="info"    title="Подключи Google Calendar" body="События по заявкам будут синхронизироваться автоматически." action="Подключить"/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND PALETTE (⌘K)
// ─────────────────────────────────────────────────────────────────────────────
const CMD_RECENT = [
  { l:"Notion · Senior Product Engineer", sub:"Заявка · Интервью", k:"app", page:"details" },
  { l:"Frontend EU",                       sub:"Цикл · 30 матчей",   k:"loop", page:"loopDetail" },
  { l:"Anna Petrova",                       sub:"Контакт · HR Notion", k:"contact", page:"contacts" },
];

const CMD_ACTIONS = [
  { l:"Создать заявку",      sub:"Новая запись в воронке",        k:"action", icon:"+", shortcut:"⌘N" },
  { l:"Создать цикл поиска", sub:"Сценарий + источники",            k:"action", icon:"↻", shortcut:"⌘L" },
  { l:"Добавить контакт",    sub:"Запись в адресную книгу",        k:"action", icon:"+", shortcut:null },
  { l:"Запустить все циклы", sub:"Обновить матчи сейчас",           k:"action", icon:"⟳", shortcut:"⌘R" },
  { l:"Импорт CV",            sub:"Загрузить PDF / DOCX",            k:"action", icon:"⎙", shortcut:null },
];

const CMD_NAV = [
  { l:"Обзор",        page:"dashboard",   icon:"⊞" },
  { l:"Заявки",       page:"applications",icon:"☰" },
  { l:"Доска",        page:"board",       icon:"▦" },
  { l:"Циклы",        page:"loops",       icon:"↻" },
  { l:"Контакты",     page:"contacts",    icon:"○" },
  { l:"Inbox",        page:"inbox",       icon:"✉" },
  { l:"Аналитика",    page:"analytics",   icon:"≡" },
  { l:"Календарь",    page:"calendar",    icon:"▤" },
  { l:"Настройки",    page:"settings",    icon:"⚙" },
];

const CMD_THEME = [
  { l:"Переключить на тёмную тему",   k:"theme", target:"dark",   icon:"●" },
  { l:"Переключить на светлую тему",  k:"theme", target:"light",  icon:"○" },
];

function CmdGroup({ label, items, query, sel, onSel, onPick, baseIdx }) {
  const filtered = items.filter(i => !query || i.l.toLowerCase().includes(query.toLowerCase()) || (i.sub||"").toLowerCase().includes(query.toLowerCase()));
  if (!filtered.length) return null;
  return (
    <div style={{padding:"6px 0"}}>
      <div style={{padding:"6px 14px 4px", fontSize:10.5, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--fg-subtle)"}}>{label}</div>
      {filtered.map((it,i)=>{
        const idx = baseIdx + i;
        const active = sel === idx;
        return (
          <div key={it.l}
            onMouseEnter={()=>onSel(idx)}
            onClick={()=>onPick(it)}
            style={{
              padding:"8px 14px", display:"flex", alignItems:"center", gap:12,
              background: active ? "var(--bg-subtle)" : "transparent",
              cursor:"pointer", fontSize:13,
              borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
            }}>
            <span style={{
              width:24, height:24, borderRadius:6, flexShrink:0,
              background:"var(--bg-subtle)", border:"1px solid var(--border)",
              display:"grid", placeItems:"center",
              fontSize:13, fontWeight:600, color:"var(--fg-muted)",
            }}>{it.icon || (it.k==="app" ? "≡" : it.k==="loop" ? "↻" : it.k==="contact" ? "@" : "•")}</span>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontWeight:500, letterSpacing:"-0.005em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{it.l}</div>
              {it.sub && <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{it.sub}</div>}
            </div>
            {it.shortcut && (
              <span style={{
                fontSize:10.5, padding:"2px 7px", borderRadius:5,
                background:"var(--bg-elev)", border:"1px solid var(--border)",
                color:"var(--fg-subtle)", fontFamily:"var(--font-mono)", flexShrink:0,
              }}>{it.shortcut}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CommandPalette({ setPage, onClose }) {
  const [query, setQuery] = React.useState("");
  const [sel, setSel] = React.useState(0);

  const all = [...CMD_RECENT, ...CMD_ACTIONS, ...CMD_NAV, ...CMD_THEME];
  const filtered = all.filter(i => !query || i.l.toLowerCase().includes(query.toLowerCase()) || (i.sub||"").toLowerCase().includes(query.toLowerCase()));

  const handlePick = (it) => {
    if (it.page) setPage(it.page);
    if (it.k === "theme") {
      const root = document.documentElement;
      root.style.setProperty("color-scheme", it.target);
    }
    onClose && onClose();
  };

  // group indices for keyboard nav
  const recentFiltered  = CMD_RECENT.filter(i => !query || i.l.toLowerCase().includes(query.toLowerCase()) || (i.sub||"").toLowerCase().includes(query.toLowerCase()));
  const actionsFiltered = CMD_ACTIONS.filter(i => !query || i.l.toLowerCase().includes(query.toLowerCase()) || (i.sub||"").toLowerCase().includes(query.toLowerCase()));
  const navFiltered     = CMD_NAV.filter(i => !query || i.l.toLowerCase().includes(query.toLowerCase()));
  const themeFiltered   = CMD_THEME.filter(i => !query || i.l.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{
      width:"min(640px, calc(100% - 32px))",
      background:"var(--bg-elev)", border:"1px solid var(--border)",
      borderRadius:14, overflow:"hidden",
      boxShadow:"0 32px 80px -16px rgba(0,0,0,0.30), 0 8px 24px -4px rgba(0,0,0,0.16)",
    }}>
      {/* Input */}
      <div style={{padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12}}>
        <span style={{color:"var(--fg-subtle)", display:"inline-flex"}}>{IconS.search}</span>
        <input
          value={query}
          onChange={e=>{setQuery(e.target.value); setSel(0);}}
          placeholder="Команда, страница, вакансия, контакт…"
          autoFocus
          style={{
            flex:1, border:"none", outline:"none", background:"transparent",
            fontSize:15, color:"var(--fg)", fontFamily:"inherit", padding:"4px 0",
          }}
        />
        <span style={{
          fontSize:10.5, padding:"3px 7px", borderRadius:5,
          background:"var(--bg-subtle)", border:"1px solid var(--border)",
          color:"var(--fg-subtle)", fontFamily:"var(--font-mono)",
        }}>ESC</span>
      </div>

      {/* Results */}
      <div style={{maxHeight:420, overflowY:"auto"}}>
        {filtered.length === 0 ? (
          <div style={{padding:"40px 24px", textAlign:"center"}}>
            <div style={{fontSize:14, fontWeight:500}}>Ничего не нашли</div>
            <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:6, lineHeight:1.55}}>
              Попробуй другие слова — поиск идёт по заявкам, циклам, контактам, командам и страницам.
            </div>
          </div>
        ) : (
          <>
            <CmdGroup label="Недавнее"   items={CMD_RECENT}  query={query} sel={sel} onSel={setSel} onPick={handlePick} baseIdx={0}/>
            <CmdGroup label="Действия"   items={CMD_ACTIONS} query={query} sel={sel} onSel={setSel} onPick={handlePick} baseIdx={recentFiltered.length}/>
            <CmdGroup label="Перейти на" items={CMD_NAV}     query={query} sel={sel} onSel={setSel} onPick={handlePick} baseIdx={recentFiltered.length + actionsFiltered.length}/>
            <CmdGroup label="Тема"        items={CMD_THEME}   query={query} sel={sel} onSel={setSel} onPick={handlePick} baseIdx={recentFiltered.length + actionsFiltered.length + navFiltered.length}/>
          </>
        )}
      </div>

      {/* Footer hints */}
      <div style={{
        padding:"8px 14px", borderTop:"1px solid var(--border)",
        background:"var(--bg-subtle)",
        display:"flex", gap:18, fontSize:10.5, color:"var(--fg-subtle)",
      }}>
        <span><kbd style={{fontFamily:"var(--font-mono)", padding:"1px 5px", borderRadius:3, background:"var(--bg-elev)", border:"1px solid var(--border)"}}>↑↓</kbd> навигация</span>
        <span><kbd style={{fontFamily:"var(--font-mono)", padding:"1px 5px", borderRadius:3, background:"var(--bg-elev)", border:"1px solid var(--border)"}}>↵</kbd> выбрать</span>
        <span><kbd style={{fontFamily:"var(--font-mono)", padding:"1px 5px", borderRadius:3, background:"var(--bg-elev)", border:"1px solid var(--border)"}}>esc</kbd> закрыть</span>
        <div style={{marginLeft:"auto"}}>Loopboard · поиск</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS CENTER
// ─────────────────────────────────────────────────────────────────────────────
const NOTIFS = [
  { type:"interview", t:"5 мин назад", title:"Stripe назначил финал",        body:"Финальный раунд с CTO и Product Lead — 22 мая 14:30.", unread:true,  related:"Stripe · Frontend Engineer" },
  { type:"offer",     t:"2 ч назад",   title:"Vercel прислал оффер 🎉",       body:"€140K + equity. Решение нужно дать до пятницы.",        unread:true,  related:"Vercel · DX Engineer" },
  { type:"system",    t:"4 ч назад",   title:"Цикл Frontend EU обновлён",     body:"Найдено 4 новых матча, 2 со скором ≥ 90.",              unread:true,  related:"Frontend EU" },
  { type:"reminder",  t:"вчера",        title:"Followup · GitHub",              body:"10 дней без ответа после технического. Стоит написать.", unread:false, related:"GitHub · Senior FE" },
  { type:"system",    t:"вчера",        title:"AngelList: ошибка подключения",   body:"Истёк OAuth-токен. Источник на паузе до переподключения.", unread:false, related:"Frontend EU" },
  { type:"reject",    t:"2 дня",        title:"Sentry — отказ после финала",    body:"Решили двигаться с другим кандидатом. Фидбек приложен.", unread:false, related:"Sentry · Full-stack" },
  { type:"message",   t:"3 дня",        title:"Anna Petrova ответила",          body:"«Подвинули встречу на следующую среду, удобно?»",       unread:false, related:"Notion · Senior PE" },
];

const N_ICONS = {
  interview: { i:"◆", c:"var(--accent)" },
  offer:     { i:"★", c:"rgb(5,150,105)" },
  system:    { i:"●", c:"var(--accent-2)" },
  reminder:  { i:"!", c:"rgb(218,113,38)" },
  reject:    { i:"×", c:"rgb(220,38,38)" },
  message:   { i:"✉", c:"var(--accent-2)" },
};

function NotificationsPanel({ setPage, onClose }) {
  const [tab, setTab] = React.useState("all");
  const filtered = NOTIFS.filter(n => tab==="all" ? true : tab==="unread" ? n.unread : n.type===tab);

  return (
    <div style={{
      width:420, maxHeight:"calc(100vh - 80px)",
      background:"var(--bg-elev)", border:"1px solid var(--border)",
      borderRadius:14, overflow:"hidden",
      boxShadow:"0 32px 80px -16px rgba(0,0,0,0.30), 0 8px 24px -4px rgba(0,0,0,0.16)",
      display:"flex", flexDirection:"column",
    }}>
      <div style={{padding:"14px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>Уведомления</div>
          <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>{NOTIFS.filter(n=>n.unread).length} непрочитанных</div>
        </div>
        <div style={{display:"flex", gap:6}}>
          <BtnS variant="ghost" size="sm">Прочитать все</BtnS>
          <button onClick={onClose} style={{
            width:26, height:26, borderRadius:6,
            background:"transparent", border:"1px solid var(--border)",
            color:"var(--fg-muted)", cursor:"pointer", fontSize:12, fontFamily:"inherit",
          }}>✕</button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{padding:"6px 10px", borderBottom:"1px solid var(--border)", display:"flex", gap:4, overflowX:"auto"}}>
        {[
          { k:"all",       l:"Все" },
          { k:"unread",    l:"Непрочитанные" },
          { k:"interview", l:"Интервью" },
          { k:"offer",     l:"Офферы" },
          { k:"system",    l:"Система" },
        ].map(t=>(
          <a key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:"4px 10px", borderRadius:99, fontSize:11.5,
            background: tab===t.k ? "var(--fg)" : "var(--bg-subtle)",
            color: tab===t.k ? "var(--bg)" : "var(--fg-muted)",
            border:"1px solid " + (tab===t.k ? "var(--fg)" : "var(--border)"),
            fontWeight: tab===t.k ? 500 : 400, cursor:"pointer", whiteSpace:"nowrap",
          }}>{t.l}</a>
        ))}
      </div>

      <div style={{flex:1, overflowY:"auto"}}>
        {filtered.length === 0 ? (
          <div style={{padding:"40px 24px", textAlign:"center"}}>
            <div style={{fontSize:13, color:"var(--fg-muted)"}}>В этой папке пока пусто</div>
          </div>
        ) : filtered.map((n,i)=>{
          const ic = N_ICONS[n.type];
          return (
            <div key={i} onClick={()=>{ setPage("details"); onClose && onClose(); }} style={{
              padding:"12px 16px",
              borderBottom: i<filtered.length-1 ? "1px solid var(--border)" : "none",
              display:"flex", gap:12, cursor:"pointer", alignItems:"flex-start",
              background: n.unread ? "color-mix(in oklab, var(--accent) 4%, transparent)" : "transparent",
            }}
            onMouseEnter={e=>e.currentTarget.style.background = n.unread ? "color-mix(in oklab, var(--accent) 7%, transparent)" : "var(--bg-subtle)"}
            onMouseLeave={e=>e.currentTarget.style.background = n.unread ? "color-mix(in oklab, var(--accent) 4%, transparent)" : "transparent"}
            >
              <div style={{
                width:28, height:28, borderRadius:99, flexShrink:0,
                background:"color-mix(in oklab, "+ic.c+" 14%, transparent)",
                color:ic.c, display:"grid", placeItems:"center",
                fontSize:13, fontWeight:700,
              }}>{ic.i}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:10, marginBottom:3}}>
                  <span style={{fontSize:13, fontWeight: n.unread ? 600 : 500, letterSpacing:"-0.005em"}}>
                    {n.unread && <span style={{display:"inline-block", width:6, height:6, borderRadius:99, background:"var(--accent)", marginRight:6, verticalAlign:"middle"}}/>}
                    {n.title}
                  </span>
                  <span style={{fontSize:10.5, color:"var(--fg-subtle)", flexShrink:0, whiteSpace:"nowrap"}}>{n.t}</span>
                </div>
                <div style={{fontSize:12, color:"var(--fg-muted)", lineHeight:1.5, marginBottom:4}}>{n.body}</div>
                <div style={{fontSize:11, color:"var(--fg-subtle)"}}>· {n.related}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{padding:"10px 14px", borderTop:"1px solid var(--border)", background:"var(--bg-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <a style={{fontSize:11.5, color:"var(--fg-muted)", cursor:"pointer"}}>Открыть Inbox →</a>
        <a style={{fontSize:11.5, color:"var(--fg-muted)", cursor:"pointer"}}>Настройки уведомлений</a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHELL: shows palette + panel side-by-side on a faux dashboard
// ─────────────────────────────────────────────────────────────────────────────
function CommandHubPage({ setPage }) {
  const [tab, setTab] = React.useState("palette");

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <StateHeader
        crumb={["Loopboard","Командный центр"]}
        title="Команд-палитра и уведомления"
        subtitle="Глобальный поиск (⌘K) и центр уведомлений из колокольчика в шапке."
      />
      <div style={{padding:"0 28px", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <div style={{display:"flex", gap:0}}>
          {[
            { k:"palette",   l:"Команд-палитра (⌘K)" },
            { k:"notifs",    l:"Центр уведомлений" },
          ].map(t=>(
            <a key={t.k} onClick={()=>setTab(t.k)} style={{
              padding:"10px 14px", fontSize:13,
              cursor:"pointer",
              borderBottom: tab===t.k ? "2px solid var(--fg)" : "2px solid transparent",
              color: tab===t.k ? "var(--fg)" : "var(--fg-muted)",
              fontWeight: tab===t.k ? 500 : 400, marginBottom:-1,
            }}>{t.l}</a>
          ))}
        </div>
      </div>

      <div style={{
        flex:1, position:"relative", overflow:"hidden",
        background:"var(--bg)",
      }}>
        {/* Backdrop: faux blurred app */}
        <div aria-hidden style={{
          position:"absolute", inset:0, zIndex:0,
          opacity:0.55, filter:"blur(2px)",
          backgroundImage:`
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px),
            radial-gradient(at 20% 30%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 50%),
            radial-gradient(at 80% 70%, color-mix(in oklab, var(--accent-2) 6%, transparent), transparent 50%)
          `,
          backgroundSize:"40px 40px, 40px 40px, 100% 100%, 100% 100%",
        }}/>
        <div style={{
          position:"absolute", inset:0, zIndex:1,
          background:"color-mix(in oklab, var(--bg) 40%, rgba(0,0,0,0.20))",
          backdropFilter:"blur(2px)",
        }}/>

        <div style={{position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column"}}>
          {tab === "palette" && (
            <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"60px 18px 40px", overflowY:"auto"}}>
              <CommandPalette setPage={setPage} onClose={()=>{}} />
              <div style={{maxWidth:640, marginTop:24, fontSize:12.5, color:"var(--fg-muted)", textAlign:"center", lineHeight:1.6}}>
                Открывается по <kbd style={{fontFamily:"var(--font-mono)", padding:"2px 6px", borderRadius:4, background:"var(--bg-elev)", border:"1px solid var(--border)"}}>⌘K</kbd> или <kbd style={{fontFamily:"var(--font-mono)", padding:"2px 6px", borderRadius:4, background:"var(--bg-elev)", border:"1px solid var(--border)"}}>Ctrl K</kbd>. Группы: недавнее → действия → навигация → тема. Стрелками выбор, Enter подтверждает.
              </div>
            </div>
          )}

          {tab === "notifs" && (
            <div style={{flex:1, display:"flex", justifyContent:"flex-end", padding:"24px 28px", overflow:"hidden", position:"relative"}}>
              {/* faux bell anchor */}
              <div style={{position:"absolute", top:24, right:28, display:"flex", alignItems:"center", gap:8}}>
                <button style={{
                  width:34, height:34, borderRadius:8,
                  background:"var(--bg-elev)", border:"1px solid var(--border)",
                  cursor:"pointer", display:"grid", placeItems:"center", color:"var(--fg)",
                  position:"relative",
                }}>
                  {IconS.bell}
                  <span style={{position:"absolute", top:4, right:6, width:8, height:8, borderRadius:99, background:"var(--accent)", border:"2px solid var(--bg-elev)"}}/>
                </button>
              </div>
              <div style={{paddingTop:48}}>
                <NotificationsPanel setPage={setPage} onClose={()=>{}}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
window.StatesAndCommandPages = { StatesShowcase, CommandHubPage };
