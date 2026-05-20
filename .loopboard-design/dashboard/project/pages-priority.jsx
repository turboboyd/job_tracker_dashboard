/* Priority pages: Application Detail (refined), Analytics, Calendar, Optimization, Activity */
const { Card: CardP, Pill: PillP, Btn: BtnP, SectionLabel: SectionLabelP, Icon: IconP } = window.UI;

function PageHeaderP({ crumb, title, subtitle, actions, back, setPage }) {
  return (
    <div style={{borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
      <div style={{padding:"16px 28px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:16, flexWrap:"wrap"}}>
          <div style={{minWidth:0, flex:1}}>
            {crumb && (
              <div style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-subtle)", marginBottom:4}}>
                {back && (
                  <a onClick={()=>setPage(back)} style={{color:"var(--fg-subtle)", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:3}}>← </a>
                )}
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

function pageWrapP(headerProps, body) {
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <PageHeaderP {...headerProps} />
      <div style={{flex:1, overflowY:"auto", padding:"24px 28px 48px", background:"var(--bg)"}}>
        {body}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// APPLICATION DETAIL — refined, single source of truth for one application
// ═════════════════════════════════════════════════════════════════════════════
const STAGES = [
  { k:"applied",   l:"Откликнулся",  done:true,  date:"12 апр" },
  { k:"screen",    l:"HR-скрин",     done:true,  date:"18 апр" },
  { k:"tech",      l:"Технический",  done:true,  date:"24 апр" },
  { k:"final",     l:"Финал",        done:false, date:"6 мая",  current:true },
  { k:"offer",     l:"Оффер",        done:false, date:"—" },
];

const TIMELINE = [
  { d:"6 мая",  t:"14:30", who:"Anna Petrova",  type:"interview", title:"Финальное интервью с CTO + продакт-лидом", note:"60 мин · Google Meet · подключение по ссылке за 5 минут" },
  { d:"4 мая",  t:"11:05", who:"Loopboard",    type:"system",    title:"Назначен финальный раунд",                  note:"После прохождения технического этапа" },
  { d:"24 апр", t:"15:00", who:"Tom Becker",   type:"interview", title:"Технический интервью пройдено ✓",           note:"Live-coding + system design · 90 мин" },
  { d:"22 апр", t:"09:12", who:"Loopboard",    type:"system",    title:"Отправлено тестовое задание",                note:"3 дня на выполнение, отправлено в срок" },
  { d:"18 апр", t:"10:30", who:"Anna Petrova",  type:"interview", title:"HR-скрин пройден",                          note:"Обсудили мотивацию, локацию, ожидания по ЗП" },
  { d:"12 апр", t:"08:45", who:"Ты",            type:"action",    title:"Отклик отправлен",                          note:"Cover letter v3 + CV maria-2026.pdf" },
];

function StageRibbon() {
  const lastDoneIdx = STAGES.map(s=>s.done).lastIndexOf(true);
  return (
    <div style={{
      display:"grid", gridTemplateColumns:`repeat(${STAGES.length}, 1fr)`,
      gap:0, position:"relative",
      padding:"6px 4px 4px",
    }}>
      {STAGES.map((s, i)=>{
        const reached = s.done || s.current;
        return (
          <div key={s.k} style={{position:"relative", textAlign:"left"}}>
            {/* connector */}
            {i < STAGES.length-1 && (
              <div style={{
                position:"absolute", top:13, left:"calc(50% + 14px)", right:"calc(-50% + 14px)",
                height:2,
                background: i <= lastDoneIdx ? "var(--accent)" : "var(--border)",
              }}/>
            )}
            {/* dot */}
            <div style={{
              width:26, height:26, borderRadius:99,
              border: s.current ? "2px solid var(--accent)" : "2px solid " + (s.done ? "var(--accent)" : "var(--border-strong)"),
              background: s.done ? "var(--accent)" : s.current ? "color-mix(in oklab, var(--accent) 14%, var(--bg-elev))" : "var(--bg-elev)",
              color: s.done ? "var(--accent-fg)" : s.current ? "var(--accent)" : "var(--fg-subtle)",
              display:"grid", placeItems:"center",
              fontSize:11, fontWeight:700,
              boxShadow: s.current ? "0 0 0 4px color-mix(in oklab, var(--accent) 16%, transparent)" : "none",
              position:"relative", zIndex:1,
            }}>
              {s.done ? "✓" : i+1}
            </div>
            <div style={{marginTop:10, fontSize:12, fontWeight: reached?500:400, color: reached ? "var(--fg)" : "var(--fg-subtle)"}}>{s.l}</div>
            <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:1}}>{s.date}</div>
          </div>
        );
      })}
    </div>
  );
}

function DetailsPageV2({ setPage }) {
  const [tab, setTab] = React.useState("overview");

  const meta = (
    <>
      <div style={{display:"flex", alignItems:"center", gap:14, marginBottom:6, flexWrap:"wrap"}}>
        <div style={{
          width:46, height:46, borderRadius:8,
          background:"linear-gradient(135deg, #000, #333)", color:"#fff",
          display:"grid", placeItems:"center", fontSize:20, fontWeight:700, letterSpacing:"-0.04em",
        }}>N</div>
        <div style={{minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
            <span style={{fontSize:22, fontWeight:600, letterSpacing:"-0.025em"}}>Senior Product Engineer</span>
            <PillP tone="accent">Финал</PillP>
            <PillP tone="success">Active</PillP>
          </div>
          <div style={{fontSize:13, color:"var(--fg-muted)", marginTop:2, display:"flex", gap:14, flexWrap:"wrap"}}>
            <span><strong style={{color:"var(--fg)", fontWeight:500}}>Notion</strong> · Munich (Hybrid)</span>
            <span>· €95–115K + equity</span>
            <span>· Откликнулся 12 апр · 24 дня в воронке</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      {/* Custom header (bigger) */}
      <div style={{borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <div style={{padding:"16px 28px 0"}}>
          <div style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-subtle)", marginBottom:10}}>
            <a onClick={()=>setPage("applications")} style={{color:"var(--fg-subtle)", cursor:"pointer"}}>← Заявки</a>
            <span>/</span>
            <span style={{color:"var(--fg-muted)"}}>Notion · Senior Product Engineer</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap"}}>
            <div style={{minWidth:280, flex:"1 1 380px"}}>{meta}</div>
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", flex:"0 1 auto"}}>
              <BtnP variant="outline" size="sm" icon={IconP.search}>Открыть на сайте</BtnP>
              <BtnP variant="outline" size="sm" icon={IconP.bookmark}>Сохранить</BtnP>
              <BtnP variant="primary" size="sm" icon={IconP.spark}>Подготовить к интервью</BtnP>
              <button style={{
                width:32, height:32, borderRadius:6, border:"1px solid var(--border)",
                background:"var(--bg-elev)", cursor:"pointer", color:"var(--fg-muted)",
                fontSize:14, lineHeight:1,
              }}>⋯</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex", gap:0, marginTop:18, marginBottom:-1}}>
            {[
              { k:"overview",   l:"Обзор" },
              { k:"description",l:"Описание" },
              { k:"timeline",   l:"Хронология", b:TIMELINE.length },
              { k:"prep",       l:"Подготовка" },
              { k:"contacts",   l:"Контакты", b:2 },
              { k:"files",      l:"Файлы", b:3 },
              { k:"notes",      l:"Заметки" },
            ].map(t=>(
              <a key={t.k} onClick={()=>setTab(t.k)} style={{
                padding:"10px 14px", fontSize:13,
                cursor:"pointer", borderBottom: tab===t.k ? "2px solid var(--fg)" : "2px solid transparent",
                color: tab===t.k ? "var(--fg)" : "var(--fg-muted)",
                fontWeight: tab===t.k ? 500 : 400,
                display:"flex", alignItems:"center", gap:6,
              }}>
                {t.l}
                {t.b && <span style={{
                  fontSize:10, padding:"1px 6px", borderRadius:99,
                  background:"var(--bg-subtle)", border:"1px solid var(--border)",
                  color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums",
                }}>{t.b}</span>}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{flex:1, overflowY:"auto", padding:"24px 28px 48px", background:"var(--bg)"}}>
        {tab === "overview" && (
          <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1fr) 320px", gap:14}}>
            <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
              {/* Stage ribbon */}
              <CardP padding={20}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
                  <SectionLabelP>Этап воронки</SectionLabelP>
                  <span style={{fontSize:12, color:"var(--fg-subtle)"}}>4 / 5 · следующий шаг — финал 6 мая</span>
                </div>
                <StageRibbon />
              </CardP>

              {/* Quick facts */}
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:14}}>
                {[
                  { l:"Match-скор",  v:"88",  sub:"/ 100", tone:"accent" },
                  { l:"Дней в воронке", v:"24", sub:"медиана 18" },
                  { l:"Интервью",   v:"3",  sub:"из 4 запланированных" },
                  { l:"Шанс оффера", v:"62%", sub:"оценка модели", tone:"success" },
                ].map(s=>(
                  <CardP key={s.l} padding={16}>
                    <SectionLabelP>{s.l}</SectionLabelP>
                    <div style={{display:"flex", alignItems:"baseline", gap:6, marginTop:8}}>
                      <span style={{
                        fontSize:24, fontWeight:600, letterSpacing:"-0.025em",
                        fontVariantNumeric:"tabular-nums",
                        color: s.tone==="accent" ? "var(--accent)" : s.tone==="success" ? "rgb(5,150,105)" : "var(--fg)",
                      }}>{s.v}</span>
                      <span style={{fontSize:11.5, color:"var(--fg-subtle)"}}>{s.sub}</span>
                    </div>
                  </CardP>
                ))}
              </div>

              {/* AI brief */}
              <CardP padding={22}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:14}}>
                  <div style={{display:"flex", alignItems:"center", gap:8}}>
                    <span style={{
                      width:24, height:24, borderRadius:6,
                      background:"color-mix(in oklab, var(--accent) 14%, transparent)",
                      color:"var(--accent)", display:"grid", placeItems:"center",
                    }}>{IconP.spark}</span>
                    <SectionLabelP>AI-бриф · обновлён 2 часа назад</SectionLabelP>
                  </div>
                  <BtnP variant="ghost" size="sm">Перегенерировать</BtnP>
                </div>
                <div style={{fontSize:13.5, lineHeight:1.65, color:"var(--fg-muted)"}}>
                  Команда Notion ищет инженера в редактор — упор на real-time коллаборацию и производительность. Ты сильный кандидат: 7+ лет на стеке, опыт ProseMirror и WebSockets из проекта в GitHub. <strong style={{color:"var(--fg)", fontWeight:500}}>Слабее:</strong> у тебя меньше опыта с Y.js и CRDT — стоит освежить теорию перед финалом. <strong style={{color:"var(--fg)", fontWeight:500}}>Спросят с большой вероятностью:</strong> архитектура коллаба, конфликты состояний, реактивность UI на 100k+ нод.
                </div>
                <div style={{display:"flex", gap:6, marginTop:14, flexWrap:"wrap"}}>
                  {["CRDT","Y.js","ProseMirror","Performance","System design"].map(t=>(
                    <PillP key={t} tone="neutral">{t}</PillP>
                  ))}
                </div>
              </CardP>

              {/* Next action */}
              <CardP padding={22} style={{background:"linear-gradient(135deg, color-mix(in oklab, var(--accent) 6%, var(--bg-elev)), var(--bg-elev))", border:"1px solid color-mix(in oklab, var(--accent) 25%, var(--border))"}}>
                <div style={{display:"flex", gap:14, alignItems:"flex-start"}}>
                  <div style={{
                    width:44, height:44, borderRadius:8, flexShrink:0,
                    background:"var(--accent)", color:"var(--accent-fg)",
                    display:"grid", placeItems:"center",
                    fontSize:11, fontWeight:600, letterSpacing:"-0.005em",
                    textAlign:"center", lineHeight:1.1,
                  }}>
                    <div>
                      <div>6</div>
                      <div style={{fontSize:9, opacity:0.85}}>МАЙ</div>
                    </div>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <SectionLabelP>Следующее действие</SectionLabelP>
                    <div style={{fontSize:16, fontWeight:600, letterSpacing:"-0.02em", marginTop:6}}>
                      Финальное интервью · 14:30
                    </div>
                    <div style={{fontSize:12.5, color:"var(--fg-muted)", marginTop:4, lineHeight:1.5}}>
                      60 мин · Google Meet · с CTO Ivan Z. и Product Lead Anna L. Подготовка автоматически закроется накануне.
                    </div>
                    <div style={{display:"flex", gap:8, marginTop:14, flexWrap:"wrap"}}>
                      <BtnP variant="primary" size="sm">Открыть встречу</BtnP>
                      <BtnP variant="outline" size="sm">Перенести</BtnP>
                      <BtnP variant="ghost" size="sm">В календарь .ics</BtnP>
                    </div>
                  </div>
                </div>
              </CardP>
            </div>

            {/* Right column */}
            <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
              {/* Job meta */}
              <CardP padding={18}>
                <SectionLabelP>Параметры вакансии</SectionLabelP>
                <div style={{display:"grid", gridTemplateColumns:"auto 1fr", gap:"10px 14px", marginTop:14, fontSize:12.5}}>
                  {[
                    ["Источник","LinkedIn"],
                    ["Цикл","Frontend · EU"],
                    ["Уровень","Senior"],
                    ["Контракт","Full-time"],
                    ["Локация","Munich"],
                    ["Формат","Hybrid 2/3"],
                    ["Релокация","Да, спонсорство"],
                    ["Стек","React, TS, Node, Y.js"],
                    ["Команда","Editor · 9 чел"],
                  ].map(([k,v])=>(
                    <React.Fragment key={k}>
                      <div style={{color:"var(--fg-subtle)"}}>{k}</div>
                      <div style={{color:"var(--fg)", fontWeight:400}}>{v}</div>
                    </React.Fragment>
                  ))}
                </div>
              </CardP>

              {/* Contacts */}
              <CardP padding={18}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                  <SectionLabelP>Контакты по заявке</SectionLabelP>
                  <a style={{fontSize:11.5, color:"var(--fg-subtle)", cursor:"pointer"}}>+ Добавить</a>
                </div>
                {[
                  { fn:"Anna",  ln:"Petrova", role:"HR · первая линия" },
                  { fn:"Tom",   ln:"Becker",  role:"Tech Lead · интервьюер" },
                ].map(c=>(
                  <div key={c.fn} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border)"}}>
                    <div style={{
                      width:30, height:30, borderRadius:99,
                      background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
                      color:"#fff", display:"grid", placeItems:"center",
                      fontSize:11, fontWeight:600,
                    }}>{c.fn[0]}{c.ln[0]}</div>
                    <div style={{minWidth:0, flex:1}}>
                      <div style={{fontSize:12.5, fontWeight:500}}>{c.fn} {c.ln}</div>
                      <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:1}}>{c.role}</div>
                    </div>
                  </div>
                ))}
              </CardP>

              {/* Files */}
              <CardP padding={18}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                  <SectionLabelP>Файлы</SectionLabelP>
                  <a style={{fontSize:11.5, color:"var(--fg-subtle)", cursor:"pointer"}}>+ Добавить</a>
                </div>
                {[
                  { n:"maria-2026.pdf",        s:"CV", sz:"184 KB" },
                  { n:"cover-notion-v3.txt",   s:"Cover", sz:"2 KB"  },
                  { n:"test-task-output.zip",  s:"Тестовое", sz:"1.4 MB" },
                ].map(f=>(
                  <div key={f.n} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border)"}}>
                    <div style={{
                      width:30, height:30, borderRadius:6,
                      background:"var(--bg-subtle)", border:"1px solid var(--border)",
                      display:"grid", placeItems:"center",
                      fontSize:9, fontWeight:600, color:"var(--fg-muted)",
                      fontFamily:"var(--font-mono)",
                    }}>{f.n.split(".").pop().toUpperCase()}</div>
                    <div style={{minWidth:0, flex:1}}>
                      <div style={{fontSize:12, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{f.n}</div>
                      <div style={{fontSize:10.5, color:"var(--fg-subtle)", marginTop:1}}>{f.s} · {f.sz}</div>
                    </div>
                  </div>
                ))}
              </CardP>
            </div>
          </div>
        )}

        {tab === "timeline" && (
          <div style={{maxWidth:780, margin:"0 auto"}}>
            <CardP padding={0}>
              {TIMELINE.map((e,i)=>{
                const tone = e.type==="interview" ? "var(--accent)" : e.type==="action" ? "rgb(5,150,105)" : "var(--fg-subtle)";
                return (
                  <div key={i} style={{display:"grid", gridTemplateColumns:"80px 32px 1fr", gap:14, padding:"16px 18px", borderBottom: i<TIMELINE.length-1 ? "1px solid var(--border)" : "none"}}>
                    <div style={{textAlign:"right", paddingTop:2}}>
                      <div style={{fontSize:12, fontWeight:500}}>{e.d}</div>
                      <div style={{fontSize:11, color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>{e.t}</div>
                    </div>
                    <div style={{position:"relative"}}>
                      <div style={{width:10, height:10, borderRadius:99, background:tone, marginTop:6}}/>
                      {i<TIMELINE.length-1 && <div style={{position:"absolute", top:18, left:4, bottom:-18, width:2, background:"var(--border)"}}/>}
                    </div>
                    <div>
                      <div style={{fontSize:13.5, fontWeight:500, letterSpacing:"-0.005em"}}>{e.title}</div>
                      <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:4, lineHeight:1.55}}>{e.note}</div>
                      <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:6}}>· {e.who}</div>
                    </div>
                  </div>
                );
              })}
            </CardP>
          </div>
        )}

        {tab === "description" && (
          <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1fr) 280px", gap:14}}>
            <CardP padding={28} style={{minWidth:0}}>
              <h2 style={{margin:"0 0 14px", fontSize:18, fontWeight:600, letterSpacing:"-0.02em"}}>О роли</h2>
              <div style={{fontSize:14, lineHeight:1.7, color:"var(--fg-muted)"}}>
                <p style={{margin:"0 0 12px"}}>Notion ищет Senior Product Engineer в команду редактора. Ты будешь работать над real-time коллаборацией, производительностью UI и архитектурой документного движка, который используется 4M+ людей каждый день.</p>
                <p style={{margin:"0 0 12px"}}><strong style={{color:"var(--fg)", fontWeight:600}}>Чем предстоит заниматься:</strong></p>
                <ul style={{margin:"0 0 12px", paddingLeft:20}}>
                  <li style={{marginBottom:6}}>Развивать движок коллаборации на базе CRDT и Y.js</li>
                  <li style={{marginBottom:6}}>Оптимизировать рендер ProseMirror на больших документах (100k+ блоков)</li>
                  <li style={{marginBottom:6}}>Менторить middle-инженеров и ревьюить PR</li>
                  <li style={{marginBottom:6}}>Закрывать UX-долги и улучшать accessibility</li>
                </ul>
                <p style={{margin:"0 0 12px"}}><strong style={{color:"var(--fg)", fontWeight:600}}>Что мы ждём:</strong></p>
                <ul style={{margin:"0 0 12px", paddingLeft:20}}>
                  <li style={{marginBottom:6}}>5+ лет на React + TypeScript в продуктовой среде</li>
                  <li style={{marginBottom:6}}>Опыт работы с editorами или real-time системами</li>
                  <li style={{marginBottom:6}}>Глубокое понимание перформанса и инструментов профилирования</li>
                  <li style={{marginBottom:6}}>Английский от B2, готовность к переезду в Munich</li>
                </ul>
              </div>
            </CardP>
            <CardP padding={20}>
              <SectionLabelP>Ключевые слова</SectionLabelP>
              <div style={{display:"flex", flexWrap:"wrap", gap:6, marginTop:12}}>
                {["React","TypeScript","Node","ProseMirror","Y.js","CRDT","WebSockets","Performance","System design","Mentoring"].map((t,i)=>(
                  <PillP key={t} tone={i<5 ? "success" : "neutral"}>{i<5 ? "✓ " : ""}{t}</PillP>
                ))}
              </div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:14, lineHeight:1.5}}>
                Зелёным — что есть в твоём CV. Серое — пробелы. Чекер CV предложит правки.
              </div>
              <BtnP variant="outline" size="sm" full style={{marginTop:14}} icon={IconP.spark}>Открыть в чекере</BtnP>
            </CardP>
          </div>
        )}

        {tab === "prep" && (
          <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1fr) 320px", gap:14}}>
            <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
              <CardP padding={22}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                  <SectionLabelP>Чек-лист подготовки · 5 / 8</SectionLabelP>
                  <span style={{fontSize:12, color:"var(--fg-subtle)"}}>62%</span>
                </div>
                <div style={{height:4, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden", marginBottom:18}}>
                  <div style={{height:"100%", width:"62%", background:"var(--accent)", borderRadius:99}}/>
                </div>
                {[
                  { d:true, l:"Прочитать описание роли", s:"5 мин · сделано 4 апр" },
                  { d:true, l:"Изучить продукт Notion", s:"30 мин · сделано 6 апр" },
                  { d:true, l:"Подготовить вопросы команде", s:"7 вопросов в заметках" },
                  { d:true, l:"Прогнать STAR-кейсы", s:"3 истории отрепетированы" },
                  { d:true, l:"Освежить алгоритмы", s:"LeetCode · 12 задач" },
                  { d:false, l:"Освежить CRDT и Y.js", s:"Слабая зона по AI-брифу", hot:true },
                  { d:false, l:"Тест звука и камеры", s:"За день до встречи" },
                  { d:false, l:"Проверить ссылку на Meet", s:"За 5 минут до" },
                ].map((c,i)=>(
                  <div key={i} style={{display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid var(--border)", alignItems:"flex-start"}}>
                    <div style={{
                      width:18, height:18, borderRadius:4, flexShrink:0, marginTop:1,
                      background: c.d ? "rgb(5,150,105)" : "var(--bg-subtle)",
                      border: c.d ? "none" : "1px solid var(--border-strong)",
                      display:"grid", placeItems:"center", color:"#fff", fontSize:11,
                    }}>{c.d ? "✓" : ""}</div>
                    <div style={{minWidth:0, flex:1}}>
                      <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                        <span style={{fontSize:13, fontWeight: c.d ? 400 : 500, color: c.d ? "var(--fg-muted)" : "var(--fg)", textDecoration: c.d ? "line-through" : "none"}}>{c.l}</span>
                        {c.hot && <PillP tone="warning">приоритет</PillP>}
                      </div>
                      <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>{c.s}</div>
                    </div>
                  </div>
                ))}
              </CardP>

              <CardP padding={22}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:14}}>
                  <span style={{
                    width:24, height:24, borderRadius:6,
                    background:"color-mix(in oklab, var(--accent) 14%, transparent)",
                    color:"var(--accent)", display:"grid", placeItems:"center",
                  }}>{IconP.spark}</span>
                  <SectionLabelP>Вероятные вопросы · сгенерировано AI</SectionLabelP>
                </div>
                {[
                  { c:"System design", q:"Как бы ты спроектировал real-time коллаборацию для документа на 100k+ блоков?", t:"15 мин" },
                  { c:"Технический",  q:"Расскажи про разницу между OT и CRDT — что бы ты выбрал и почему?", t:"10 мин" },
                  { c:"Технический",  q:"Какие подводные камни в WebSocket-соединениях для editor-а?", t:"8 мин" },
                  { c:"Behavioral",   q:"Расскажи про самый сложный конфликт в команде. Как разрешил?", t:"7 мин" },
                  { c:"Behavioral",   q:"Опиши проект, которым гордишься больше всего.", t:"5 мин" },
                ].map((q,i)=>(
                  <div key={i} style={{padding:"12px 0", borderBottom: i<4 ? "1px solid var(--border)" : "none"}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:10, marginBottom:4}}>
                      <PillP tone={q.c==="System design" ? "accent" : q.c==="Technical" ? "info" : "neutral"}>{q.c}</PillP>
                      <span style={{fontSize:11, color:"var(--fg-subtle)"}}>≈ {q.t}</span>
                    </div>
                    <div style={{fontSize:13.5, lineHeight:1.55, color:"var(--fg)"}}>{q.q}</div>
                    <div style={{display:"flex", gap:6, marginTop:8}}>
                      <BtnP variant="ghost" size="sm">Раскрыть подсказку</BtnP>
                      <BtnP variant="ghost" size="sm">Тренироваться</BtnP>
                    </div>
                  </div>
                ))}
              </CardP>
            </div>

            <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
              <CardP padding={20}>
                <SectionLabelP>До интервью</SectionLabelP>
                <div style={{fontSize:36, fontWeight:600, letterSpacing:"-0.04em", marginTop:8, fontVariantNumeric:"tabular-nums"}}>2д 4ч</div>
                <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:4}}>6 мая · 14:30 (CET)</div>
                <BtnP variant="primary" size="sm" full style={{marginTop:14}}>Открыть встречу</BtnP>
              </CardP>

              <CardP padding={20}>
                <SectionLabelP>Материалы для подготовки</SectionLabelP>
                <div style={{display:"flex", flexDirection:"column", gap:1, marginTop:14}}>
                  {[
                    { l:"Гайд: CRDT для frontend", t:"15 мин · в ресурсах" },
                    { l:"Y.js: основные концепции", t:"видео · 22 мин" },
                    { l:"ProseMirror архитектура", t:"статья · 8 мин" },
                    { l:"Notion blog: real-time", t:"3 поста" },
                  ].map((m,i)=>(
                    <a key={i} style={{
                      padding:"10px 0", borderBottom: i<3 ? "1px solid var(--border)" : "none",
                      cursor:"pointer", display:"block",
                    }}>
                      <div style={{fontSize:12.5, fontWeight:500, color:"var(--fg)"}}>{m.l}</div>
                      <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:2}}>{m.t}</div>
                    </a>
                  ))}
                </div>
              </CardP>

              <CardP padding={20}>
                <SectionLabelP>Кто проводит</SectionLabelP>
                <div style={{display:"flex", flexDirection:"column", gap:12, marginTop:14}}>
                  {[
                    { fn:"Ivan", ln:"Z.", role:"CTO · 4 года в Notion", note:"Глубокий технарь, любит конкретику" },
                    { fn:"Anna", ln:"L.", role:"Product Lead · Editor",  note:"Спросит про продуктовое мышление" },
                  ].map(p=>(
                    <div key={p.fn} style={{display:"flex", gap:10}}>
                      <div style={{
                        width:32, height:32, borderRadius:99, flexShrink:0,
                        background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
                        color:"#fff", display:"grid", placeItems:"center",
                        fontSize:11, fontWeight:600,
                      }}>{p.fn[0]}{p.ln[0]}</div>
                      <div style={{minWidth:0, flex:1}}>
                        <div style={{fontSize:12.5, fontWeight:500}}>{p.fn} {p.ln}</div>
                        <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:1}}>{p.role}</div>
                        <div style={{fontSize:11, color:"var(--fg-muted)", marginTop:4, lineHeight:1.5, fontStyle:"italic"}}>{p.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardP>
            </div>
          </div>
        )}

        {tab === "contacts" && (
          <div style={{maxWidth:880}}>
            <CardP padding={0}>
              {[
                { fn:"Anna",  ln:"Petrova", role:"HR · первая линия",       email:"anna@notion.so",      ch:"LinkedIn",  last:"3 дня назад", touch:5, fav:true },
                { fn:"Tom",   ln:"Becker",  role:"Tech Lead · интервьюер",  email:"tom.b@notion.so",     ch:"Email",     last:"вчера",       touch:3, fav:false },
                { fn:"Ivan",  ln:"Zakharov",role:"CTO · финал",             email:"ivan@notion.so",      ch:"—",         last:"—",           touch:0, fav:false },
                { fn:"Sofia", ln:"Rossi",   role:"Реферал",                 email:"sofia.rossi@gmail.com",ch:"Telegram", last:"5 дней",      touch:1, fav:true },
              ].map((c,i,arr)=>(
                <div key={c.fn} style={{
                  display:"grid", gridTemplateColumns:"40px minmax(0, 1.4fr) minmax(0, 1.5fr) minmax(0, 0.9fr) 80px auto",
                  gap:14, padding:"14px 18px", alignItems:"center",
                  borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{
                    width:32, height:32, borderRadius:99,
                    background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
                    color:"#fff", display:"grid", placeItems:"center", fontSize:11, fontWeight:600,
                  }}>{c.fn[0]}{c.ln[0]}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:500}}>
                      {c.fav && <span style={{color:"var(--accent)", marginRight:6}}>★</span>}
                      {c.fn} {c.ln}
                    </div>
                    <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>{c.role}</div>
                  </div>
                  <div style={{fontSize:12, color:"var(--fg-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.email}</div>
                  <div style={{fontSize:11.5, color:"var(--fg-subtle)"}}>{c.ch}</div>
                  <div style={{fontSize:11, color:"var(--fg-subtle)", textAlign:"right"}}>
                    <div>{c.touch}</div>
                    <div style={{fontSize:10, marginTop:1}}>контактов</div>
                  </div>
                  <div style={{display:"flex", gap:6}}>
                    <BtnP variant="outline" size="sm">Написать</BtnP>
                  </div>
                </div>
              ))}
            </CardP>
            <BtnP variant="outline" size="sm" icon={IconP.plus} style={{marginTop:14}}>Привязать контакт</BtnP>
          </div>
        )}

        {tab === "files" && (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14, maxWidth:920}}>
            {[
              { n:"maria-2026.pdf",       s:"CV",       sz:"184 KB", v:"v3", date:"4 мая", ext:"PDF",  c:"rgb(220,38,38)" },
              { n:"cover-notion-v3.txt",  s:"Cover",    sz:"2 KB",   v:"v3", date:"12 апр", ext:"TXT",  c:"var(--fg-muted)" },
              { n:"test-task-output.zip", s:"Тестовое", sz:"1.4 MB", v:"—",  date:"22 апр", ext:"ZIP",  c:"rgb(218,113,38)" },
              { n:"portfolio.pdf",        s:"Портфолио",sz:"3.2 MB", v:"v2", date:"1 апр",  ext:"PDF",  c:"rgb(220,38,38)" },
            ].map(f=>(
              <CardP key={f.n} padding={18}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14}}>
                  <div style={{
                    width:40, height:48, borderRadius:5,
                    background:`color-mix(in oklab, ${f.c} 14%, var(--bg-subtle))`,
                    border:`1px solid ${f.c}`,
                    color:f.c, display:"grid", placeItems:"center",
                    fontSize:10, fontWeight:700, fontFamily:"var(--font-mono)",
                  }}>{f.ext}</div>
                  <PillP tone="neutral">{f.s}</PillP>
                </div>
                <div style={{fontSize:13, fontWeight:500, marginBottom:4, wordBreak:"break-word"}}>{f.n}</div>
                <div style={{fontSize:11, color:"var(--fg-subtle)", lineHeight:1.6}}>
                  {f.sz} · {f.v !== "—" && <>{f.v} · </>}{f.date}
                </div>
                <div style={{display:"flex", gap:6, marginTop:14}}>
                  <BtnP variant="outline" size="sm">Скачать</BtnP>
                  <BtnP variant="ghost" size="sm">Заменить</BtnP>
                </div>
              </CardP>
            ))}
            <CardP padding={18} style={{
              border:"2px dashed var(--border-strong)",
              background:"transparent",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              minHeight:160, cursor:"pointer",
            }}>
              <div style={{fontSize:24, color:"var(--fg-subtle)", marginBottom:8}}>+</div>
              <div style={{fontSize:13, color:"var(--fg-muted)", fontWeight:500}}>Загрузить файл</div>
              <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:4}}>PDF, DOCX, TXT, ZIP до 10 MB</div>
            </CardP>
          </div>
        )}

        {tab === "notes" && (
          <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1fr) 280px", gap:14}}>
            <CardP padding={0} style={{minWidth:0}}>
              <div style={{padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div style={{display:"flex", gap:8, fontSize:12}}>
                  <BtnP variant="ghost" size="sm"><strong>B</strong></BtnP>
                  <BtnP variant="ghost" size="sm"><em>I</em></BtnP>
                  <BtnP variant="ghost" size="sm">H1</BtnP>
                  <BtnP variant="ghost" size="sm">·</BtnP>
                  <BtnP variant="ghost" size="sm">[]</BtnP>
                </div>
                <div style={{fontSize:11, color:"var(--fg-subtle)"}}>Сохранено · 2 мин назад</div>
              </div>
              <div style={{padding:"22px 26px", fontSize:14, lineHeight:1.7, color:"var(--fg)", minHeight:420}} contentEditable={false}>
                <h3 style={{margin:"0 0 8px", fontSize:18, fontWeight:600, letterSpacing:"-0.02em"}}>Заметки по Notion · Senior PE</h3>
                <p style={{margin:"0 0 12px", color:"var(--fg-muted)"}}>Команда впечатляющая. Anna прямая, говорит по делу. Tom — глубоко в технике, любит подробности.</p>
                <h4 style={{margin:"16px 0 6px", fontSize:14, fontWeight:600}}>Что узнал на скрине</h4>
                <ul style={{margin:"0 0 12px", paddingLeft:20, color:"var(--fg-muted)"}}>
                  <li style={{marginBottom:4}}>Команда Editor — 9 человек, основной офис в Munich</li>
                  <li style={{marginBottom:4}}>Hybrid 2/3 — обязательно вторник + ещё один день</li>
                  <li style={{marginBottom:4}}>ЗП 95–115K + 0.05–0.15% equity (vesting 4 года)</li>
                  <li style={{marginBottom:4}}>Релокация спонсируется, виза BlueCard ~3 месяца</li>
                </ul>
                <h4 style={{margin:"16px 0 6px", fontSize:14, fontWeight:600}}>Вопросы команде</h4>
                <ul style={{margin:"0 0 12px", paddingLeft:20, color:"var(--fg-muted)"}}>
                  <li style={{marginBottom:4}}>Какой главный технический долг в редакторе?</li>
                  <li style={{marginBottom:4}}>Как принимаются решения про архитектурные изменения?</li>
                  <li style={{marginBottom:4}}>Менторство — как часто 1:1, есть ли buddy?</li>
                  <li style={{marginBottom:4}}>Какие KPI у команды на 2026?</li>
                </ul>
                <h4 style={{margin:"16px 0 6px", fontSize:14, fontWeight:600}}>Чем зацепило</h4>
                <p style={{margin:"0", color:"var(--fg-muted)"}}>Возможность работать над продуктом, который реально использую сам. + локация Munich = ближе к семье. Красные флаги пока не вижу.</p>
              </div>
            </CardP>

            <div style={{display:"flex", flexDirection:"column", gap:14, minWidth:0}}>
              <CardP padding={18}>
                <SectionLabelP>История заметки</SectionLabelP>
                <div style={{display:"flex", flexDirection:"column", gap:1, marginTop:12}}>
                  {[
                    { d:"2 мин назад", v:"Текущая",    cur:true },
                    { d:"вчера 19:22", v:"+ блок «Что узнал на скрине»" },
                    { d:"4 мая",       v:"+ вопросы команде" },
                    { d:"18 апр",      v:"Создано после HR-скрина" },
                  ].map((h,i)=>(
                    <div key={i} style={{padding:"8px 0", borderBottom: i<3 ? "1px solid var(--border)" : "none", display:"flex", gap:8}}>
                      <span style={{
                        width:6, height:6, borderRadius:99, marginTop:8,
                        background: h.cur ? "var(--accent)" : "var(--border-strong)",
                        flexShrink:0,
                      }}/>
                      <div style={{minWidth:0, flex:1}}>
                        <div style={{fontSize:12, color: h.cur ? "var(--fg)" : "var(--fg-muted)", fontWeight: h.cur ? 500 : 400}}>{h.v}</div>
                        <div style={{fontSize:10.5, color:"var(--fg-subtle)", marginTop:2}}>{h.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardP>

              <CardP padding={18}>
                <SectionLabelP>Теги</SectionLabelP>
                <div style={{display:"flex", flexWrap:"wrap", gap:6, marginTop:12}}>
                  {["приоритет","финал","релокация","mentor-friendly"].map(t=>(
                    <PillP key={t} tone="neutral">{t}</PillP>
                  ))}
                </div>
                <BtnP variant="ghost" size="sm" style={{marginTop:10}}>+ добавить</BtnP>
              </CardP>
            </div>
          </div>
        )}

        {tab !== "overview" && tab !== "timeline" && tab !== "description" && tab !== "prep" && tab !== "contacts" && tab !== "files" && tab !== "notes" && (
          <CardP padding={40} style={{textAlign:"center"}}>
            <div style={{fontSize:14, color:"var(--fg-subtle)"}}>Раздел «{tab}» — дизайн в работе.</div>
          </CardP>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════
function Sparkline({ data, h=42, color="var(--accent)" }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, n = data.length;
  const points = data.map((v,i)=>`${(i/(n-1))*w},${h - ((v-min)/range)*(h-4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{width:"100%", height:h}}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points}/>
    </svg>
  );
}

function Bars({ data, labels, h=180 }) {
  const max = Math.max(...data) || 1;
  return (
    <div style={{display:"flex", alignItems:"flex-end", gap:6, height:h, paddingBottom:24, position:"relative"}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%"}}>
          <div style={{flex:1, width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end"}}>
            <div style={{
              height:`${(v/max)*100}%`, width:"100%",
              background: i === data.length-1 ? "var(--accent)" : "var(--bg-subtle)",
              border:"1px solid " + (i === data.length-1 ? "var(--accent)" : "var(--border)"),
              borderRadius:"3px 3px 0 0",
              position:"relative",
            }}>
              <div style={{
                position:"absolute", top:-18, left:0, right:0,
                fontSize:10, color:"var(--fg-subtle)", textAlign:"center", fontVariantNumeric:"tabular-nums",
              }}>{v}</div>
            </div>
          </div>
          <div style={{position:"absolute", bottom:0, fontSize:10, color:"var(--fg-subtle)", marginTop:6}}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPage({ setPage }) {
  const [range, setRange] = React.useState("90d");

  return pageWrapP(
    {
      crumb:["Loopboard","Воркспейс","Аналитика"],
      title:"Аналитика",
      subtitle:"Что работает в твоём поиске, а что съедает время впустую.",
      actions: (
        <>
          <div style={{display:"inline-flex", gap:0, padding:2, borderRadius:7, background:"var(--bg-subtle)", border:"1px solid var(--border)"}}>
            {[["7d","7д"],["30d","30д"],["90d","90д"],["all","Всё"]].map(([k,l])=>(
              <a key={k} onClick={()=>setRange(k)} style={{
                padding:"4px 10px", fontSize:12, borderRadius:5, cursor:"pointer",
                background: range===k ? "var(--bg-elev)" : "transparent",
                color: range===k ? "var(--fg)" : "var(--fg-subtle)",
                fontWeight: range===k ? 500 : 400,
                boxShadow: range===k ? "var(--shadow)" : "none",
              }}>{l}</a>
            ))}
          </div>
          <BtnP variant="outline" size="sm" icon={IconP.arrowUR}>Экспорт</BtnP>
        </>
      ),
    },
    (
      <>
        {/* KPI row */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:14, marginBottom:14}}>
          {[
            { l:"Заявок отправлено",  v:"36",  d:"+18%", trend:[3,5,4,7,6,8,12,9,11,15], pos:true },
            { l:"Отклик от компаний", v:"58%", d:"+12%", trend:[40,42,45,48,50,52,55,55,57,58], pos:true },
            { l:"Дошли до интервью",  v:"24%", d:"+5%",  trend:[15,17,18,19,20,21,22,22,23,24], pos:true },
            { l:"Среднее время цикла",v:"19д", d:"−3д",  trend:[28,26,25,24,23,22,21,20,20,19], pos:true },
          ].map(k=>(
            <CardP key={k.l} padding={18}>
              <SectionLabelP>{k.l}</SectionLabelP>
              <div style={{display:"flex", alignItems:"baseline", gap:8, marginTop:8, marginBottom:8}}>
                <span style={{fontSize:28, fontWeight:600, letterSpacing:"-0.025em", fontVariantNumeric:"tabular-nums"}}>{k.v}</span>
                <span style={{fontSize:12, fontWeight:500, color: k.pos ? "rgb(5,150,105)" : "rgb(220,38,38)"}}>{k.d}</span>
              </div>
              <Sparkline data={k.trend} color={k.pos ? "rgb(5,150,105)" : "rgb(220,38,38)"} />
            </CardP>
          ))}
        </div>

        {/* Funnel + sources */}
        <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1.4fr) minmax(0, 1fr)", gap:14, marginBottom:14}}>
          <CardP padding={22} style={{minWidth:0}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
              <SectionLabelP>Воронка по этапам</SectionLabelP>
              <span style={{fontSize:11.5, color:"var(--fg-subtle)"}}>За последние 90 дней</span>
            </div>
            {[
              { l:"Отклики",     v:36, w:100, c:"var(--accent)" },
              { l:"HR-скрин",    v:21, w:58,  c:"var(--accent)" },
              { l:"Технический", v:14, w:39,  c:"var(--accent)" },
              { l:"Финал",       v:8,  w:22,  c:"var(--accent)" },
              { l:"Оффер",       v:3,  w:8,   c:"rgb(5,150,105)" },
            ].map((s,i,arr)=>{
              const next = arr[i+1];
              const conv = next ? Math.round((next.v / s.v)*100) : null;
              return (
                <div key={s.l} style={{marginBottom:14}}>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:6}}>
                    <span style={{color:"var(--fg)", fontWeight:500}}>{s.l}</span>
                    <span style={{color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>
                      {s.v}
                      {conv !== null && <span style={{marginLeft:8}}>→ {conv}%</span>}
                    </span>
                  </div>
                  <div style={{height:24, background:"var(--bg-subtle)", borderRadius:5, overflow:"hidden", border:"1px solid var(--border)"}}>
                    <div style={{
                      height:"100%", width:`${s.w}%`,
                      background: s.c, opacity: 0.85,
                      transition:"width 400ms",
                    }}/>
                  </div>
                </div>
              );
            })}
          </CardP>

          <CardP padding={22} style={{minWidth:0}}>
            <SectionLabelP>Источники заявок</SectionLabelP>
            <div style={{display:"flex", flexDirection:"column", gap:14, marginTop:18}}>
              {[
                { l:"LinkedIn",        v:14, p:39, c:"#0a66c2" },
                { l:"Сайты компаний",  v:9,  p:25, c:"var(--accent)" },
                { l:"AngelList",       v:6,  p:17, c:"var(--accent-2)" },
                { l:"Реферал",         v:5,  p:14, c:"rgb(5,150,105)" },
                { l:"Hacker News",     v:2,  p:5,  c:"rgb(218,113,38)" },
              ].map(s=>(
                <div key={s.l}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", fontSize:12.5, marginBottom:6}}>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <span style={{width:8, height:8, borderRadius:2, background:s.c}}/>
                      <span style={{fontWeight:500}}>{s.l}</span>
                    </div>
                    <span style={{color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>{s.v} · {s.p}%</span>
                  </div>
                  <div style={{height:6, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                    <div style={{height:"100%", width:`${s.p}%`, background:s.c, borderRadius:99}}/>
                  </div>
                </div>
              ))}
            </div>
          </CardP>
        </div>

        {/* Activity by week */}
        <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1.6fr) minmax(0, 1fr)", gap:14, marginBottom:14}}>
          <CardP padding={22} style={{minWidth:0}}>
            <SectionLabelP>Активность по неделям</SectionLabelP>
            <div style={{marginTop:24, paddingRight:6}}>
              <Bars
                data={[4,7,5,9,6,11,8,14,10,15,12,18]}
                labels={["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"]}
                h={180}
              />
            </div>
            <div style={{display:"flex", gap:18, marginTop:24, fontSize:11.5, color:"var(--fg-subtle)", paddingTop:14, borderTop:"1px solid var(--border)"}}>
              <div><strong style={{color:"var(--fg)", fontWeight:500}}>119</strong> действий за квартал</div>
              <div>· пик — на 12-й неделе</div>
              <div>· медиана — 9 в неделю</div>
            </div>
          </CardP>

          <CardP padding={22} style={{minWidth:0}}>
            <SectionLabelP>Где теряются заявки</SectionLabelP>
            <div style={{marginTop:14, display:"flex", flexDirection:"column", gap:10}}>
              {[
                { l:"После HR-скрина", v:7, p:33 },
                { l:"После технического", v:6, p:43 },
                { l:"Без ответа > 14д", v:5, p:14 },
                { l:"Самоотозвано",  v:3, p:8 },
              ].map(s=>(
                <div key={s.l} style={{padding:"10px 0", borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                    <span style={{fontSize:12.5}}>{s.l}</span>
                    <span style={{fontSize:12, color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>{s.v} · {s.p}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop:14, padding:12, borderRadius:7,
              background:"var(--bg-subtle)", border:"1px solid var(--border)",
              fontSize:12, lineHeight:1.55, color:"var(--fg-muted)",
            }}>
              <strong style={{color:"var(--fg)", fontWeight:500}}>Инсайт:</strong> ты теряешь 43% после технического. Самые частые причины — system design. Открой раздел «Оптимизация».
            </div>
          </CardP>
        </div>
      </>
    )
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CALENDAR
// ═════════════════════════════════════════════════════════════════════════════
const CAL_EVENTS = {
  "2026-05-04": [{ t:"11:00", l:"Звонок · Stripe HR", tone:"accent" }],
  "2026-05-06": [{ t:"14:30", l:"Финал · Notion",     tone:"accent" }, { t:"17:00", l:"Подготовка к финалу", tone:"neutral" }],
  "2026-05-08": [{ t:"10:00", l:"Тех · Vercel",       tone:"info" }],
  "2026-05-12": [{ t:"15:00", l:"HR · Klarna",        tone:"accent" }],
  "2026-05-14": [{ t:"—",     l:"Дедлайн: тестовое GitHub", tone:"warning" }],
  "2026-05-19": [{ t:"13:00", l:"Финал · Linear",     tone:"accent" }],
  "2026-05-22": [{ t:"—",     l:"Запланировать следующий цикл", tone:"neutral" }],
  "2026-05-26": [{ t:"18:00", l:"Реферал-кофе · Sofia", tone:"info" }],
};

const TONE_BG = {
  accent:  "color-mix(in oklab, var(--accent) 18%, transparent)",
  info:    "color-mix(in oklab, var(--accent-2) 18%, transparent)",
  warning: "color-mix(in oklab, rgb(218,113,38) 18%, transparent)",
  neutral: "var(--bg-subtle)",
};
const TONE_FG = {
  accent:  "var(--accent)",
  info:    "var(--accent-2)",
  warning: "rgb(180,83,9)",
  neutral: "var(--fg-muted)",
};

function CalendarPage({ setPage }) {
  // May 2026: starts on Friday (1st); 31 days
  const monthStart = 5; // 0=Mon → Friday is index 4
  const daysInMonth = 31;
  const today = 9;
  const prevMonthDays = monthStart;
  const totalCells = Math.ceil((prevMonthDays + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i=0; i<totalCells; i++) {
    const dayNum = i - prevMonthDays + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateKey = inMonth ? `2026-05-${String(dayNum).padStart(2,"0")}` : null;
    cells.push({ dayNum, inMonth, dateKey, events: dateKey ? CAL_EVENTS[dateKey] || [] : [] });
  }

  const upcoming = Object.entries(CAL_EVENTS)
    .filter(([k])=>parseInt(k.slice(-2)) >= today)
    .flatMap(([k,evs])=>evs.map(e=>({ date:k, ...e })))
    .slice(0,6);

  return pageWrapP(
    {
      crumb:["Loopboard","Воркспейс","Календарь"],
      title:"Календарь",
      subtitle:"Все интервью, дедлайны и встречи по заявкам в одном месте.",
      actions: (
        <>
          <div style={{display:"inline-flex", gap:0, padding:2, borderRadius:7, background:"var(--bg-subtle)", border:"1px solid var(--border)"}}>
            {["День","Неделя","Месяц"].map((l,i)=>(
              <a key={l} style={{
                padding:"4px 10px", fontSize:12, borderRadius:5, cursor:"pointer",
                background: i===2 ? "var(--bg-elev)" : "transparent",
                color: i===2 ? "var(--fg)" : "var(--fg-subtle)",
                fontWeight: i===2 ? 500 : 400,
                boxShadow: i===2 ? "var(--shadow)" : "none",
              }}>{l}</a>
            ))}
          </div>
          <BtnP variant="outline" size="sm" icon={IconP.loop}>Sync iCal</BtnP>
          <BtnP variant="primary" size="sm" icon={IconP.plus}>Создать событие</BtnP>
        </>
      ),
    },
    (
      <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1fr) 300px", gap:14}}>
        <CardP padding={0} style={{minWidth:0}}>
          {/* Calendar header */}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid var(--border)"}}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <button style={{width:28, height:28, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-elev)", cursor:"pointer", color:"var(--fg-muted)"}}>‹</button>
              <button style={{width:28, height:28, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-elev)", cursor:"pointer", color:"var(--fg-muted)"}}>›</button>
              <span style={{fontSize:16, fontWeight:600, letterSpacing:"-0.015em", marginLeft:6}}>Май 2026</span>
            </div>
            <div style={{display:"flex", gap:14, fontSize:11, color:"var(--fg-subtle)"}}>
              <span style={{display:"flex", alignItems:"center", gap:6}}><span style={{width:8, height:8, borderRadius:2, background:"var(--accent)"}}/>Интервью</span>
              <span style={{display:"flex", alignItems:"center", gap:6}}><span style={{width:8, height:8, borderRadius:2, background:"var(--accent-2)"}}/>Тех</span>
              <span style={{display:"flex", alignItems:"center", gap:6}}><span style={{width:8, height:8, borderRadius:2, background:"rgb(218,113,38)"}}/>Дедлайн</span>
            </div>
          </div>

          {/* Days header */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(7, 1fr)", borderBottom:"1px solid var(--border)"}}>
            {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d=>(
              <div key={d} style={{padding:"8px 10px", fontSize:11, color:"var(--fg-subtle)", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:500}}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(7, 1fr)"}}>
            {cells.map((c,i)=>(
              <div key={i} style={{
                minHeight:96, padding:6,
                borderRight: ((i+1)%7) ? "1px solid var(--border)" : "none",
                borderBottom: i < cells.length - 7 ? "1px solid var(--border)" : "none",
                background: c.inMonth ? "transparent" : "var(--bg-subtle)",
                opacity: c.inMonth ? 1 : 0.5,
                position:"relative",
              }}>
                <div style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  minWidth:22, height:22, borderRadius:99, fontSize:12,
                  fontWeight: c.dayNum===today ? 600 : 400,
                  color: c.dayNum===today ? "var(--accent-fg)" : "var(--fg-muted)",
                  background: c.dayNum===today ? "var(--accent)" : "transparent",
                  marginBottom:4,
                  fontVariantNumeric:"tabular-nums",
                }}>{c.inMonth ? c.dayNum : (c.dayNum > daysInMonth ? c.dayNum - daysInMonth : "")}</div>
                <div style={{display:"flex", flexDirection:"column", gap:2}}>
                  {c.events.slice(0,3).map((e,j)=>(
                    <div key={j} onClick={(ev)=>{ev.stopPropagation(); setPage && setPage("details");}} style={{
                      fontSize:10.5, padding:"2px 5px", borderRadius:3,
                      background: TONE_BG[e.tone], color: TONE_FG[e.tone],
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                      fontWeight:500, cursor:"pointer",
                    }}>
                      {e.t !== "—" && <span style={{fontVariantNumeric:"tabular-nums", marginRight:4}}>{e.t}</span>}
                      {e.l}
                    </div>
                  ))}
                  {c.events.length > 3 && (
                    <div style={{fontSize:10, color:"var(--fg-subtle)", marginTop:1}}>+{c.events.length-3} ещё</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardP>

        {/* Upcoming */}
        <div style={{display:"flex", flexDirection:"column", gap:14}}>
          <CardP padding={18}>
            <SectionLabelP>Сегодня · 9 мая</SectionLabelP>
            <div style={{marginTop:14, padding:"14px", borderRadius:7, background:"var(--bg-subtle)", border:"1px solid var(--border)", textAlign:"center"}}>
              <div style={{fontSize:12.5, color:"var(--fg-muted)"}}>Свободный день</div>
              <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:4}}>Хорошее время сделать тестовое для GitHub</div>
            </div>
          </CardP>

          <CardP padding={18}>
            <SectionLabelP>Ближайшие события</SectionLabelP>
            <div style={{marginTop:14, display:"flex", flexDirection:"column", gap:1}}>
              {upcoming.map((e,i)=>{
                const day = parseInt(e.date.slice(-2));
                return (
                  <div key={i} onClick={()=>setPage && setPage("details")} style={{display:"flex", gap:12, padding:"10px 0", borderBottom: i<upcoming.length-1 ? "1px solid var(--border)" : "none", cursor:"pointer"}}>
                    <div style={{
                      width:36, textAlign:"center", flexShrink:0,
                      padding:"4px 0", borderRadius:5,
                      background: TONE_BG[e.tone], color: TONE_FG[e.tone],
                    }}>
                      <div style={{fontSize:14, fontWeight:600, lineHeight:1, fontVariantNumeric:"tabular-nums"}}>{day}</div>
                      <div style={{fontSize:9, marginTop:2}}>МАЙ</div>
                    </div>
                    <div style={{minWidth:0, flex:1}}>
                      <div style={{fontSize:12.5, fontWeight:500, lineHeight:1.3}}>{e.l}</div>
                      <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:2, fontVariantNumeric:"tabular-nums"}}>{e.t!=="—" && <>{e.t} · </>}{day} мая</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardP>
        </div>
      </div>
    )
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// OPTIMIZATION — actionable insights to improve the search loop
// ═════════════════════════════════════════════════════════════════════════════
const OPT_INSIGHTS = [
  {
    severity:"critical", impact:"+18%", area:"Технический этап",
    title:"Слабая зона: system design",
    body:"Из 14 технических интервью ты прошёл только 8 (57%). По логам — 4 из 6 отказов после неудачи в system design. Сильнее всего проседают темы про распределённые кеши и event-sourcing.",
    actions:[{l:"Открыть гайд по system design", primary:true}, {l:"Запланировать практику"}],
  },
  {
    severity:"high", impact:"+12%", area:"CV",
    title:"CV не обновлялся 47 дней",
    body:"С последнего обновления ты прошёл 3 интервью и сделал 2 проекта на работе. Релевантные кейсы можно положить в CV — это поднимет матч-скор по 6 активным заявкам.",
    actions:[{l:"Обновить CV", primary:true}, {l:"Игнорировать"}],
  },
  {
    severity:"high", impact:"+8%", area:"Циклы поиска",
    title:"Цикл «Frontend EU» давно не запускался",
    body:"Последний запуск — 12 дней назад. За это время на платформах появилось 23 новых вакансии под твои критерии. 4 из них имеют match-скор > 85%.",
    actions:[{l:"Запустить цикл", primary:true}, {l:"Открыть цикл"}],
  },
  {
    severity:"medium", impact:"+5%", area:"Контакты",
    title:"3 рекрутера ждут ответа > 5 дней",
    body:"Anna (Notion), Maria (Stripe) и Eva (Klarna) не получили ответа. Долгое молчание снижает вероятность прохождения дальше.",
    actions:[{l:"Открыть Inbox", primary:true}],
  },
  {
    severity:"low", impact:"+3%", area:"Профиль",
    title:"В профиле не указан LinkedIn",
    body:"Заявки с LinkedIn-профилем получают на 14% чаще ответ от рекрутеров.",
    actions:[{l:"Добавить", primary:true}],
  },
];

const SEV_TONE = {
  critical: { bg:"rgb(220,38,38)",   bgSoft:"color-mix(in oklab, rgb(220,38,38) 14%, transparent)",   l:"Критично" },
  high:     { bg:"rgb(218,113,38)",  bgSoft:"color-mix(in oklab, rgb(218,113,38) 14%, transparent)",  l:"Высокий"  },
  medium:   { bg:"var(--accent)",    bgSoft:"color-mix(in oklab, var(--accent) 14%, transparent)",    l:"Средний"  },
  low:      { bg:"var(--fg-subtle)", bgSoft:"var(--bg-subtle)",                                       l:"Низкий"   },
};

function OptimizationPage({ setPage }) {
  return pageWrapP(
    {
      crumb:["Loopboard","Воркспейс","Оптимизация"],
      title:"Оптимизация поиска",
      subtitle:"Точечные улучшения, которые увеличивают шанс оффера. Отсортированы по влиянию.",
      actions: (
        <>
          <BtnP variant="outline" size="sm" icon={IconP.loop}>Перепроверить</BtnP>
          <BtnP variant="primary" size="sm" icon={IconP.spark}>Применить топ-3</BtnP>
        </>
      ),
    },
    (
      <>
        {/* Score */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14, marginBottom:18}}>
          <CardP padding={22} style={{gridColumn:"span 2", minWidth:0}}>
            <div style={{display:"flex", alignItems:"center", gap:24, flexWrap:"wrap"}}>
              <div style={{position:"relative", width:120, height:120, flexShrink:0}}>
                <svg viewBox="0 0 100 100" style={{width:"100%", height:"100%", transform:"rotate(-90deg)"}}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-subtle)" strokeWidth="10"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="10"
                    strokeDasharray={`${0.62*264} 264`} strokeLinecap="round"/>
                </svg>
                <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:30, fontWeight:600, letterSpacing:"-0.04em", lineHeight:1}}>62</div>
                    <div style={{fontSize:10, color:"var(--fg-subtle)", marginTop:2}}>/ 100</div>
                  </div>
                </div>
              </div>
              <div style={{minWidth:0, flex:1}}>
                <SectionLabelP>Качество поиска</SectionLabelP>
                <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.02em", marginTop:6}}>Можно лучше</div>
                <div style={{fontSize:13, color:"var(--fg-muted)", marginTop:6, lineHeight:1.6}}>
                  Применение всех рекомендаций ниже даёт прогноз <strong style={{color:"var(--fg)"}}>+46%</strong> к шансу оффера за следующие 30 дней.
                </div>
              </div>
            </div>
          </CardP>

          <CardP padding={20}>
            <SectionLabelP>Рекомендаций</SectionLabelP>
            <div style={{fontSize:30, fontWeight:600, letterSpacing:"-0.025em", marginTop:8, fontVariantNumeric:"tabular-nums"}}>{OPT_INSIGHTS.length}</div>
            <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:4}}>2 критичных · 2 высоких · 1 средний</div>
          </CardP>

          <CardP padding={20}>
            <SectionLabelP>Применено за неделю</SectionLabelP>
            <div style={{fontSize:30, fontWeight:600, letterSpacing:"-0.025em", marginTop:8, fontVariantNumeric:"tabular-nums"}}>4</div>
            <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:4}}>+9% к скору с прошлого понедельника</div>
          </CardP>
        </div>

        {/* Insights list */}
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          {OPT_INSIGHTS.map((ins,i)=>{
            const sev = SEV_TONE[ins.severity];
            return (
              <CardP key={i} padding={0} style={{overflow:"hidden"}}>
                <div style={{display:"grid", gridTemplateColumns:"6px 1fr"}}>
                  <div style={{background: sev.bg}}/>
                  <div style={{padding:"18px 22px"}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14, flexWrap:"wrap", marginBottom:8}}>
                      <div style={{minWidth:0, flex:1}}>
                        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap"}}>
                          <span style={{
                            fontSize:10.5, fontWeight:600, padding:"2px 7px", borderRadius:99,
                            background: sev.bgSoft, color: sev.bg,
                            letterSpacing:"0.04em", textTransform:"uppercase",
                          }}>{sev.l}</span>
                          <span style={{fontSize:11.5, color:"var(--fg-subtle)"}}>· {ins.area}</span>
                          <span style={{fontSize:11.5, color:"rgb(5,150,105)", fontWeight:500}}>· потенциал {ins.impact}</span>
                        </div>
                        <div style={{fontSize:15, fontWeight:600, letterSpacing:"-0.015em"}}>{ins.title}</div>
                      </div>
                    </div>
                    <div style={{fontSize:13, color:"var(--fg-muted)", lineHeight:1.6, marginBottom:14, maxWidth:760}}>{ins.body}</div>
                    <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                      {ins.actions.map((a,j)=>(
                        <BtnP key={j} variant={a.primary ? "primary" : "outline"} size="sm">{a.l}</BtnP>
                      ))}
                    </div>
                  </div>
                </div>
              </CardP>
            );
          })}
        </div>
      </>
    )
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ACTIVITY — chronological log of everything the user did
// ═════════════════════════════════════════════════════════════════════════════
const ACTIVITY = [
  { d:"Сегодня",  items:[
    { t:"14:30", who:"Ты",        action:"открыл",    target:"Notion · Senior Product Engineer", type:"view" },
    { t:"11:50", who:"Loopboard", action:"нашёл матч", target:"Vercel · DX Engineer (94%)",       type:"match" },
    { t:"10:12", who:"Ты",        action:"запустил цикл", target:"Frontend · EU",                  type:"loop" },
    { t:"09:30", who:"Loopboard", action:"уведомил",  target:"3 свежих ответа в Inbox",            type:"system" },
  ]},
  { d:"Вчера · 8 мая", items:[
    { t:"19:22", who:"Ты",        action:"добавил заметку к", target:"Stripe · Frontend Engineer", type:"note" },
    { t:"17:05", who:"Tom Becker",action:"написал в",         target:"Notion · Senior PE",          type:"message" },
    { t:"15:40", who:"Ты",        action:"обновил CV",        target:"maria-2026.pdf",              type:"file" },
    { t:"12:18", who:"Ты",        action:"отправил отклик в", target:"Linear · Senior Frontend",    type:"apply" },
  ]},
  { d:"7 мая", items:[
    { t:"22:01", who:"Ты",        action:"переместил",        target:"GitHub → «Финал»",            type:"move" },
    { t:"16:45", who:"Loopboard", action:"назначил интервью", target:"Vercel · 8 мая, 10:00",       type:"interview" },
    { t:"14:00", who:"Ты",        action:"добавил контакт",   target:"Lukas Müller · Vercel",       type:"contact" },
  ]},
  { d:"6 мая", items:[
    { t:"18:30", who:"Loopboard", action:"завершил цикл",     target:"Frontend EU · 12 матчей",     type:"loop" },
    { t:"11:00", who:"Ты",        action:"прошёл интервью",   target:"Stripe · технический раунд",  type:"interview" },
  ]},
];

const ACT_ICONS = {
  view:      { i:"👁", c:"var(--fg-subtle)" },
  match:     { i:"✦", c:"var(--accent)" },
  loop:      { i:"↻", c:"var(--accent-2)" },
  system:    { i:"●", c:"var(--fg-subtle)" },
  note:      { i:"✎", c:"var(--fg-muted)" },
  message:   { i:"✉", c:"var(--accent-2)" },
  file:      { i:"⎙", c:"var(--fg-muted)" },
  apply:     { i:"→", c:"rgb(5,150,105)" },
  move:      { i:"↗", c:"var(--accent)" },
  interview: { i:"◆", c:"var(--accent)" },
  contact:   { i:"+", c:"rgb(5,150,105)" },
};

function ActivityPage({ setPage }) {
  const [filter, setFilter] = React.useState("all");
  const filters = [
    { k:"all",       l:"Всё" },
    { k:"apply",     l:"Отклики" },
    { k:"interview", l:"Интервью" },
    { k:"match",     l:"Матчи" },
    { k:"loop",      l:"Циклы" },
    { k:"note",      l:"Заметки" },
  ];

  return pageWrapP(
    {
      crumb:["Loopboard","Воркспейс","Активность"],
      title:"Активность",
      subtitle:"Вся история действий по поиску — твоих и системных.",
      actions: (
        <>
          <BtnP variant="outline" size="sm" icon={IconP.filter}>Фильтры</BtnP>
          <BtnP variant="outline" size="sm" icon={IconP.arrowUR}>Экспорт лога</BtnP>
        </>
      ),
    },
    (
      <div style={{display:"flex", flexWrap:"wrap", gap:14, alignItems:"flex-start"}}>
        {/* Filters */}
        <CardP padding={10} style={{flex:"0 0 180px", minWidth:0}}>
          <SectionLabelP><div style={{padding:"4px 6px"}}>Тип события</div></SectionLabelP>
          <div style={{display:"flex", flexDirection:"column", gap:1, marginTop:4}}>
            {filters.map(f=>(
              <a key={f.k} onClick={()=>setFilter(f.k)} style={{
                padding:"6px 8px", borderRadius:6, fontSize:12.5,
                color: filter===f.k ? "var(--fg)" : "var(--fg-muted)",
                background: filter===f.k ? "var(--bg-subtle)" : "transparent",
                fontWeight: filter===f.k ? 500 : 400,
                cursor:"pointer",
              }}>{f.l}</a>
            ))}
          </div>
          <div style={{height:1, background:"var(--border)", margin:"10px 0"}}/>
          <div style={{padding:"4px 8px", fontSize:11, color:"var(--fg-subtle)", lineHeight:1.6}}>
            События за последние 7 дней. Старше — в архиве.
          </div>
        </CardP>

        {/* Feed */}
        <div style={{flex:"1 1 360px", minWidth:0}}>
          {ACTIVITY.map((day,di)=>{
            const visible = filter==="all" ? day.items : day.items.filter(it=>it.type===filter);
            if (!visible.length) return null;
            return (
              <div key={di} style={{marginBottom:18}}>
                <div style={{
                  display:"flex", alignItems:"center", gap:10, marginBottom:8,
                  fontSize:11, fontWeight:500, color:"var(--fg-subtle)",
                  letterSpacing:"0.06em", textTransform:"uppercase",
                }}>
                  <span>{day.d}</span>
                  <span style={{flex:1, height:1, background:"var(--border)"}}/>
                  <span style={{textTransform:"none", letterSpacing:0, fontWeight:400}}>{visible.length} {visible.length===1?"событие":"событий"}</span>
                </div>
                <CardP padding={0}>
                  {visible.map((it,i)=>{
                    const icon = ACT_ICONS[it.type];
                    return (
                      <div key={i} style={{
                        display:"grid", gridTemplateColumns:"56px 32px 1fr",
                        gap:14, padding:"12px 16px", alignItems:"flex-start",
                        borderBottom: i<visible.length-1 ? "1px solid var(--border)" : "none",
                      }}>
                        <div style={{fontSize:11.5, color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums", paddingTop:5}}>{it.t}</div>
                        <div style={{
                          width:28, height:28, borderRadius:99,
                          background:"var(--bg-subtle)", border:"1px solid var(--border)",
                          color: icon.c, display:"grid", placeItems:"center",
                          fontSize:13, fontWeight:600,
                        }}>{icon.i}</div>
                        <div style={{minWidth:0, paddingTop:2}}>
                          <div style={{fontSize:13, lineHeight:1.5}}>
                            <strong style={{color:"var(--fg)", fontWeight:500}}>{it.who}</strong>
                            <span style={{color:"var(--fg-muted)"}}> {it.action} </span>
                            <a onClick={()=>setPage && setPage("details")} style={{color:"var(--fg)", fontWeight:500, cursor:"pointer", borderBottom:"1px dashed var(--border-strong)"}}>{it.target}</a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardP>
              </div>
            );
          })}
        </div>

        {/* Stats sidebar */}
        <div style={{display:"flex", flexDirection:"column", gap:14, flex:"1 1 260px", minWidth:0, maxWidth:340}}>
          <CardP padding={18}>
            <SectionLabelP>За 7 дней</SectionLabelP>
            <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:14}}>
              {[
                { l:"Всего событий", v:13, p:100 },
                { l:"Откликов",      v:1,  p:8 },
                { l:"Интервью",      v:2,  p:15 },
                { l:"Заметок",       v:1,  p:8 },
                { l:"Циклов",        v:2,  p:15 },
              ].map(s=>(
                <div key={s.l}>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4}}>
                    <span>{s.l}</span>
                    <span style={{color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>{s.v}</span>
                  </div>
                  <div style={{height:3, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                    <div style={{height:"100%", width:`${s.p}%`, background:"var(--accent)", borderRadius:99}}/>
                  </div>
                </div>
              ))}
            </div>
          </CardP>

          <CardP padding={18}>
            <SectionLabelP>Серия</SectionLabelP>
            <div style={{fontSize:30, fontWeight:600, letterSpacing:"-0.025em", marginTop:8, fontVariantNumeric:"tabular-nums"}}>12 <span style={{fontSize:14, color:"var(--fg-subtle)", fontWeight:400}}>дней</span></div>
            <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:6, lineHeight:1.55}}>
              Подряд совершаешь хотя бы 1 действие в день. Личный рекорд — 21 день.
            </div>
            <div style={{display:"flex", gap:3, marginTop:14}}>
              {Array.from({length:21}, (_,i)=>(
                <div key={i} style={{
                  flex:1, height:18, borderRadius:2,
                  background: i<12 ? "var(--accent)" : "var(--bg-subtle)",
                  opacity: i<12 ? (0.4 + (i/12)*0.6) : 1,
                }}/>
              ))}
            </div>
          </CardP>
        </div>
      </div>
    )
  );
}

window.PriorityPages = {
  DetailsPageV2, AnalyticsPage, CalendarPage, OptimizationPage, ActivityPage,
};
