/* Group A pages — share global helpers from app.jsx via window */
const { Card, Pill, Btn, SectionLabel, Dot, Icon } = window.UI;

// ─────────────────────────────────────────────────────────────────────────────
// Shared page chrome
// ─────────────────────────────────────────────────────────────────────────────
function PageHeader({ crumb, title, subtitle, actions }) {
  return (
    <div style={{borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
      <div style={{padding:"16px 28px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:16, flexWrap:"wrap"}}>
          <div style={{minWidth:0, flex:1}}>
            {crumb && (
              <div style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-subtle)", marginBottom:4}}>
                {crumb.map((c,i) => (
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
          {actions && <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>{actions}</div>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATIONS PAGE — table-style list with filters
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_TONES = {
  saved:     {l:"Сохранено",  t:"neutral"},
  applied:   {l:"Отправлено", t:"info"},
  viewed:    {l:"Просмотрено",t:"info"},
  interview: {l:"Интервью",   t:"accent"},
  offer:     {l:"Предложение",t:"warning"},
  rejected:  {l:"Отказ",      t:"danger"},
  no_response:{l:"Без ответа",t:"neutral"},
  hired:     {l:"Принят",     t:"success"},
};

const APPS = [
  { c:"GitHub",  role:"Senior Frontend Engineer",   loc:"Berlin · Remote", status:"applied",   date:"06.05.2026", loop:"Frontend EU", match:92, fav:true },
  { c:"Notion",  role:"Product Engineer",            loc:"Munich",          status:"interview", date:"05.05.2026", loop:"Frontend EU", match:88, fav:false },
  { c:"Figma",   role:"Frontend Engineer · React",   loc:"Frankfurt",       status:"saved",     date:"04.05.2026", loop:"Frontend EU", match:81, fav:true },
  { c:"Datadog", role:"Software Engineer",           loc:"Remote · EU",     status:"applied",   date:"03.05.2026", loop:"Backend Remote", match:74, fav:false },
  { c:"Sentry",  role:"Full-stack Engineer",         loc:"Vienna",          status:"rejected",  date:"02.05.2026", loop:"Frontend EU", match:69, fav:false },
  { c:"Stripe",  role:"Frontend Engineer",           loc:"London · Hybrid", status:"interview", date:"01.05.2026", loop:"Frontend EU", match:90, fav:true },
  { c:"Linear",  role:"Product Engineer",            loc:"Remote · Global", status:"applied",   date:"30.04.2026", loop:"Backend Remote", match:85, fav:false },
  { c:"Vercel",  role:"DX Engineer",                 loc:"San Francisco",   status:"offer",     date:"28.04.2026", loop:"Frontend EU", match:94, fav:true },
  { c:"Klarna",  role:"Senior Frontend",             loc:"Stockholm",       status:"interview", date:"26.04.2026", loop:"Frontend EU", match:78, fav:false },
  { c:"Booking", role:"Engineer · React",            loc:"Amsterdam",       status:"no_response",date:"22.04.2026", loop:"Frontend EU", match:66, fav:false },
  { c:"Spotify", role:"Web Engineer",                loc:"Stockholm",       status:"viewed",    date:"19.04.2026", loop:"Frontend EU", match:72, fav:false },
  { c:"Mollie",  role:"Frontend Eng",                loc:"Amsterdam · Remote",status:"saved",   date:"15.04.2026", loop:"Frontend EU", match:68, fav:false },
];

function PipelineTabs({ active, setActive, counts }) {
  const tabs = [
    { k:"all",       l:"Все",        c: counts.all },
    { k:"saved",     l:"Сохранено",  c: counts.saved },
    { k:"applied",   l:"Отправлено", c: counts.applied },
    { k:"interview", l:"Интервью",   c: counts.interview },
    { k:"offer",     l:"Предложение",c: counts.offer },
    { k:"rejected",  l:"Отказ",      c: counts.rejected },
  ];
  return (
    <div style={{display:"flex", gap:2, alignItems:"flex-end", overflowX:"auto"}}>
      {tabs.map(t => (
        <a key={t.k} onClick={()=>setActive(t.k)} style={{
          padding:"8px 14px", fontSize:13, letterSpacing:"-0.01em",
          color: active===t.k ? "var(--fg)" : "var(--fg-muted)",
          fontWeight: active===t.k ? 500 : 400,
          borderBottom: active===t.k ? "2px solid var(--accent)" : "2px solid transparent",
          marginBottom:-1, cursor:"pointer", whiteSpace:"nowrap",
          display:"inline-flex", alignItems:"center", gap:7,
        }}>
          <span>{t.l}</span>
          <span style={{
            fontSize:10.5, padding:"1px 6px", borderRadius:99,
            background:"var(--bg-subtle)", border:"1px solid var(--border)",
            color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums",
          }}>{t.c}</span>
        </a>
      ))}
    </div>
  );
}

function ApplicationsPage({ setPage }) {
  const [active, setActive] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [view, setView] = React.useState("list"); // list / cards
  const counts = React.useMemo(() => {
    const c = { all: APPS.length, saved:0, applied:0, interview:0, offer:0, rejected:0 };
    APPS.forEach(a => { if (c[a.status] !== undefined) c[a.status]++; });
    return c;
  }, []);
  const filtered = APPS.filter(a => (active==="all"||a.status===active) && (!q || a.role.toLowerCase().includes(q.toLowerCase()) || a.c.toLowerCase().includes(q.toLowerCase())));

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <PageHeader
        crumb={["Loopboard","Воркспейс","Заявки"]}
        title="Мои заявки"
        subtitle="Создавай и отслеживай отклики в одном месте."
        actions={
          <>
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"6px 10px", borderRadius:8, height:32,
              border:"1px solid var(--border)", background:"var(--bg-subtle)",
              fontSize:12.5, color:"var(--fg-subtle)", width:220,
            }}>
              <span style={{display:"inline-flex"}}>{Icon.search}</span>
              <input
                value={q} onChange={e=>setQ(e.target.value)}
                placeholder="Поиск компаний и ролей"
                style={{
                  background:"transparent", border:"none", outline:"none",
                  color:"var(--fg)", fontSize:12.5, flex:1, fontFamily:"inherit", minWidth:0,
                }}
              />
            </div>
            <Btn variant="outline" size="sm" icon={Icon.filter}>Фильтры</Btn>
            <Btn variant="primary" size="sm" icon={Icon.plus}>Новая заявка</Btn>
          </>
        }
      />

      <div style={{padding:"14px 28px 0", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <PipelineTabs active={active} setActive={setActive} counts={counts} />
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"18px 28px 48px", background:"var(--bg)"}}>
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:14, gap:12, flexWrap:"wrap",
        }}>
          <div style={{fontSize:13, color:"var(--fg-muted)"}}>
            Показано <span style={{fontWeight:600, color:"var(--fg)", fontVariantNumeric:"tabular-nums"}}>{filtered.length}</span> из {APPS.length}
          </div>
          <div style={{display:"flex", gap:4, padding:2, background:"var(--bg-subtle)", borderRadius:7, border:"1px solid var(--border)"}}>
            {[{k:"list",l:"Список"},{k:"cards",l:"Карточки"}].map(v=>(
              <span key={v.k} onClick={()=>setView(v.k)} style={{
                padding:"4px 10px", fontSize:11.5, borderRadius:5,
                background: view===v.k ? "var(--bg-elev)" : "transparent",
                color: view===v.k ? "var(--fg)" : "var(--fg-subtle)",
                border: view===v.k ? "1px solid var(--border)" : "1px solid transparent",
                fontWeight: view===v.k ? 500 : 400, cursor:"pointer",
              }}>{v.l}</span>
            ))}
          </div>
        </div>

        {view === "list" ? (
          <Card padding={0}>
            <div style={{
              display:"grid", gridTemplateColumns:"32px minmax(0,2.4fr) minmax(0,1.2fr) 110px 110px 90px 30px",
              padding:"10px 16px", gap:14,
              fontSize:11, fontWeight:500, color:"var(--fg-subtle)",
              letterSpacing:"0.06em", textTransform:"uppercase",
              borderBottom:"1px solid var(--border)", background:"var(--bg-subtle)",
            }}>
              <div></div>
              <div>Должность · Компания</div>
              <div>Локация</div>
              <div>Статус</div>
              <div>Цикл</div>
              <div style={{textAlign:"right"}}>Матч</div>
              <div></div>
            </div>
            {filtered.map((a,i) => (
              <div key={i} onClick={()=>setPage && setPage("details")} style={{
                display:"grid", gridTemplateColumns:"32px minmax(0,2.4fr) minmax(0,1.2fr) 110px 110px 90px 30px",
                padding:"12px 16px", gap:14, alignItems:"center", cursor:"pointer",
                borderBottom: i<filtered.length-1 ? "1px solid var(--border)" : "none",
                cursor:"pointer", transition:"background 120ms",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--bg-subtle)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <div style={{
                  width:24, height:24, borderRadius:5,
                  background:"var(--bg-subtle)", border:"1px solid var(--border)",
                  display:"grid", placeItems:"center",
                  fontSize:10.5, fontWeight:600, color:"var(--fg-muted)",
                }}>{a.c.slice(0,1)}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:500, letterSpacing:"-0.005em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                    {a.fav && <span style={{color:"var(--accent)", marginRight:6}}>★</span>}
                    {a.role}
                  </div>
                  <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                    {a.c} · {a.date}
                  </div>
                </div>
                <div style={{fontSize:12, color:"var(--fg-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{a.loc}</div>
                <div><Pill tone={STATUS_TONES[a.status].t}>{STATUS_TONES[a.status].l}</Pill></div>
                <div style={{fontSize:11.5, color:"var(--fg-subtle)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{a.loop}</div>
                <div style={{display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end"}}>
                  <div style={{width:36, height:4, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                    <div style={{height:"100%", width:`${a.match}%`, background:a.match>=85?"rgb(5,150,105)":a.match>=70?"var(--accent)":"var(--fg-subtle)", borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:11, fontVariantNumeric:"tabular-nums", color:"var(--fg-muted)", fontWeight:500}}>{a.match}</span>
                </div>
                <div style={{color:"var(--fg-subtle)", display:"flex", justifyContent:"flex-end"}}>{Icon.arrow}</div>
              </div>
            ))}
          </Card>
        ) : (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:14}}>
            {filtered.map((a,i)=>(
              <Card key={i} padding={18} style={{cursor:"pointer"}} onClick={()=>setPage && setPage("details")}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12}}>
                  <div style={{
                    width:34, height:34, borderRadius:7,
                    background:"var(--bg-subtle)", border:"1px solid var(--border)",
                    display:"grid", placeItems:"center",
                    fontSize:13, fontWeight:600, color:"var(--fg-muted)",
                  }}>{a.c.slice(0,1)}</div>
                  <Pill tone={STATUS_TONES[a.status].t}>{STATUS_TONES[a.status].l}</Pill>
                </div>
                <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>{a.role}</div>
                <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:4}}>{a.c} · {a.loc}</div>
                <div style={{
                  marginTop:14, paddingTop:12, borderTop:"1px solid var(--border)",
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  fontSize:11.5, color:"var(--fg-subtle)",
                }}>
                  <span>{a.date}</span>
                  <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
                    Матч <span style={{color:"var(--fg)", fontWeight:600, fontVariantNumeric:"tabular-nums"}}>{a.match}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOARD PAGE — Kanban
// ─────────────────────────────────────────────────────────────────────────────
const COLUMNS = [
  { k:"ACTIVE",     l:"Активные",   c:"var(--accent-2)" },
  { k:"INTERVIEW",  l:"Интервью",   c:"#7c3aed" },
  { k:"OFFER",      l:"Предложение",c:"#d97706" },
  { k:"HIRED",      l:"Принят",     c:"#059669" },
  { k:"REJECTED",   l:"Отказ",      c:"#dc2626" },
  { k:"NO_RESPONSE",l:"Нет ответа", c:"var(--fg-subtle)" },
];

const BOARD_CARDS = {
  ACTIVE: [
    { c:"GitHub",  role:"Senior Frontend Engineer", loc:"Berlin · Remote",  date:"3д",  match:92, tags:["React","TypeScript","Remote"] },
    { c:"Datadog", role:"Software Engineer",        loc:"Remote · EU",      date:"5д",  match:74, tags:["Node","React"] },
    { c:"Linear",  role:"Product Engineer",         loc:"Remote",           date:"7д",  match:85, tags:["React","Rust"] },
    { c:"Mollie",  role:"Frontend Engineer",        loc:"Amsterdam",        date:"12д", match:68, tags:["React"] },
  ],
  INTERVIEW: [
    { c:"Notion", role:"Product Engineer",   loc:"Munich",         date:"завтра",    match:88, tags:["React","Tauri"], next:"Технический скрин" },
    { c:"Stripe", role:"Frontend Engineer",  loc:"London · Hybrid", date:"вт",        match:90, tags:["React","Ruby"], next:"Финальный раунд" },
    { c:"Klarna", role:"Senior Frontend",    loc:"Stockholm",      date:"чт",         match:78, tags:["React"], next:"HR-скрин" },
  ],
  OFFER: [
    { c:"Vercel", role:"DX Engineer", loc:"San Francisco", date:"вчера", match:94, tags:["Next.js","TypeScript"], next:"Решение до пятницы" },
  ],
  HIRED: [],
  REJECTED: [
    { c:"Sentry", role:"Full-stack Engineer", loc:"Vienna", date:"4д", match:69, tags:["React","Python"] },
    { c:"Gitlab", role:"Frontend Engineer",   loc:"Remote", date:"10д", match:62, tags:["Vue"] },
  ],
  NO_RESPONSE: [
    { c:"Booking",  role:"Engineer · React", loc:"Amsterdam", date:"14д", match:66, tags:["React"] },
    { c:"Spotify",  role:"Web Engineer",     loc:"Stockholm", date:"21д", match:72, tags:["React"] },
  ],
};

function BoardCard({ card, accent, onOpen }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); onOpen&&onOpen(); } }}
      style={{
        padding:12, marginBottom:8,
        background:"var(--bg-elev)", border:"1px solid var(--border)",
        borderRadius:8, cursor:"pointer",
        transition:"all 120ms",
        boxShadow:"var(--shadow)",
      }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border-strong)"; e.currentTarget.style.transform="translateY(-1px)"}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"}}
    >
      <div style={{display:"flex", alignItems:"flex-start", gap:8, marginBottom:6}}>
        <div style={{
          width:22, height:22, borderRadius:5,
          background:"var(--bg-subtle)", border:"1px solid var(--border)",
          display:"grid", placeItems:"center", flexShrink:0,
          fontSize:10, fontWeight:600, color:"var(--fg-muted)",
        }}>{card.c.slice(0,1)}</div>
        <div style={{minWidth:0, flex:1}}>
          <div style={{fontSize:12.5, fontWeight:500, letterSpacing:"-0.005em"}}>{card.role}</div>
          <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:1}}>{card.c}</div>
        </div>
      </div>
      <div style={{fontSize:11, color:"var(--fg-subtle)", marginBottom:8}}>{card.loc}</div>
      {card.tags && (
        <div style={{display:"flex", flexWrap:"wrap", gap:4, marginBottom:8}}>
          {card.tags.slice(0,3).map(t=>(
            <span key={t} style={{
              fontSize:10, padding:"2px 6px", borderRadius:4,
              background:"var(--bg-subtle)", color:"var(--fg-muted)",
              border:"1px solid var(--border)",
            }}>{t}</span>
          ))}
        </div>
      )}
      {card.next && (
        <div style={{
          padding:"6px 8px", marginBottom:8,
          background:"color-mix(in oklab, var(--accent) 7%, transparent)",
          border:"1px solid color-mix(in oklab, var(--accent) 22%, transparent)",
          borderRadius:6, fontSize:10.5, color:"var(--fg)",
          display:"flex", alignItems:"center", gap:6,
        }}>
          <span style={{color:"var(--accent)"}}>{Icon.calendar}</span>
          {card.next}
        </div>
      )}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        paddingTop:6, borderTop:"1px solid var(--border)",
        fontSize:10.5, color:"var(--fg-subtle)",
      }}>
        <span>{card.date}</span>
        <span style={{display:"inline-flex", alignItems:"center", gap:5}}>
          <span style={{
            width:24, height:3, background:"var(--bg-subtle)",
            borderRadius:99, overflow:"hidden",
          }}>
            <div style={{height:"100%", width:`${card.match}%`, background:accent}}/>
          </span>
          <span style={{fontVariantNumeric:"tabular-nums"}}>{card.match}</span>
        </span>
      </div>
    </div>
  );
}

function BoardPage({ setPage }) {
  const total = Object.values(BOARD_CARDS).reduce((a,b)=>a+b.length, 0);

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <PageHeader
        crumb={["Loopboard","Воркспейс","Доска"]}
        title="Доска заявок"
        subtitle="Перетаскивай вакансии между колонками, чтобы менять статус."
        actions={
          <>
            <Btn variant="outline" size="sm" icon={Icon.filter}>Все циклы</Btn>
            <Btn variant="outline" size="sm" icon={Icon.search}>Поиск</Btn>
            <Btn variant="primary" size="sm" icon={Icon.plus}>Новая заявка</Btn>
          </>
        }
      />

      <div style={{
        padding:"12px 28px",
        borderBottom:"1px solid var(--border)",
        background:"var(--bg)",
        display:"flex", gap:18, alignItems:"center", flexWrap:"wrap",
      }}>
        <div style={{display:"flex", alignItems:"center", gap:6, fontSize:12.5}}>
          <span style={{color:"var(--fg-subtle)"}}>Всего на доске:</span>
          <span style={{fontWeight:600, fontVariantNumeric:"tabular-nums"}}>{total}</span>
        </div>
        <div style={{height:14, width:1, background:"var(--border)"}}/>
        <div style={{display:"flex", gap:14, fontSize:11.5, flexWrap:"wrap"}}>
          {COLUMNS.map(c=>(
            <span key={c.k} style={{display:"inline-flex", alignItems:"center", gap:6, color:"var(--fg-muted)"}}>
              <span style={{width:8, height:8, borderRadius:2, background:c.c}}/>
              {c.l} · <span style={{fontVariantNumeric:"tabular-nums", color:"var(--fg)"}}>{(BOARD_CARDS[c.k]||[]).length}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{flex:1, overflow:"auto", padding:"18px 28px", background:"var(--bg)"}}>
        <div style={{
          display:"grid", gridAutoFlow:"column", gridAutoColumns:"280px",
          gap:14, height:"100%", alignItems:"flex-start",
        }}>
          {COLUMNS.map(col => (
            <div key={col.k} style={{
              background:"var(--bg-subtle)", border:"1px solid var(--border)",
              borderRadius:10, padding:10, display:"flex", flexDirection:"column",              maxHeight:"100%",
            }}>
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"4px 4px 10px",
              }}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{width:8, height:8, borderRadius:2, background:col.c}}/>
                  <span style={{fontSize:13, fontWeight:600, letterSpacing:"-0.01em"}}>{col.l}</span>
                  <span style={{
                    fontSize:10.5, padding:"1px 6px", borderRadius:99,
                    background:"var(--bg-elev)", border:"1px solid var(--border)",
                    color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums",
                  }}>{(BOARD_CARDS[col.k]||[]).length}</span>
                </div>
                <button style={{
                  background:"transparent", border:"none", color:"var(--fg-subtle)",
                  cursor:"pointer", padding:4, borderRadius:4, display:"flex",
                }}>{Icon.plus}</button>
              </div>
              <div style={{flex:1, overflowY:"auto", paddingRight:2}}>
                {(BOARD_CARDS[col.k]||[]).length === 0 ? (
                  <div style={{
                    padding:"24px 12px", textAlign:"center",
                    border:"1px dashed var(--border)", borderRadius:8,
                    fontSize:11.5, color:"var(--fg-subtle)",
                  }}>Перетащи вакансии сюда</div>
                ) : (
                  (BOARD_CARDS[col.k]||[]).map((card,i) => <BoardCard key={i} card={card} accent={col.c} onOpen={()=>setPage("details")} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION DETAILS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function DetailsPage({ setPage }) {
  const events = [
    { d:"Сегодня · 14:30",  t:"Запланирован технический скрин",   tone:"info" },
    { d:"Вчера · 09:15",    t:"Получен ответ от рекрутера",       tone:"success" },
    { d:"3 мая · 16:00",    t:"Отклик отправлен",                  tone:"neutral" },
    { d:"3 мая · 11:45",    t:"Заметка добавлена · «уточнить стек»", tone:"neutral" },
    { d:"2 мая · 18:20",    t:"Заявка создана из цикла Frontend EU", tone:"neutral" },
  ];

  const stages = ["Сохранено","Отправлено","Просмотрено","Интервью","Предложение"];
  const currentStage = 3;

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <PageHeader
        crumb={["Loopboard","Заявки","Notion"]}
        title="Product Engineer"
        subtitle="Notion · Munich · Создано 2 мая 2026"
        actions={
          <>
            <Btn variant="ghost" size="sm" onClick={()=>setPage("applications")}>← К списку</Btn>
            <Btn variant="outline" size="sm" icon={Icon.link}>Открыть вакансию</Btn>
            <Btn variant="primary" size="sm" icon={Icon.plus}>Действие</Btn>
          </>
        }
      />
      <div style={{flex:1, overflowY:"auto", padding:"24px 28px 48px", background:"var(--bg)"}}>
        {/* Stage progression */}
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
            <div>
              <SectionLabel>Воронка по этой заявке</SectionLabel>
              <div style={{fontSize:14, fontWeight:600, marginTop:4}}>Сейчас: Интервью</div>
            </div>
            <Pill tone="accent">● Активная</Pill>
          </div>
          <div style={{display:"flex", gap:6, alignItems:"center"}}>
            {stages.map((s,i)=>(
              <React.Fragment key={s}>
                <div style={{flex:1}}>
                  <div style={{
                    height:4, borderRadius:99, marginBottom:6,
                    background: i<=currentStage ? "var(--accent)" : "var(--bg-subtle)",
                  }}/>
                  <div style={{fontSize:11, color: i===currentStage ? "var(--fg)" : "var(--fg-subtle)", fontWeight: i===currentStage ? 500 : 400}}>
                    {i+1}. {s}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </Card>

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px,1fr))", gap:14}}>
          {/* Left column */}
          <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
            <Card>
              <SectionLabel>Описание</SectionLabel>
              <div style={{fontSize:13, lineHeight:1.6, color:"var(--fg-muted)", marginTop:10}}>
                We're looking for a product-minded engineer to join our editor team.
                You'll work across the stack on rich-text and collaboration features,
                ship at high quality, and shape the product direction with PMs and designers.
              </div>
              <div style={{display:"flex", flexWrap:"wrap", gap:6, marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)"}}>
                {["React","TypeScript","Rust","ProseMirror","Realtime"].map(t=>(
                  <Pill key={t} tone="neutral">{t}</Pill>
                ))}
              </div>
            </Card>

            <Card padding={0}>
              <div style={{padding:"16px 18px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--border)"}}>
                <div>
                  <div style={{fontSize:14, fontWeight:600}}>Лента событий</div>
                  <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:2}}>{events.length} записей</div>
                </div>
                <Btn variant="ghost" size="sm" icon={Icon.plus}>Заметка</Btn>
              </div>
              <div style={{position:"relative"}}>
                {events.map((e,i)=>(
                  <div key={i} style={{
                    padding:"12px 18px 12px 38px", position:"relative",
                    borderBottom: i<events.length-1 ? "1px solid var(--border)" : "none",
                  }}>
                    <span style={{
                      position:"absolute", left:18, top:18,
                      width:9, height:9, borderRadius:99,
                      background: e.tone==="success" ? "rgb(5,150,105)" : e.tone==="info" ? "var(--accent-2)" : "var(--fg-subtle)",
                      border:"2px solid var(--bg-elev)",
                      boxShadow:"0 0 0 1px var(--border)",
                    }}/>
                    {i<events.length-1 && (
                      <span style={{
                        position:"absolute", left:22, top:28, bottom:-1, width:1,
                        background:"var(--border)",
                      }}/>
                    )}
                    <div style={{fontSize:11, color:"var(--fg-subtle)", marginBottom:2}}>{e.d}</div>
                    <div style={{fontSize:13, color:"var(--fg)"}}>{e.t}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
            <Card>
              <SectionLabel>Информация</SectionLabel>
              <div style={{display:"grid", gap:10, marginTop:12, fontSize:13}}>
                {[
                  {l:"Компания", v:"Notion"},
                  {l:"Локация",  v:"Munich · Hybrid"},
                  {l:"Зарплата", v:"€95k–€130k"},
                  {l:"Источник", v:"LinkedIn"},
                  {l:"Цикл",     v:"Frontend EU"},
                  {l:"Создано",  v:"2 мая 2026"},
                ].map(r=>(
                  <div key={r.l} style={{
                    display:"flex", justifyContent:"space-between", gap:14,
                    paddingBottom:8, borderBottom:"1px solid var(--border)",
                  }}>
                    <span style={{color:"var(--fg-subtle)"}}>{r.l}</span>
                    <span style={{fontWeight:500, textAlign:"right"}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionLabel>Контакт</SectionLabel>
              <div style={{display:"flex", alignItems:"center", gap:12, marginTop:12}}>
                <div style={{
                  width:40, height:40, borderRadius:99,
                  background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color:"#fff", display:"grid", placeItems:"center",
                  fontSize:13, fontWeight:600,
                }}>АП</div>
                <div>
                  <div style={{fontSize:13.5, fontWeight:500}}>Анна Петрова</div>
                  <div style={{fontSize:11.5, color:"var(--fg-subtle)"}}>HR · Notion</div>
                </div>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:14, fontSize:12.5}}>
                <a style={{color:"var(--fg-muted)", display:"flex", justifyContent:"space-between"}}>
                  <span>anna@notion.so</span><span style={{color:"var(--fg-subtle)"}}>{Icon.arrowUR}</span>
                </a>
                <a style={{color:"var(--fg-muted)", display:"flex", justifyContent:"space-between"}}>
                  <span>+49 89 123 45 67</span><span style={{color:"var(--fg-subtle)"}}>{Icon.arrowUR}</span>
                </a>
              </div>
            </Card>

            <Card>
              <SectionLabel>Совпадение по CV</SectionLabel>
              <div style={{display:"flex", alignItems:"baseline", gap:10, marginTop:10}}>
                <span style={{fontSize:30, fontWeight:600, letterSpacing:"-0.025em"}}>88</span>
                <span style={{fontSize:13, color:"var(--fg-muted)"}}>/ 100 · хорошо</span>
              </div>
              <div style={{height:5, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden", marginTop:10}}>
                <div style={{height:"100%", width:"88%", background:"var(--accent)", borderRadius:99}}/>
              </div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:10}}>
                Сильные совпадения: React, TypeScript. Стоит добавить: ProseMirror.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOPS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const LOOPS = [
  { name:"Frontend EU",         role:"Frontend Engineer",   loc:"Berlin · Frankfurt · Remote", radius:30, mode:"Гибрид/Remote", lang:"de/en", platforms:4, matches:24, applied:14, fresh:7,  active:true },
  { name:"Backend Remote",      role:"Backend Engineer",    loc:"Remote EU", radius:0,          mode:"Только удалённо", lang:"en",      platforms:5, matches:18, applied:6,  fresh:3,  active:true },
  { name:"Senior React",        role:"Senior Frontend",     loc:"DACH",      radius:50,         mode:"Любой",            lang:"de/en", platforms:3, matches:12, applied:3,  fresh:1,  active:true },
  { name:"Engineering Manager", role:"EM · Product Eng",    loc:"Berlin",    radius:25,         mode:"Гибрид",           lang:"en",     platforms:2, matches:5,  applied:1,  fresh:0,  active:false },
];

function LoopsPage({ setPage }) {
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <PageHeader
        crumb={["Loopboard","Воркспейс","Циклы"]}
        title="Поисковые циклы"
        subtitle="Создай цикл и отслеживай найденные вакансии."
        actions={
          <>
            <Btn variant="outline" size="sm" icon={Icon.filter}>Все циклы</Btn>
            <Btn variant="primary" size="sm" icon={Icon.plus}>Новый цикл</Btn>
          </>
        }
      />
      <div style={{flex:1, overflowY:"auto", padding:"24px 28px 48px", background:"var(--bg)"}}>
        {/* Stats overview */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14, marginBottom:18}}>
          {[
            {l:"Всего циклов", v:LOOPS.length, sub:"Активных: 3"},
            {l:"Найдено вакансий", v:LOOPS.reduce((a,l)=>a+l.matches,0), sub:"За 30 дней"},
            {l:"Откликов", v:LOOPS.reduce((a,l)=>a+l.applied,0), sub:"Из всех циклов"},
            {l:"Новые сегодня", v:LOOPS.reduce((a,l)=>a+l.fresh,0), sub:"Свежие матчи"},
          ].map(s=>(
            <Card key={s.l} padding={18}>
              <SectionLabel>{s.l}</SectionLabel>
              <div style={{fontSize:28, fontWeight:600, letterSpacing:"-0.025em", marginTop:8, fontVariantNumeric:"tabular-nums"}}>{s.v}</div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:4}}>{s.sub}</div>
            </Card>
          ))}
        </div>

        {/* Loops list */}
        <div style={{display:"grid", gap:12}}>
          {LOOPS.map((l,i)=>(
            <Card key={i} padding={20} style={{cursor:"pointer", transition:"all 120ms"}} onClick={()=>setPage && setPage("loopDetail")}>
              <div style={{display:"grid", gridTemplateColumns:"minmax(0,1.4fr) minmax(0,2fr) minmax(0,1fr)", gap:24, alignItems:"center"}}>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6}}>
                    {l.active
                      ? <Pill tone="success">● Активный</Pill>
                      : <Pill tone="neutral">○ Пауза</Pill>
                    }
                    <span style={{fontSize:11.5, color:"var(--fg-subtle)"}}>{l.platforms} платформ</span>
                  </div>
                  <div style={{fontSize:15, fontWeight:600, letterSpacing:"-0.02em"}}>{l.name}</div>
                  <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:3}}>{l.role}</div>
                </div>

                <div style={{minWidth:0, display:"flex", flexWrap:"wrap", gap:6}}>
                  <Pill tone="neutral">{l.loc}</Pill>
                  {l.radius>0 && <Pill tone="neutral">Радиус {l.radius} км</Pill>}
                  <Pill tone="neutral">{l.mode}</Pill>
                  <Pill tone="neutral">Язык {l.lang}</Pill>
                </div>

                <div style={{display:"flex", justifyContent:"flex-end", alignItems:"center", gap:18}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11, color:"var(--fg-subtle)"}}>Матчи · Отклики · Сегодня</div>
                    <div style={{display:"flex", gap:14, marginTop:6, justifyContent:"flex-end"}}>
                      <span style={{fontSize:18, fontWeight:600, fontVariantNumeric:"tabular-nums"}}>{l.matches}</span>
                      <span style={{fontSize:18, fontWeight:600, fontVariantNumeric:"tabular-nums", color:"var(--accent)"}}>{l.applied}</span>
                      <span style={{fontSize:18, fontWeight:600, fontVariantNumeric:"tabular-nums", color: l.fresh>0 ? "rgb(5,150,105)" : "var(--fg-subtle)"}}>+{l.fresh}</span>
                    </div>
                  </div>
                  <Btn variant="outline" size="sm" iconRight={Icon.arrow} onClick={(e)=>{e.stopPropagation(); setPage && setPage("loopDetail");}}>Открыть</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHES PAGE — list of jobs found by a loop
// ─────────────────────────────────────────────────────────────────────────────
const MATCHES = [
  { c:"GitHub",   role:"Senior Frontend Engineer",  loc:"Berlin · Remote",  src:"LinkedIn",  posted:"2д",  match:92, salary:"€90–120k", saved:true,  applied:false },
  { c:"Notion",   role:"Product Engineer",          loc:"Munich",            src:"StepStone", posted:"3д",  match:88, salary:"€95–130k", saved:true,  applied:true },
  { c:"Stripe",   role:"Frontend Engineer",         loc:"London · Hybrid",   src:"LinkedIn",  posted:"4д",  match:90, salary:"£80–110k", saved:true,  applied:true },
  { c:"Vercel",   role:"DX Engineer",               loc:"San Francisco",     src:"Сайт",      posted:"5д",  match:94, salary:"$140–190k",saved:true,  applied:true },
  { c:"Linear",   role:"Product Engineer",          loc:"Remote · Global",   src:"Сайт",      posted:"6д",  match:85, salary:"$100–160k",saved:false, applied:false },
  { c:"Datadog",  role:"Software Engineer",         loc:"Remote · EU",       src:"Indeed",    posted:"6д",  match:74, salary:"€85–115k", saved:true,  applied:true },
  { c:"Spotify",  role:"Web Engineer",              loc:"Stockholm",         src:"LinkedIn",  posted:"8д",  match:72, salary:"SEK 700–950k", saved:false, applied:false },
  { c:"Klarna",   role:"Senior Frontend",           loc:"Stockholm",         src:"StepStone", posted:"9д",  match:78, salary:"SEK 850k+", saved:true,  applied:true },
  { c:"Mollie",   role:"Frontend Engineer",         loc:"Amsterdam · Remote",src:"Indeed",    posted:"11д", match:68, salary:"€70–95k",  saved:true,  applied:false },
  { c:"Sentry",   role:"Full-stack Engineer",       loc:"Vienna",            src:"XING",      posted:"14д", match:69, salary:"€80–105k", saved:false, applied:false },
];

function MatchesPage({ setPage }) {
  const [tab, setTab] = React.useState("all");
  const tabs = [
    { k:"all",     l:"Все",         c: MATCHES.length },
    { k:"saved",   l:"Сохранённые", c: MATCHES.filter(m=>m.saved).length },
    { k:"applied", l:"Отклики",     c: MATCHES.filter(m=>m.applied).length },
    { k:"new",     l:"Новые",       c: MATCHES.filter(m=>!m.saved&&!m.applied).length },
  ];
  const filtered = MATCHES.filter(m =>
    tab==="all" ? true :
    tab==="saved" ? m.saved :
    tab==="applied" ? m.applied :
    !m.saved && !m.applied
  );

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <PageHeader
        crumb={["Loopboard","Циклы","Frontend EU"]}
        title="Матчи: Frontend EU"
        subtitle="24 вакансии · 3 платформы · обновлено 2 минуты назад"
        actions={
          <>
            <Btn variant="ghost" size="sm">← К циклам</Btn>
            <Btn variant="outline" size="sm" icon={Icon.filter}>Фильтры</Btn>
            <Btn variant="outline" size="sm" icon={Icon.loop}>Обновить</Btn>
            <Btn variant="primary" size="sm" icon={Icon.plus}>Добавить вручную</Btn>
          </>
        }
      />

      {/* Loop badges row */}
      <div style={{padding:"12px 28px", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <div style={{display:"flex", flexWrap:"wrap", gap:6, alignItems:"center"}}>
          <span style={{fontSize:11.5, color:"var(--fg-subtle)", marginRight:4}}>Параметры цикла:</span>
          {["Frontend Engineer","Berlin · Frankfurt","Радиус 30 км","Гибрид/Remote","de/en","Опубликовано: 7д"].map(b=>(
            <Pill key={b} tone="neutral">{b}</Pill>
          ))}
        </div>
      </div>

      <div style={{padding:"14px 28px 0", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <div style={{display:"flex", gap:2, alignItems:"flex-end", overflowX:"auto"}}>
          {tabs.map(t=>(
            <a key={t.k} onClick={()=>setTab(t.k)} style={{
              padding:"8px 14px", fontSize:13, letterSpacing:"-0.01em",
              color: tab===t.k ? "var(--fg)" : "var(--fg-muted)",
              fontWeight: tab===t.k ? 500 : 400,
              borderBottom: tab===t.k ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom:-1, cursor:"pointer", whiteSpace:"nowrap",
              display:"inline-flex", alignItems:"center", gap:7,
            }}>
              <span>{t.l}</span>
              <span style={{
                fontSize:10.5, padding:"1px 6px", borderRadius:99,
                background:"var(--bg-subtle)", border:"1px solid var(--border)",
                color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums",
              }}>{t.c}</span>
            </a>
          ))}
        </div>
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"18px 28px 48px", background:"var(--bg)"}}>
        <Card padding={0}>
          {filtered.map((m,i)=>(
            <div key={i} onClick={()=>setPage && setPage("details")} style={{
              padding:"14px 18px", cursor:"pointer",
              borderBottom: i<filtered.length-1 ? "1px solid var(--border)" : "none",
              display:"flex", alignItems:"center", gap:14,
              cursor:"pointer", transition:"background 120ms",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--bg-subtle)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <div style={{
                width:36, height:36, borderRadius:7,
                background:"var(--bg-subtle)", border:"1px solid var(--border)",
                display:"grid", placeItems:"center", flexShrink:0,
                fontSize:13, fontWeight:600, color:"var(--fg-muted)",
              }}>{m.c.slice(0,1)}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap"}}>
                  <span style={{fontSize:13.5, fontWeight:500, letterSpacing:"-0.005em"}}>{m.role}</span>
                  {m.applied && <Pill tone="info">Отклик</Pill>}
                  {!m.applied && m.saved && <Pill tone="neutral">Сохранено</Pill>}
                  {!m.saved && !m.applied && <Pill tone="success">Новая</Pill>}
                </div>
                <div style={{fontSize:11.5, color:"var(--fg-subtle)"}}>
                  {m.c} · {m.loc} · <span style={{color:"var(--accent-2)"}}>{m.src}</span> · {m.posted}
                </div>
              </div>
              <div style={{textAlign:"right", flexShrink:0, fontSize:12, color:"var(--fg-muted)", minWidth:90}}>
                {m.salary}
              </div>
              <div style={{display:"flex", alignItems:"center", gap:6, flexShrink:0, width:80, justifyContent:"flex-end"}}>
                <div style={{width:36, height:4, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                  <div style={{height:"100%", width:`${m.match}%`, background: m.match>=85?"rgb(5,150,105)":m.match>=70?"var(--accent)":"var(--fg-subtle)", borderRadius:99}}/>
                </div>
                <span style={{fontSize:11.5, fontVariantNumeric:"tabular-nums", color:"var(--fg-muted)", fontWeight:500}}>{m.match}</span>
              </div>
              <button style={{
                background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)",
                padding:"6px 10px", borderRadius:6, fontSize:11.5, cursor:"pointer", flexShrink:0,
                display:"inline-flex", alignItems:"center", gap:4,
              }}>Открыть {Icon.arrowUR}</button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// Export
window.GroupAPages = { ApplicationsPage, BoardPage, DetailsPage, LoopsPage, MatchesPage };
