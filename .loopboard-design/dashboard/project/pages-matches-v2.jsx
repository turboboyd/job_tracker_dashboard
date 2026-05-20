/* Matches V2 — pulled from external job platforms */
const { Card: CardM2, Pill: PillM2, Btn: BtnM2, SectionLabel: SLM2, Icon: IconM2 } = window.UI;

// ─── Data ───────────────────────────────────────────────────────────────────
const M2_SOURCES = [
  { k:"linkedin", l:"LinkedIn",  color:"#0a66c2", bg:"#0a66c2", count:12, last:"2 мин",  on:true,  err:false },
  { k:"stepstone",l:"StepStone", color:"#005c5c", bg:"#005c5c", count:7,  last:"5 мин",  on:true,  err:false },
  { k:"indeed",   l:"Indeed",    color:"#2164f3", bg:"#2164f3", count:5,  last:"14 мин", on:true,  err:false },
  { k:"xing",     l:"XING",      color:"#006567", bg:"#006567", count:3,  last:"1 ч",    on:true,  err:false },
  { k:"glassdoor",l:"Glassdoor", color:"#0caa41", bg:"#0caa41", count:2,  last:"—",      on:false, err:false },
  { k:"angellist",l:"AngelList", color:"#000000", bg:"#000000", count:0,  last:"1 д",    on:true,  err:true  },
  { k:"hn",       l:"HN Hiring", color:"#ff6600", bg:"#ff6600", count:1,  last:"3 ч",    on:true,  err:false },
];

const M2_JOBS = [
  {
    id:1, c:"Notion",  logo:"#000",      role:"Senior Product Engineer", loc:"Munich · Hybrid",
    src:"linkedin", posted:"2 ч назад", salary:"€95–115K + equity", match:94, type:"Full-time",
    tags:["React","TypeScript","Y.js","CRDT","ProseMirror"],
    summary:"Команда редактора (9 чел) ищет инженера на real-time коллаборацию и производительность.",
    why:["Совпадает 5/5 ключевых навыков","Команда твоего размера (опыт ≥8 чел)","Локация в списке предпочтений"],
    state:"new", url:"linkedin.com/jobs/...", remote:"Hybrid",
  },
  {
    id:2, c:"Vercel",  logo:"#000",      role:"DX Engineer",             loc:"Remote · Global",
    src:"linkedin", posted:"4 ч назад", salary:"$140–190K", match:91, type:"Full-time",
    tags:["Next.js","TypeScript","DevTools","Node"],
    summary:"Платформа DX. Будешь писать инструменты, которыми пользуются десятки тысяч разработчиков.",
    why:["Сильный матч по стеку","Удалёнка из EU подходит","CV: 'Developer tools' опыт"],
    state:"new", url:"vercel.com/careers/...", remote:"Remote",
  },
  {
    id:3, c:"Stripe",  logo:"#635bff",   role:"Frontend Engineer",       loc:"London · Hybrid",
    src:"stepstone", posted:"6 ч назад", salary:"£90–120K", match:88, type:"Full-time",
    tags:["React","TypeScript","Ruby"],
    summary:"Dashboard и billing flows. Высокая планка качества, дизайн-система внутри команды.",
    why:["Сильный матч по основному стеку","Релокация спонсируется"],
    state:"saved", url:"stripe.com/jobs/...", remote:"Hybrid",
  },
  {
    id:4, c:"GitHub",  logo:"#000",      role:"Senior Frontend Engineer",loc:"Berlin · Remote",
    src:"linkedin", posted:"8 ч назад", salary:"€85–110K", match:86, type:"Full-time",
    tags:["React","TypeScript","GraphQL"],
    summary:"Pull Requests UI команда. Accessibility, performance, design system Primer.",
    why:["Опыт с PR UI уже есть","Удалёнка из Berlin"],
    state:"applied", url:"github.com/careers/...", remote:"Remote",
  },
  {
    id:5, c:"Linear",  logo:"#5e6ad2",   role:"Product Engineer",        loc:"Remote · Global",
    src:"linkedin", posted:"вчера", salary:"$120–170K + equity", match:82, type:"Full-time",
    tags:["React","TypeScript","Rust"],
    summary:"Маленькая команда, высокая автономия. Используем Linear как dogfood.",
    why:["Совпадает по стилю работы","Хороший рост по equity"],
    state:"new", url:"linear.app/careers/...", remote:"Remote",
  },
  {
    id:6, c:"Klarna",  logo:"#febbcc",   role:"Senior Frontend",         loc:"Stockholm",
    src:"stepstone", posted:"вчера", salary:"SEK 850K+", match:78, type:"Full-time",
    tags:["React","TypeScript"],
    summary:"Checkout UX в большом масштабе. Микрофронтенды, A/B-тесты, perf.",
    why:["Совпадает по основному стеку","Минус: язык — нужен шведский (B2+) преимущество"],
    state:"new", url:"klarna.com/jobs/...", remote:"Onsite",
  },
  {
    id:7, c:"Datadog", logo:"#632ca6",   role:"Software Engineer",       loc:"Remote · EU",
    src:"indeed", posted:"2 дня", salary:"€85–115K", match:74, type:"Full-time",
    tags:["TypeScript","React","Node"],
    summary:"Backend-heavy, но есть фронтенд-команды. Большие данные, observability.",
    why:["Удалёнка из EU","Сильный бренд для CV"],
    state:"new", url:"datadog.com/...", remote:"Remote",
  },
  {
    id:8, c:"Spotify", logo:"#1db954",   role:"Web Engineer",            loc:"Stockholm",
    src:"xing", posted:"2 дня", salary:"SEK 700–950K", match:72, type:"Full-time",
    tags:["React","TypeScript"],
    summary:"Web-плеер. Большой масштаб (~500M пользователей), focus на performance.",
    why:["Сильный бренд","Минус: relocation required"],
    state:"new", url:"jobs.spotify.com/...", remote:"Hybrid",
  },
  {
    id:9, c:"Mollie",  logo:"#000",      role:"Frontend Engineer",       loc:"Amsterdam · Remote",
    src:"indeed", posted:"3 дня", salary:"€70–95K", match:68, type:"Full-time",
    tags:["React","TypeScript"],
    summary:"Payments. Чистый stack, маленькая команда, гибрид/remote.",
    why:["Удалёнка с EU","Опыт payments из Stripe пригодится"],
    state:"hidden", url:"mollie.com/jobs/...", remote:"Hybrid",
  },
];

const M2_STATE_LABEL = {
  new:     { l:"Новая",      tone:"success" },
  saved:   { l:"Сохранено",  tone:"neutral" },
  applied: { l:"Отклик",     tone:"info"    },
  hidden:  { l:"Скрыто",     tone:"neutral" },
};

function SrcDot({ src, size=8 }) {
  const s = M2_SOURCES.find(x=>x.k===src);
  return <span style={{display:"inline-block", width:size, height:size, borderRadius:2, background: s ? s.color : "var(--fg-subtle)", flexShrink:0}}/>;
}

// ─── Job detail (right pane) ────────────────────────────────────────────────
function JobDetail({ job, setPage }) {
  if (!job) return null;
  const s = M2_SOURCES.find(x=>x.k===job.src);
  return (
    <CardM2 padding={0} style={{display:"flex", flexDirection:"column", height:"100%", overflow:"hidden"}}>
      <div style={{padding:"18px 22px 14px", borderBottom:"1px solid var(--border)"}}>
        <div style={{display:"flex", gap:14, alignItems:"flex-start", marginBottom:12}}>
          <div style={{
            width:46, height:46, borderRadius:8, flexShrink:0,
            background: job.logo, color:"#fff",
            display:"grid", placeItems:"center", fontSize:18, fontWeight:700, letterSpacing:"-0.04em",
          }}>{job.c[0]}</div>
          <div style={{minWidth:0, flex:1}}>
            <div style={{display:"flex", flexWrap:"wrap", alignItems:"center", gap:8, marginBottom:4}}>
              <PillM2 tone={M2_STATE_LABEL[job.state].tone}>{M2_STATE_LABEL[job.state].l}</PillM2>
              <span style={{
                fontSize:10.5, padding:"2px 7px", borderRadius:99,
                background:"var(--bg-subtle)", border:"1px solid var(--border)",
                color:"var(--fg-muted)", display:"inline-flex", alignItems:"center", gap:5,
              }}>
                <SrcDot src={job.src} size={6}/>
                {s ? s.l : job.src}
              </span>
            </div>
            <div style={{fontSize:17, fontWeight:600, letterSpacing:"-0.02em", lineHeight:1.25}}>{job.role}</div>
            <div style={{fontSize:12.5, color:"var(--fg-muted)", marginTop:3}}>{job.c} · {job.loc}</div>
          </div>
        </div>

        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          <BtnM2 variant="primary" size="sm" onClick={()=>setPage&&setPage("details")}>Сохранить и открыть</BtnM2>
          <BtnM2 variant="outline" size="sm" icon={IconM2.arrowUR}>Открыть на {s ? s.l : "сайте"}</BtnM2>
          <BtnM2 variant="ghost" size="sm">Скрыть</BtnM2>
        </div>
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"18px 22px"}}>
        {/* Match score */}
        <div style={{
          padding:"14px 16px", borderRadius:10, marginBottom:16,
          background:"linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, var(--bg-elev)), var(--bg-elev))",
          border:"1px solid color-mix(in oklab, var(--accent) 25%, var(--border))",
        }}>
          <div style={{display:"flex", alignItems:"baseline", gap:10, marginBottom:10}}>
            <span style={{fontSize:11, color:"var(--fg-subtle)", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:500}}>Match-скор</span>
            <span style={{fontSize:32, fontWeight:600, letterSpacing:"-0.04em", color:"var(--accent)", lineHeight:1, fontVariantNumeric:"tabular-nums"}}>{job.match}</span>
            <span style={{fontSize:13, color:"var(--fg-muted)"}}>/ 100</span>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:6}}>
            {job.why.map((w,i)=>(
              <div key={i} style={{fontSize:12.5, color:"var(--fg-muted)", lineHeight:1.5, display:"flex", gap:8, alignItems:"flex-start"}}>
                <span style={{color: w.startsWith("Минус") ? "rgb(218,113,38)" : "var(--accent)", marginTop:1, flexShrink:0}}>
                  {w.startsWith("Минус") ? "!" : "✓"}
                </span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick meta */}
        <div style={{display:"grid", gridTemplateColumns:"auto 1fr", gap:"8px 14px", fontSize:12.5, marginBottom:18}}>
          {[
            ["Зарплата", job.salary],
            ["Тип занятости", job.type],
            ["Локация", job.loc],
            ["Формат", job.remote],
            ["Опубликовано", job.posted],
            ["Источник", s ? s.l : job.src],
          ].map(([k,v])=>(
            <React.Fragment key={k}>
              <div style={{color:"var(--fg-subtle)"}}>{k}</div>
              <div style={{color:"var(--fg)"}}>{v}</div>
            </React.Fragment>
          ))}
        </div>

        {/* Tags */}
        <SLM2>Технологии</SLM2>
        <div style={{display:"flex", flexWrap:"wrap", gap:6, marginTop:10, marginBottom:18}}>
          {job.tags.map(t=>(
            <PillM2 key={t} tone="neutral">{t}</PillM2>
          ))}
        </div>

        {/* Description */}
        <SLM2>О роли</SLM2>
        <div style={{fontSize:13, lineHeight:1.65, color:"var(--fg-muted)", marginTop:10, marginBottom:18}}>
          {job.summary}
          {" "}Команда работает в гибридном режиме (2–3 дня в офисе), используется современный фронтенд-стек,
          активная инвестиция в дизайн-систему и developer experience.
        </div>

        {/* AI summary */}
        <div style={{
          padding:"12px 14px", borderRadius:8,
          background:"var(--bg-subtle)", border:"1px solid var(--border)",
        }}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
            <span style={{
              width:20, height:20, borderRadius:5,
              background:"color-mix(in oklab, var(--accent) 14%, transparent)",
              color:"var(--accent)", display:"grid", placeItems:"center", fontSize:11,
            }}>{IconM2.spark}</span>
            <span style={{fontSize:11.5, fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase", color:"var(--fg-subtle)"}}>AI · Стоит ли откликаться?</span>
          </div>
          <div style={{fontSize:12.5, lineHeight:1.6, color:"var(--fg)"}}>
            <strong style={{fontWeight:500}}>Скорее да.</strong> Сильный матч по стеку, релокация не требуется, рыночная вилка. Точка внимания — нужно подтянуть Y.js перед интервью.
          </div>
        </div>
      </div>
    </CardM2>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────
function MatchesV2Header({ setPage, loop }) {
  return (
    <div style={{borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
      <div style={{padding:"16px 28px"}}>
        <div style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-subtle)", marginBottom:8}}>
          <a onClick={()=>setPage("loops")} style={{color:"var(--fg-subtle)", cursor:"pointer"}}>← Циклы</a>
          <span>/</span>
          <span style={{color:"var(--fg-muted)"}}>{loop}</span>
        </div>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:16, flexWrap:"wrap"}}>
          <div style={{minWidth:0, flex:1}}>
            <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
              <h1 style={{margin:0, fontSize:22, letterSpacing:"-0.025em", fontWeight:600}}>Матчи · {loop}</h1>
              <PillM2 tone="success">● Синхронизация активна</PillM2>
            </div>
            <p style={{margin:"4px 0 0", fontSize:13, color:"var(--fg-muted)"}}>
              30 вакансий с 7 платформ · обновлено 2 минуты назад · следующий запуск через 13 минут
            </p>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            <BtnM2 variant="outline" size="sm" icon={IconM2.filter}>Фильтры цикла</BtnM2>
            <BtnM2 variant="outline" size="sm" icon={IconM2.loop}>Запустить вручную</BtnM2>
            <BtnM2 variant="primary" size="sm" icon={IconM2.plus}>Добавить ссылку</BtnM2>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sources strip ──────────────────────────────────────────────────────────
function SourcesStrip({ active, setActive }) {
  return (
    <div style={{
      padding:"12px 28px", borderBottom:"1px solid var(--border)", background:"var(--bg)",
      display:"flex", alignItems:"center", gap:14, overflowX:"auto",
    }}>
      <a onClick={()=>setActive("all")} style={{
        display:"inline-flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:99,
        background: active==="all" ? "var(--fg)" : "var(--bg-elev)",
        color: active==="all" ? "var(--bg)" : "var(--fg-muted)",
        border:"1px solid " + (active==="all" ? "var(--fg)" : "var(--border)"),
        fontSize:12.5, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
      }}>
        Все источники
        <span style={{
          fontSize:10.5, padding:"1px 6px", borderRadius:99,
          background: active==="all" ? "color-mix(in oklab, white 20%, var(--fg))" : "var(--bg-subtle)",
          fontVariantNumeric:"tabular-nums",
        }}>{M2_SOURCES.reduce((a,s)=>a+(s.on?s.count:0),0)}</span>
      </a>
      <div style={{height:18, width:1, background:"var(--border)", flexShrink:0}}/>
      {M2_SOURCES.map(s=>{
        const isActive = active===s.k;
        return (
          <a key={s.k} onClick={()=>setActive(s.k)} title={s.err ? "Ошибка соединения" : `${s.l} · обновлено ${s.last}`} style={{
            display:"inline-flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:99,
            background: isActive ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--bg-elev)",
            border:"1px solid " + (isActive ? "color-mix(in oklab, var(--accent) 40%, var(--border))" : "var(--border)"),
            color: s.on ? "var(--fg)" : "var(--fg-subtle)",
            fontSize:12.5, fontWeight: isActive ? 500 : 400,
            cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
            opacity: s.on ? 1 : 0.55,
            position:"relative",
          }}>
            <SrcDot src={s.k}/>
            <span>{s.l}</span>
            <span style={{
              fontSize:10.5, padding:"1px 6px", borderRadius:99,
              background:"var(--bg-subtle)", color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums",
            }}>{s.count}</span>
            {s.err && <span style={{
              position:"absolute", top:-3, right:-3, width:8, height:8, borderRadius:99,
              background:"rgb(220,38,38)", border:"1.5px solid var(--bg)",
            }}/>}
          </a>
        );
      })}
      <div style={{flex:1}}/>
      <a style={{fontSize:11.5, color:"var(--fg-subtle)", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap"}}>+ Подключить источник</a>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
function MatchesV2({ setPage }) {
  const [activeSrc, setActiveSrc] = React.useState("all");
  const [tab, setTab] = React.useState("new");
  const [activeJob, setActiveJob] = React.useState(M2_JOBS[0].id);
  const [sort, setSort] = React.useState("match");

  const filtered = M2_JOBS.filter(j=>{
    if (activeSrc !== "all" && j.src !== activeSrc) return false;
    if (tab === "new"     && j.state !== "new") return false;
    if (tab === "saved"   && j.state !== "saved") return false;
    if (tab === "applied" && j.state !== "applied") return false;
    if (tab === "hidden"  && j.state !== "hidden") return false;
    return true;
  });

  const tabs = [
    { k:"all",     l:"Все",          c:M2_JOBS.filter(j=>j.state!=="hidden").length },
    { k:"new",     l:"Новые",        c:M2_JOBS.filter(j=>j.state==="new").length },
    { k:"saved",   l:"Сохранённые",  c:M2_JOBS.filter(j=>j.state==="saved").length },
    { k:"applied", l:"Отклики",      c:M2_JOBS.filter(j=>j.state==="applied").length },
    { k:"hidden",  l:"Скрытые",      c:M2_JOBS.filter(j=>j.state==="hidden").length },
  ];

  const job = filtered.find(j=>j.id===activeJob) || filtered[0];

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <MatchesV2Header setPage={setPage} loop="Frontend EU" />
      <SourcesStrip active={activeSrc} setActive={setActiveSrc} />

      <div style={{padding:"12px 28px 0", borderBottom:"1px solid var(--border)", background:"var(--bg)", display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:14, flexWrap:"wrap"}}>
        <div style={{display:"flex", gap:0, alignItems:"flex-end"}}>
          {tabs.map(t=>(
            <a key={t.k} onClick={()=>setTab(t.k)} style={{
              padding:"8px 14px", fontSize:13,
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
        <div style={{display:"flex", gap:8, alignItems:"center", paddingBottom:8}}>
          <span style={{fontSize:11.5, color:"var(--fg-subtle)"}}>Сортировка:</span>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{
            background:"var(--bg-elev)", border:"1px solid var(--border)",
            borderRadius:6, padding:"4px 8px", fontSize:12, color:"var(--fg)",
            fontFamily:"inherit", cursor:"pointer",
          }}>
            <option value="match">По матч-скору</option>
            <option value="posted">По дате публикации</option>
            <option value="salary">По зарплате</option>
            <option value="company">По компании (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Body: list + detail */}
      <div style={{flex:1, overflow:"hidden", padding:"14px 28px 28px", background:"var(--bg)"}}>
        <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1.1fr) minmax(0, 1fr)", gap:14, height:"100%"}}>
          {/* List */}
          <CardM2 padding={0} style={{display:"flex", flexDirection:"column", overflow:"hidden"}}>
            <div style={{padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0}}>
              <span style={{fontSize:12, color:"var(--fg-muted)"}}>
                <strong style={{color:"var(--fg)", fontWeight:600, fontVariantNumeric:"tabular-nums"}}>{filtered.length}</strong> вакансий
              </span>
              <span style={{fontSize:11, color:"var(--fg-subtle)"}}>Автообновление через <span style={{color:"var(--fg-muted)", fontVariantNumeric:"tabular-nums"}}>13:42</span></span>
            </div>
            <div style={{flex:1, overflowY:"auto"}}>
              {filtered.length === 0 ? (
                <div style={{padding:"40px 24px", textAlign:"center"}}>
                  <div style={{fontSize:14, fontWeight:500}}>Здесь пока пусто</div>
                  <div style={{fontSize:12.5, color:"var(--fg-muted)", marginTop:6, maxWidth:300, marginLeft:"auto", marginRight:"auto", lineHeight:1.5}}>
                    Попробуй сменить вкладку, выбрать другой источник или запустить цикл вручную.
                  </div>
                </div>
              ) : filtered.map((j,i)=>{
                const isActive = job && j.id===job.id;
                const isApplied = j.state === "applied";
                const isSaved = j.state === "saved";
                return (
                  <div key={j.id} onClick={()=>setActiveJob(j.id)} style={{
                    padding:"14px 16px", cursor:"pointer",
                    borderBottom: i<filtered.length-1 ? "1px solid var(--border)" : "none",
                    background: isActive ? "var(--bg-subtle)" : "transparent",
                    borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                    transition:"background 100ms",
                  }}>
                    <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
                      <div style={{
                        width:32, height:32, borderRadius:6, flexShrink:0,
                        background:j.logo, color:"#fff",
                        display:"grid", placeItems:"center", fontSize:13, fontWeight:700, letterSpacing:"-0.04em",
                      }}>{j.c[0]}</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap"}}>
                          <span style={{fontSize:13.5, fontWeight:500, letterSpacing:"-0.005em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{j.role}</span>
                          {isApplied && <PillM2 tone="info">Отклик</PillM2>}
                          {isSaved && <PillM2 tone="neutral">Сохранено</PillM2>}
                          {j.state==="new" && j.match >= 90 && <PillM2 tone="accent">★ Топ-матч</PillM2>}
                        </div>
                        <div style={{fontSize:11.5, color:"var(--fg-subtle)", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
                          <span style={{color:"var(--fg-muted)", fontWeight:500}}>{j.c}</span>
                          <span>· {j.loc}</span>
                          <span style={{display:"inline-flex", alignItems:"center", gap:4}}>· <SrcDot src={j.src} size={6}/> {M2_SOURCES.find(s=>s.k===j.src)?.l}</span>
                          <span>· {j.posted}</span>
                        </div>
                        <div style={{display:"flex", gap:6, marginTop:8, flexWrap:"wrap"}}>
                          {j.tags.slice(0,4).map(t=>(
                            <span key={t} style={{
                              fontSize:10.5, padding:"2px 7px", borderRadius:4,
                              background:"var(--bg-subtle)", color:"var(--fg-muted)",
                              border:"1px solid var(--border)",
                            }}>{t}</span>
                          ))}
                          {j.tags.length>4 && <span style={{fontSize:10.5, color:"var(--fg-subtle)"}}>+{j.tags.length-4}</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right", flexShrink:0, marginLeft:6}}>
                        <div style={{
                          display:"inline-flex", alignItems:"center", justifyContent:"center",
                          width:34, height:34, borderRadius:6,
                          background: j.match>=85 ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "var(--bg-subtle)",
                          border: "1px solid " + (j.match>=85 ? "color-mix(in oklab, var(--accent) 35%, var(--border))" : "var(--border)"),
                          color: j.match>=85 ? "var(--accent)" : "var(--fg-muted)",
                          fontSize:13, fontWeight:600, fontVariantNumeric:"tabular-nums",
                          letterSpacing:"-0.02em",
                        }}>{j.match}</div>
                        <div style={{fontSize:10, color:"var(--fg-subtle)", marginTop:3}}>{j.salary.replace(" + equity","").replace("k+","").split(" ")[0]}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardM2>

          {/* Detail */}
          <JobDetail job={job} setPage={setPage} />
        </div>
      </div>
    </div>
  );
}

window.MatchesV2Page = { MatchesV2 };
