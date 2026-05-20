/* Loop Detail — opens when clicking "Открыть" on a loop card */
const { Card: CardLD, Pill: PillLD, Btn: BtnLD, SectionLabel: SLLD, Icon: IconLD } = window.UI;

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const LD_LOOP = {
  name: "Frontend EU",
  role: "Frontend Engineer (Senior / Middle)",
  loc:  "Berlin, Frankfurt, Munich, Remote EU",
  radius: 30,
  mode: ["Hybrid", "Remote"],
  lang: ["de", "en"],
  postedWithin: 7,
  include: ["react", "typescript", "next"],
  exclude: ["lead", "manager", "zeitarbeit"],
  excludeAgencies: true,
  active: true,
  created: "12 апр 2026",
  lastRun: "2 мин назад",
  nextRun: "через 13 мин",
};

const LD_STATS = [
  { l:"Матчи (30д)",  v:"30",  d:"+9",  pos:true,  sub:"новых сегодня · 4" },
  { l:"Отклики",      v:"14",  d:"+3",  pos:true,  sub:"47% от матчей" },
  { l:"Интервью",     v:"6",   d:"+2",  pos:true,  sub:"43% от откликов" },
  { l:"Конверсия",    v:"24%", d:"+5%", pos:true,  sub:"отклик → интервью" },
];

const LD_SOURCES = [
  { k:"linkedin",  l:"LinkedIn",   color:"#0a66c2", matches:12, applied:6, conv:50, lastRun:"2 мин",  status:"ok",     enabled:true,  err:null },
  { k:"stepstone", l:"StepStone",  color:"#005c5c", matches:7,  applied:4, conv:57, lastRun:"5 мин",  status:"ok",     enabled:true,  err:null },
  { k:"indeed",    l:"Indeed",     color:"#2164f3", matches:5,  applied:2, conv:40, lastRun:"14 мин", status:"ok",     enabled:true,  err:null },
  { k:"xing",      l:"XING",       color:"#006567", matches:3,  applied:1, conv:33, lastRun:"1 ч",    status:"slow",   enabled:true,  err:null },
  { k:"hn",        l:"HN Hiring",  color:"#ff6600", matches:2,  applied:1, conv:50, lastRun:"3 ч",    status:"ok",     enabled:true,  err:null },
  { k:"angellist", l:"AngelList",  color:"#000",    matches:0,  applied:0, conv:0,  lastRun:"1 д",    status:"error",  enabled:true,  err:"Истёк access token" },
  { k:"glassdoor", l:"Glassdoor",  color:"#0caa41", matches:0,  applied:0, conv:0,  lastRun:"—",      status:"off",    enabled:false, err:null },
];

const LD_RUNS = [
  { t:"сегодня, 12:34", d:"2 мин назад", found:4, new:4, dur:"38с", state:"ok",    sources:["linkedin","stepstone"] },
  { t:"сегодня, 10:18", d:"2 ч назад",   found:2, new:1, dur:"42с", state:"ok",    sources:["indeed","xing","hn"] },
  { t:"сегодня, 08:00", d:"5 ч назад",   found:3, new:3, dur:"35с", state:"ok",    sources:["linkedin"] },
  { t:"вчера, 18:00",   d:"вчера",       found:5, new:4, dur:"52с", state:"ok",    sources:["linkedin","stepstone","indeed"] },
  { t:"вчера, 09:00",   d:"вчера",       found:0, new:0, dur:"—",   state:"error", sources:["angellist"], err:"AngelList: 401 Unauthorized" },
  { t:"2 дня, 18:00",   d:"2 дня",       found:6, new:5, dur:"48с", state:"ok",    sources:["linkedin","xing"] },
  { t:"2 дня, 09:00",   d:"2 дня",       found:2, new:2, dur:"31с", state:"ok",    sources:["indeed"] },
];

const LD_TOP_MATCHES = [
  { c:"Notion",  role:"Senior Product Engineer", loc:"Munich",       match:94, src:"linkedin",  posted:"2 ч",  state:"new" },
  { c:"Vercel",  role:"DX Engineer",             loc:"Remote",       match:91, src:"linkedin",  posted:"4 ч",  state:"new" },
  { c:"Stripe",  role:"Frontend Engineer",       loc:"London",       match:88, src:"stepstone", posted:"6 ч",  state:"saved" },
  { c:"GitHub",  role:"Senior FE Engineer",      loc:"Berlin",       match:86, src:"linkedin",  posted:"8 ч",  state:"applied" },
  { c:"Linear",  role:"Product Engineer",        loc:"Remote",       match:82, src:"linkedin",  posted:"вчера", state:"new" },
];

const STATE_PILL = {
  new: { l:"Новая",    tone:"success" },
  saved: { l:"Сохранено", tone:"neutral" },
  applied: { l:"Отклик", tone:"info" },
};

const SRC_NAME = Object.fromEntries(LD_SOURCES.map(s=>[s.k, s.l]));
const SRC_COLOR = Object.fromEntries(LD_SOURCES.map(s=>[s.k, s.color]));

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────
function LDHeader({ setPage }) {
  return (
    <div style={{borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
      <div style={{padding:"16px 28px 0"}}>
        <div style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-subtle)", marginBottom:10}}>
          <a onClick={()=>setPage("loops")} style={{color:"var(--fg-subtle)", cursor:"pointer"}}>← Циклы</a>
          <span>/</span>
          <span style={{color:"var(--fg-muted)"}}>{LD_LOOP.name}</span>
        </div>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap"}}>
          <div style={{minWidth:280, flex:"1 1 380px"}}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap"}}>
              <div style={{
                width:36, height:36, borderRadius:8,
                background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
                color:"#fff", display:"grid", placeItems:"center",
                fontSize:15, fontWeight:700, letterSpacing:"-0.04em",
              }}>↻</div>
              <h1 style={{margin:0, fontSize:24, fontWeight:600, letterSpacing:"-0.025em"}}>{LD_LOOP.name}</h1>
              <PillLD tone="success">● Активный</PillLD>
              <span style={{
                fontSize:11.5, padding:"2px 8px", borderRadius:99,
                background:"var(--bg-subtle)", border:"1px solid var(--border)",
                color:"var(--fg-muted)", display:"inline-flex", alignItems:"center", gap:5,
              }}>
                <span style={{
                  width:6, height:6, borderRadius:99,
                  background:"rgb(5,150,105)",
                  animation:"pulse 2s infinite",
                }}/>
                Синхронизация {LD_LOOP.nextRun}
              </span>
            </div>
            <div style={{fontSize:13, color:"var(--fg-muted)", display:"flex", gap:14, flexWrap:"wrap", marginLeft:46}}>
              <span>{LD_LOOP.role}</span>
              <span>· создан {LD_LOOP.created}</span>
              <span>· обновлён {LD_LOOP.lastRun}</span>
            </div>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            <BtnLD variant="ghost" size="sm">Пауза</BtnLD>
            <BtnLD variant="outline" size="sm" icon={IconLD.loop}>Запустить</BtnLD>
            <BtnLD variant="outline" size="sm" icon={IconLD.filter}>Редактировать</BtnLD>
            <BtnLD variant="primary" size="sm" iconRight={IconLD.arrow} onClick={()=>setPage("matches")}>Открыть матчи</BtnLD>
            <button style={{
              width:32, height:32, borderRadius:6, border:"1px solid var(--border)",
              background:"var(--bg-elev)", cursor:"pointer", color:"var(--fg-muted)",
              fontSize:14, lineHeight:1, fontFamily:"inherit",
            }}>⋯</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",
          gap:0, marginTop:20,
          borderTop:"1px solid var(--border)",
        }}>
          {LD_STATS.map((s,i,arr)=>(
            <div key={s.l} style={{
              padding:"14px 18px 14px 0",
              paddingLeft: i===0 ? 0 : 18,
              borderRight: i<arr.length-1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4}}>
                <span style={{fontSize:11, color:"var(--fg-subtle)", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:500}}>{s.l}</span>
                <span style={{fontSize:11, fontWeight:500, color: s.pos ? "rgb(5,150,105)" : "rgb(220,38,38)"}}>{s.d}</span>
              </div>
              <div style={{fontSize:24, fontWeight:600, letterSpacing:"-0.025em", fontVariantNumeric:"tabular-nums", lineHeight:1.1}}>{s.v}</div>
              <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:4}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────
function LDTabs({ tab, setTab }) {
  const tabs = [
    { k:"overview",  l:"Обзор" },
    { k:"sources",   l:"Источники", b:LD_SOURCES.filter(s=>s.status==="error").length || null },
    { k:"runs",      l:"История запусков", b:LD_RUNS.filter(r=>r.state==="error").length || null },
    { k:"analytics", l:"Аналитика" },
    { k:"settings",  l:"Настройки" },
  ];
  return (
    <div style={{padding:"0 28px", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
      <div style={{display:"flex", gap:0, overflowX:"auto"}}>
        {tabs.map(t=>(
          <a key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:"10px 14px", fontSize:13,
            cursor:"pointer",
            borderBottom: tab===t.k ? "2px solid var(--fg)" : "2px solid transparent",
            color: tab===t.k ? "var(--fg)" : "var(--fg-muted)",
            fontWeight: tab===t.k ? 500 : 400,
            display:"inline-flex", alignItems:"center", gap:7, whiteSpace:"nowrap",
            marginBottom:-1,
          }}>
            {t.l}
            {t.b && (
              <span style={{
                fontSize:10, fontWeight:600, padding:"1px 6px", borderRadius:99,
                background:"color-mix(in oklab, rgb(220,38,38) 14%, transparent)",
                color:"rgb(220,38,38)", fontVariantNumeric:"tabular-nums",
              }}>{t.b}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview tab
// ─────────────────────────────────────────────────────────────────────────────
function FilterChip({ label, value, hint }) {
  return (
    <div style={{
      padding:"10px 14px", borderRadius:8,
      background:"var(--bg-subtle)", border:"1px solid var(--border)",
      minWidth:0,
    }}>
      <div style={{fontSize:10.5, color:"var(--fg-subtle)", letterSpacing:"0.04em", textTransform:"uppercase", fontWeight:500}}>{label}</div>
      <div style={{fontSize:13.5, fontWeight:500, marginTop:4, letterSpacing:"-0.005em"}}>{value}</div>
      {hint && <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:3}}>{hint}</div>}
    </div>
  );
}

function OverviewTab({ setPage }) {
  return (
    <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1fr) 320px", gap:14}}>
      <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
        {/* Filters */}
        <CardLD padding={22}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, gap:10}}>
            <div>
              <SLLD>Параметры поиска</SLLD>
              <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:4}}>Используются для запроса вакансий со всех платформ</div>
            </div>
            <BtnLD variant="outline" size="sm" icon={IconLD.filter}>Редактировать</BtnLD>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:10}}>
            <FilterChip label="Роль"     value={LD_LOOP.role.split(" (")[0]} hint={LD_LOOP.role.match(/\(([^)]+)\)/)?.[1]}/>
            <FilterChip label="Локация"  value={LD_LOOP.loc.split(",")[0]+" +" + (LD_LOOP.loc.split(",").length-1)} hint={LD_LOOP.loc.split(",").slice(1).join(", ")}/>
            <FilterChip label="Радиус"   value={LD_LOOP.radius+" км"}/>
            <FilterChip label="Формат"   value={LD_LOOP.mode.join(" / ")}/>
            <FilterChip label="Язык"     value={LD_LOOP.lang.join(" / ")}/>
            <FilterChip label="Свежесть" value={"≤ " + LD_LOOP.postedWithin + " дней"}/>
          </div>

          <div style={{marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)"}}>
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              <div>
                <span style={{fontSize:11.5, color:"var(--fg-subtle)", marginRight:8}}>Включить ключевые слова:</span>
                {LD_LOOP.include.map(k=>(
                  <span key={k} style={{
                    fontSize:11.5, padding:"2px 8px", borderRadius:99, marginRight:4,
                    background:"color-mix(in oklab, rgb(5,150,105) 10%, transparent)",
                    color:"rgb(5,150,105)", border:"1px solid color-mix(in oklab, rgb(5,150,105) 25%, transparent)",
                  }}>+ {k}</span>
                ))}
              </div>
              <div>
                <span style={{fontSize:11.5, color:"var(--fg-subtle)", marginRight:8}}>Исключить:</span>
                {LD_LOOP.exclude.map(k=>(
                  <span key={k} style={{
                    fontSize:11.5, padding:"2px 8px", borderRadius:99, marginRight:4,
                    background:"color-mix(in oklab, rgb(220,38,38) 10%, transparent)",
                    color:"rgb(220,38,38)", border:"1px solid color-mix(in oklab, rgb(220,38,38) 22%, transparent)",
                  }}>− {k}</span>
                ))}
                {LD_LOOP.excludeAgencies && <PillLD tone="neutral">Без агентств / Zeitarbeit</PillLD>}
              </div>
            </div>
          </div>
        </CardLD>

        {/* Top matches */}
        <CardLD padding={0}>
          <div style={{padding:"16px 20px 12px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <SLLD>Топ-матчи в этом цикле</SLLD>
              <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:3}}>Лучшие совпадения по match-скору</div>
            </div>
            <BtnLD variant="ghost" size="sm" iconRight={IconLD.arrow} onClick={()=>setPage("matches")}>Все 30 матчей</BtnLD>
          </div>
          {LD_TOP_MATCHES.map((m,i,arr)=>(
            <div key={i} onClick={()=>setPage("details")} style={{
              padding:"12px 20px", display:"grid",
              gridTemplateColumns:"32px minmax(0,1fr) minmax(0,0.8fr) auto 90px 40px",
              gap:14, alignItems:"center", cursor:"pointer",
              borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none",
              transition:"background 100ms",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--bg-subtle)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <div style={{
                width:30, height:30, borderRadius:6,
                background:"var(--bg-subtle)", border:"1px solid var(--border)",
                display:"grid", placeItems:"center", fontSize:11, fontWeight:600, color:"var(--fg-muted)",
              }}>{m.c[0]}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{m.role}</div>
                <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:1}}>{m.c} · {m.loc}</div>
              </div>
              <div style={{fontSize:11.5, color:"var(--fg-muted)", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap"}}>
                <span style={{width:7, height:7, borderRadius:2, background:SRC_COLOR[m.src]}}/>
                {SRC_NAME[m.src]} · {m.posted}
              </div>
              <PillLD tone={STATE_PILL[m.state].tone}>{STATE_PILL[m.state].l}</PillLD>
              <div style={{display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end"}}>
                <div style={{width:36, height:4, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                  <div style={{height:"100%", width:`${m.match}%`, background: m.match>=90 ? "rgb(5,150,105)" : m.match>=80 ? "var(--accent)" : "var(--fg-subtle)", borderRadius:99}}/>
                </div>
                <span style={{fontSize:11.5, fontVariantNumeric:"tabular-nums", fontWeight:500}}>{m.match}</span>
              </div>
              <div style={{color:"var(--fg-subtle)", display:"flex", justifyContent:"flex-end"}}>{IconLD.arrow}</div>
            </div>
          ))}
        </CardLD>

        {/* Activity heatmap */}
        <CardLD padding={22}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
            <div>
              <SLLD>Активность цикла</SLLD>
              <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:3}}>Найдено вакансий по дням · 30 дней</div>
            </div>
            <span style={{fontSize:11.5, color:"var(--fg-subtle)"}}>Среднее · 3.1/день</span>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(30, 1fr)", gap:3}}>
            {[1,3,2,0,4,5,2,1,3,4,6,3,2,1,0,3,5,4,6,2,3,5,4,7,3,4,2,5,4,9].map((v,i)=>{
              const max = 9;
              const opacity = v/max;
              return (
                <div key={i} style={{
                  aspectRatio:"1", borderRadius:3,
                  background: v===0 ? "var(--bg-subtle)" : `color-mix(in oklab, var(--accent) ${30 + opacity*70}%, transparent)`,
                  border: "1px solid " + (v===0 ? "var(--border)" : "transparent"),
                }} title={`${v} матчей`}/>
              );
            })}
          </div>
          <div style={{display:"flex", justifyContent:"space-between", fontSize:10.5, color:"var(--fg-subtle)", marginTop:8}}>
            <span>30 д назад</span>
            <span>Сегодня</span>
          </div>
        </CardLD>
      </div>

      {/* Right rail */}
      <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
        {/* Sources health */}
        <CardLD padding={18}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <SLLD>Источники</SLLD>
            <span style={{fontSize:11, color:"var(--fg-subtle)"}}>{LD_SOURCES.filter(s=>s.enabled).length} из {LD_SOURCES.length}</span>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:1}}>
            {LD_SOURCES.map(s=>(
              <div key={s.k} style={{
                padding:"8px 0", display:"flex", alignItems:"center", gap:10,
                borderBottom:"1px solid var(--border)",
                opacity: s.enabled ? 1 : 0.5,
              }}>
                <span style={{
                  width:8, height:8, borderRadius:2, background:s.color, flexShrink:0,
                  opacity: s.status==="off" ? 0.3 : 1,
                }}/>
                <span style={{flex:1, minWidth:0, fontSize:12.5, fontWeight:500, color: s.enabled ? "var(--fg)" : "var(--fg-subtle)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{s.l}</span>
                {s.status === "error" && (
                  <span style={{fontSize:10, padding:"1px 6px", borderRadius:99, background:"color-mix(in oklab, rgb(220,38,38) 14%, transparent)", color:"rgb(220,38,38)", fontWeight:500}}>ошибка</span>
                )}
                {s.status === "slow" && (
                  <span style={{fontSize:10, padding:"1px 6px", borderRadius:99, background:"color-mix(in oklab, rgb(218,113,38) 14%, transparent)", color:"rgb(180,83,9)", fontWeight:500}}>медленно</span>
                )}
                <span style={{fontSize:11.5, color:"var(--fg-muted)", fontVariantNumeric:"tabular-nums", minWidth:24, textAlign:"right"}}>{s.matches}</span>
              </div>
            ))}
          </div>
          <BtnLD variant="ghost" size="sm" style={{marginTop:10, width:"100%"}}>Управлять источниками →</BtnLD>
        </CardLD>

        {/* Next run */}
        <CardLD padding={18}>
          <SLLD>Следующий запуск</SLLD>
          <div style={{fontSize:30, fontWeight:600, letterSpacing:"-0.04em", marginTop:8, fontVariantNumeric:"tabular-nums", lineHeight:1}}>
            12 <span style={{fontSize:14, color:"var(--fg-subtle)", fontWeight:400}}>мин</span>
          </div>
          <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:6}}>Автоматически каждые 15 минут</div>
          <div style={{marginTop:12, padding:"8px 10px", background:"var(--bg-subtle)", borderRadius:6, fontSize:11, color:"var(--fg-muted)", lineHeight:1.5}}>
            Последний запуск нашёл <strong style={{color:"var(--fg)", fontWeight:500}}>4 новых матча</strong>. Время выполнения · 38с.
          </div>
          <BtnLD variant="outline" size="sm" full style={{marginTop:10}} icon={IconLD.loop}>Запустить сейчас</BtnLD>
        </CardLD>

        {/* AI Insight */}
        <CardLD padding={18} style={{background:"linear-gradient(135deg, color-mix(in oklab, var(--accent) 6%, var(--bg-elev)), var(--bg-elev))", border:"1px solid color-mix(in oklab, var(--accent) 25%, var(--border))"}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
            <span style={{
              width:22, height:22, borderRadius:5,
              background:"color-mix(in oklab, var(--accent) 14%, transparent)",
              color:"var(--accent)", display:"grid", placeItems:"center", fontSize:11,
            }}>{IconLD.spark}</span>
            <span style={{fontSize:11.5, fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase", color:"var(--fg-subtle)"}}>Рекомендация</span>
          </div>
          <div style={{fontSize:13, lineHeight:1.55, color:"var(--fg)", marginBottom:10}}>
            Добавь <strong style={{fontWeight:600}}>«remote»</strong> в ключевые слова — это даст ещё +30% матчей с твоими параметрами.
          </div>
          <div style={{display:"flex", gap:6}}>
            <BtnLD variant="primary" size="sm">Применить</BtnLD>
            <BtnLD variant="ghost" size="sm">Скрыть</BtnLD>
          </div>
        </CardLD>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sources tab
// ─────────────────────────────────────────────────────────────────────────────
function SourcesTab() {
  return (
    <div style={{maxWidth:980}}>
      <CardLD padding={0}>
        <div style={{padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10}}>
          <div>
            <div style={{fontSize:14, fontWeight:600}}>Источники этого цикла</div>
            <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:2}}>Управляй платформами, с которых тянутся вакансии</div>
          </div>
          <div style={{display:"flex", gap:8}}>
            <BtnLD variant="outline" size="sm" icon={IconLD.loop}>Проверить все</BtnLD>
            <BtnLD variant="primary" size="sm" icon={IconLD.plus}>Подключить</BtnLD>
          </div>
        </div>

        {LD_SOURCES.map((s,i,arr)=>(
          <div key={s.k} style={{
            padding:"16px 20px",
            borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none",
            display:"grid", gridTemplateColumns:"36px minmax(0,1.4fr) minmax(0,1.8fr) auto 110px",
            gap:14, alignItems:"center",
            background: s.status==="error" ? "color-mix(in oklab, rgb(220,38,38) 4%, transparent)" : "transparent",
            opacity: s.enabled ? 1 : 0.6,
          }}>
            <div style={{
              width:32, height:32, borderRadius:7,
              background: s.enabled ? s.color : "var(--bg-subtle)",
              color: s.enabled ? "#fff" : "var(--fg-subtle)",
              display:"grid", placeItems:"center", fontSize:12, fontWeight:700,
              border: s.enabled ? "none" : "1px solid var(--border)",
            }}>{s.l[0]}</div>
            <div style={{minWidth:0}}>
              <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                <span style={{fontSize:14, fontWeight:500}}>{s.l}</span>
                {s.status==="error" && <PillLD tone="danger">Ошибка</PillLD>}
                {s.status==="slow"  && <PillLD tone="warning">Медленно</PillLD>}
                {s.status==="ok"    && <PillLD tone="success">● Онлайн</PillLD>}
                {s.status==="off"   && <PillLD tone="neutral">Отключён</PillLD>}
              </div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:3}}>
                {s.enabled ? `Последний опрос · ${s.lastRun}` : "Источник отключён в цикле"}
                {s.err && <span style={{color:"rgb(220,38,38)"}}> · {s.err}</span>}
              </div>
            </div>

            {/* Per-source stats */}
            <div style={{display:"flex", gap:18, alignItems:"center", flexWrap:"wrap"}}>
              {[
                {l:"Матчи", v:s.matches},
                {l:"Отклики", v:s.applied},
                {l:"Конв.", v:s.conv ? s.conv+"%" : "—"},
              ].map(stat=>(
                <div key={stat.l}>
                  <div style={{fontSize:10, color:"var(--fg-subtle)", letterSpacing:"0.04em", textTransform:"uppercase"}}>{stat.l}</div>
                  <div style={{fontSize:14, fontWeight:600, fontVariantNumeric:"tabular-nums", letterSpacing:"-0.015em", marginTop:2}}>{stat.v}</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex", gap:6}}>
              {s.status==="error" && <BtnLD variant="outline" size="sm">Переподключить</BtnLD>}
              <BtnLD variant="ghost" size="sm">Настроить</BtnLD>
            </div>
            <div style={{justifySelf:"end"}}>
              <button onClick={()=>{}} style={{
                width:34, height:20, borderRadius:99,
                background: s.enabled ? "var(--accent)" : "var(--bg-subtle)",
                border:"1px solid var(--border)", cursor:"pointer", flexShrink:0,
                position:"relative", transition:"background 160ms",
              }}>
                <span style={{
                  position:"absolute", top:1, left: s.enabled ? 15 : 1,
                  width:16, height:16, borderRadius:99, background:"#fff",
                  transition:"left 160ms", boxShadow:"0 1px 2px rgba(0,0,0,0.15)",
                }}/>
              </button>
            </div>
          </div>
        ))}
      </CardLD>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Runs history tab
// ─────────────────────────────────────────────────────────────────────────────
function RunsTab() {
  const totalRuns = LD_RUNS.length;
  const totalFound = LD_RUNS.reduce((a,r)=>a+r.found, 0);
  const errors = LD_RUNS.filter(r=>r.state==="error").length;

  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14, marginBottom:14}}>
      {[
        {l:"Запусков · 7д", v:"42", sub:"автоматических · 38"},
        {l:"Найдено вакансий", v:"68", sub:"новых · 51"},
        {l:"Среднее время",   v:"41с", sub:"медиана · 38с"},
        {l:"Ошибок",           v:errors, sub:"требует внимания · "+(errors||"—")},
      ].map(s=>(
        <CardLD key={s.l} padding={16}>
          <div style={{fontSize:10.5, color:"var(--fg-subtle)", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:500}}>{s.l}</div>
          <div style={{fontSize:24, fontWeight:600, letterSpacing:"-0.025em", fontVariantNumeric:"tabular-nums", marginTop:8}}>{s.v}</div>
          <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:4}}>{s.sub}</div>
        </CardLD>
      ))}

      <CardLD padding={0} style={{gridColumn:"1 / -1"}}>
        <div style={{padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div style={{fontSize:14, fontWeight:600}}>История запусков</div>
            <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:2}}>Хронологический лог опросов платформ</div>
          </div>
          <div style={{display:"flex", gap:8}}>
            <BtnLD variant="ghost" size="sm">Скачать .csv</BtnLD>
            <BtnLD variant="outline" size="sm" icon={IconLD.filter}>Фильтр</BtnLD>
          </div>
        </div>

        <div style={{padding:"6px 20px"}}>
          {LD_RUNS.map((r,i)=>{
            const tone = r.state==="error" ? "rgb(220,38,38)" : "rgb(5,150,105)";
            return (
              <div key={i} style={{
                display:"grid", gridTemplateColumns:"100px 24px minmax(0, 1fr) auto",
                gap:14, padding:"12px 0", alignItems:"flex-start",
                borderBottom: i<LD_RUNS.length-1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{paddingTop:2}}>
                  <div style={{fontSize:12, fontWeight:500, fontVariantNumeric:"tabular-nums"}}>{r.t}</div>
                  <div style={{fontSize:11, color:"var(--fg-subtle)"}}>{r.d}</div>
                </div>
                <div style={{position:"relative", height:"100%", display:"flex", justifyContent:"center"}}>
                  <span style={{
                    width:10, height:10, borderRadius:99,
                    background:tone, marginTop:6, flexShrink:0,
                    border: r.state==="error" ? "2px solid color-mix(in oklab, rgb(220,38,38) 20%, transparent)" : "2px solid color-mix(in oklab, rgb(5,150,105) 20%, transparent)",
                  }}/>
                  {i<LD_RUNS.length-1 && <span style={{position:"absolute", top:18, left:"50%", bottom:-12, width:1, background:"var(--border)", transform:"translateX(-50%)"}}/>}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:3}}>
                    {r.state==="error" ? "Ошибка опроса" : `Найдено ${r.found} вакансий, ${r.new} новых`}
                  </div>
                  <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
                    <span style={{fontSize:11.5, color:"var(--fg-subtle)"}}>{r.dur !== "—" && `${r.dur} · `}</span>
                    {r.sources.map(srcK=>(
                      <span key={srcK} style={{
                        fontSize:10.5, padding:"1px 7px", borderRadius:99,
                        background:"var(--bg-subtle)", border:"1px solid var(--border)",
                        color:"var(--fg-muted)", display:"inline-flex", alignItems:"center", gap:5,
                      }}>
                        <span style={{width:6, height:6, borderRadius:2, background:SRC_COLOR[srcK]}}/>
                        {SRC_NAME[srcK]}
                      </span>
                    ))}
                  </div>
                  {r.err && (
                    <div style={{fontSize:11.5, color:"rgb(220,38,38)", marginTop:6, fontFamily:"var(--font-mono)", lineHeight:1.5}}>
                      {r.err}
                    </div>
                  )}
                </div>
                <div style={{display:"flex", gap:6, alignItems:"center"}}>
                  {r.state==="error" && <BtnLD variant="outline" size="sm">Повторить</BtnLD>}
                  <BtnLD variant="ghost" size="sm">Детали</BtnLD>
                </div>
              </div>
            );
          })}
        </div>
      </CardLD>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics tab
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsTab() {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:14}}>
      <div style={{display:"grid", gridTemplateColumns:"minmax(0,1.6fr) minmax(0,1fr)", gap:14}}>
        <CardLD padding={22} style={{minWidth:0}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
            <div>
              <SLLD>Воронка цикла</SLLD>
              <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:3}}>Конверсия от матча до оффера</div>
            </div>
            <PillLD tone="neutral">90 дней</PillLD>
          </div>
          {[
            { l:"Найдено матчей",   v:120, w:100, c:"var(--fg-subtle)" },
            { l:"Сохранено",         v:62,  w:52,  c:"var(--accent-2)" },
            { l:"Отклик",            v:36,  w:30,  c:"var(--accent)"   },
            { l:"Интервью",          v:14,  w:12,  c:"var(--accent)"   },
            { l:"Финал",             v:6,   w:5,   c:"#7c3aed"         },
            { l:"Оффер",             v:2,   w:1.6, c:"rgb(5,150,105)"  },
          ].map((s,i,arr)=>{
            const next = arr[i+1];
            const conv = next ? Math.round((next.v/s.v)*100) : null;
            return (
              <div key={s.l} style={{marginBottom:12}}>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:5}}>
                  <span style={{fontWeight:500}}>{s.l}</span>
                  <span style={{color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>
                    {s.v}{conv !== null && <span style={{marginLeft:8}}>→ {conv}%</span>}
                  </span>
                </div>
                <div style={{height:22, background:"var(--bg-subtle)", borderRadius:5, overflow:"hidden", border:"1px solid var(--border)"}}>
                  <div style={{height:"100%", width:`${s.w}%`, background:s.c, opacity:0.85, transition:"width 400ms"}}/>
                </div>
              </div>
            );
          })}
        </CardLD>

        <CardLD padding={22} style={{minWidth:0}}>
          <SLLD>Источники по конверсии</SLLD>
          <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:3, marginBottom:14}}>Эффективность по платформам</div>
          {LD_SOURCES.filter(s=>s.enabled && s.matches>0).map(s=>(
            <div key={s.k} style={{marginBottom:12}}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:12.5}}>
                <span style={{display:"inline-flex", alignItems:"center", gap:8}}>
                  <span style={{width:8, height:8, borderRadius:2, background:s.color}}/>
                  <span style={{fontWeight:500}}>{s.l}</span>
                </span>
                <span style={{color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>{s.conv}% <span style={{color:"var(--fg-muted)"}}>· {s.matches}</span></span>
              </div>
              <div style={{height:5, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                <div style={{height:"100%", width:`${s.conv}%`, background:s.color, borderRadius:99}}/>
              </div>
            </div>
          ))}
          <div style={{
            marginTop:14, padding:"10px 12px",
            background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:7,
            fontSize:11.5, color:"var(--fg-muted)", lineHeight:1.55,
          }}>
            <strong style={{color:"var(--fg)", fontWeight:500}}>StepStone</strong> даёт самую высокую конверсию (57%). Стоит проверить, чем привлекательнее остальных.
          </div>
        </CardLD>
      </div>

      <CardLD padding={22}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
          <div>
            <SLLD>Динамика матчей</SLLD>
            <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:3}}>Новые матчи по неделям · последние 12 недель</div>
          </div>
        </div>
        <div style={{display:"flex", alignItems:"flex-end", gap:8, height:160, paddingBottom:30, position:"relative"}}>
          {[4,7,5,9,6,11,8,14,10,15,12,18].map((v,i,arr)=>{
            const max = Math.max(...arr);
            const isLast = i===arr.length-1;
            return (
              <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%"}}>
                <div style={{flex:1, width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end"}}>
                  <div style={{
                    height:`${(v/max)*100}%`,
                    width:"100%",
                    background: isLast ? "var(--accent)" : "color-mix(in oklab, var(--accent) 30%, transparent)",
                    border:"1px solid " + (isLast ? "var(--accent)" : "color-mix(in oklab, var(--accent) 35%, var(--border))"),
                    borderRadius:"3px 3px 0 0",
                    position:"relative",
                  }}>
                    <div style={{position:"absolute", top:-18, left:0, right:0, textAlign:"center", fontSize:10.5, color: isLast ? "var(--accent)" : "var(--fg-subtle)", fontWeight: isLast ? 600 : 400, fontVariantNumeric:"tabular-nums"}}>{v}</div>
                  </div>
                </div>
                <div style={{position:"absolute", bottom:0, fontSize:10, color:"var(--fg-subtle)"}}>W{i+1}</div>
              </div>
            );
          })}
        </div>
      </CardLD>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings tab
// ─────────────────────────────────────────────────────────────────────────────
function SettingsTab() {
  return (
    <div style={{maxWidth:780, display:"flex", flexDirection:"column", gap:14}}>
      <CardLD padding={22}>
        <SLLD>Основные параметры</SLLD>
        <div style={{marginTop:14, display:"flex", flexDirection:"column", gap:0}}>
          {[
            {l:"Название цикла", v:LD_LOOP.name},
            {l:"Авто-запуск",    v:"Каждые 15 минут"},
            {l:"Активен с",      v:LD_LOOP.created},
            {l:"Уведомления",    v:"При появлении матча ≥ 85"},
          ].map((r,i,arr)=>(
            <div key={r.l} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"12px 0", borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none",
            }}>
              <div>
                <div style={{fontSize:13, fontWeight:500}}>{r.l}</div>
                <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>{r.v}</div>
              </div>
              <BtnLD variant="ghost" size="sm">Изменить</BtnLD>
            </div>
          ))}
        </div>
      </CardLD>

      <CardLD padding={22} style={{borderColor:"color-mix(in oklab, rgb(220,38,38) 30%, var(--border))"}}>
        <div style={{color:"rgb(220,38,38)"}}><SLLD>Опасная зона</SLLD></div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--border)"}}>
          <div>
            <div style={{fontSize:13, fontWeight:500}}>Поставить на паузу</div>
            <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>Цикл перестанет опрашивать платформы, матчи и история сохранятся.</div>
          </div>
          <BtnLD variant="outline" size="sm">Поставить на паузу</BtnLD>
        </div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--border)"}}>
          <div>
            <div style={{fontSize:13, fontWeight:500}}>Архивировать</div>
            <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>Скроет цикл из списка. Восстановить можно в архиве.</div>
          </div>
          <BtnLD variant="outline" size="sm">Архивировать</BtnLD>
        </div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0"}}>
          <div>
            <div style={{fontSize:13, fontWeight:500, color:"rgb(220,38,38)"}}>Удалить цикл</div>
            <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>Удалит цикл и всю историю запусков. Связанные заявки останутся.</div>
          </div>
          <button style={{
            padding:"7px 14px", border:"none", color:"#fff", background:"rgb(220,38,38)",
            borderRadius:7, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
          }}>Удалить</button>
        </div>
      </CardLD>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────────────────────
function LoopDetailPage({ setPage }) {
  const [tab, setTab] = React.useState("overview");

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <LDHeader setPage={setPage} />
      <LDTabs tab={tab} setTab={setTab} />
      <div style={{flex:1, overflowY:"auto", padding:"22px 28px 48px", background:"var(--bg)"}}>
        {tab === "overview"  && <OverviewTab setPage={setPage} />}
        {tab === "sources"   && <SourcesTab/>}
        {tab === "runs"      && <RunsTab/>}
        {tab === "analytics" && <AnalyticsTab/>}
        {tab === "settings"  && <SettingsTab/>}
      </div>
    </div>
  );
}

window.LoopDetailPage = { LoopDetailPage };
