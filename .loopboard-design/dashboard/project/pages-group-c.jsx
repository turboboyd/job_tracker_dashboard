/* Group C — secondary pages */
const { Card: CardC, Pill: PillC, Btn: BtnC, SectionLabel: SectionLabelC, Icon: IconC } = window.UI;

function PageHeaderC({ crumb, title, subtitle, actions }) {
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

function pageWrap(headerProps, body) {
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <PageHeaderC {...headerProps} />
      <div style={{flex:1, overflowY:"auto", padding:"24px 28px 48px", background:"var(--bg)"}}>
        {body}
      </div>
    </div>
  );
}

// ─── CONTACTS ────────────────────────────────────────────────────────────────
const CONTACTS = [
  { fn:"Анна",    ln:"Петрова",    role:"HR",            company:"Notion",   email:"anna@notion.so",     phone:"+49 89 123 45 67", apps:3, last:"вчера",  fav:true,  channel:"linkedin" },
  { fn:"Maria",   ln:"Schäfer",    role:"Recruiter",     company:"Stripe",   email:"m.schafer@stripe.com",phone:"+44 20 7946 0123", apps:2, last:"3д",     fav:false, channel:"email" },
  { fn:"Tom",     ln:"Becker",     role:"Tech Lead",     company:"GitHub",   email:"tom.b@github.com",    phone:"+49 30 1234 5678", apps:1, last:"5д",     fav:true,  channel:"linkedin" },
  { fn:"Lukas",   ln:"Müller",     role:"Hiring Manager",company:"Vercel",   email:"lukas@vercel.com",    phone:"—",                apps:2, last:"7д",     fav:false, channel:"email" },
  { fn:"Sofia",   ln:"Rossi",      role:"Referral",      company:"Figma",    email:"sofia.rossi@gmail.com",phone:"+39 02 1234 5678",apps:1, last:"12д",    fav:true,  channel:"telegram" },
  { fn:"Daniel",  ln:"Weber",      role:"Interviewer",   company:"Linear",   email:"daniel@linear.app",   phone:"—",                apps:1, last:"14д",    fav:false, channel:"email" },
  { fn:"Eva",     ln:"Klein",      role:"HR",            company:"Klarna",   email:"e.klein@klarna.com",  phone:"+46 8 1234 5678",  apps:1, last:"21д",    fav:false, channel:"linkedin" },
];

function ContactsPage({ setPage }) {
  const [q, setQ] = React.useState("");
  const filtered = CONTACTS.filter(c =>
    !q || `${c.fn} ${c.ln} ${c.company} ${c.role}`.toLowerCase().includes(q.toLowerCase())
  );

  return pageWrap(
    {
      crumb:["Loopboard","Воркспейс","Контакты"],
      title:"Контакты",
      subtitle:"Все люди, с которыми ты общался по вакансиям.",
      actions: (
        <>
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"6px 10px", borderRadius:8, height:32,
            border:"1px solid var(--border)", background:"var(--bg-subtle)",
            fontSize:12.5, color:"var(--fg-subtle)", width:220,
          }}>
            <span style={{display:"inline-flex"}}>{IconC.search}</span>
            <input
              value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Поиск контактов"
              style={{
                background:"transparent", border:"none", outline:"none",
                color:"var(--fg)", fontSize:12.5, flex:1, fontFamily:"inherit", minWidth:0,
              }}
            />
          </div>
          <BtnC variant="outline" size="sm" icon={IconC.filter}>Фильтры</BtnC>
          <BtnC variant="primary" size="sm" icon={IconC.plus}>Новый контакт</BtnC>
        </>
      ),
    },
    (
      <>
        {/* Stats */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14, marginBottom:18}}>
          {[
            {l:"Всего контактов", v:CONTACTS.length, sub:"в адресной книге"},
            {l:"Избранные", v:CONTACTS.filter(c=>c.fav).length, sub:"со звёздочкой"},
            {l:"HR / Рекрутеры", v:CONTACTS.filter(c=>/HR|Recruit/i.test(c.role)).length, sub:"первая линия"},
            {l:"Связано с заявками", v:CONTACTS.reduce((a,c)=>a+c.apps,0), sub:"всего связей"},
          ].map(s=>(
            <CardC key={s.l} padding={18}>
              <SectionLabelC>{s.l}</SectionLabelC>
              <div style={{fontSize:28, fontWeight:600, letterSpacing:"-0.025em", marginTop:8, fontVariantNumeric:"tabular-nums"}}>{s.v}</div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:4}}>{s.sub}</div>
            </CardC>
          ))}
        </div>

        {/* List */}
        <CardC padding={0}>
          <div style={{
            display:"grid", gridTemplateColumns:"36px minmax(0,1.6fr) minmax(0,1.4fr) minmax(0,1.4fr) 70px 90px 30px",
            padding:"10px 16px", gap:14,
            fontSize:11, fontWeight:500, color:"var(--fg-subtle)",
            letterSpacing:"0.06em", textTransform:"uppercase",
            borderBottom:"1px solid var(--border)", background:"var(--bg-subtle)",
          }}>
            <div></div>
            <div>Имя · Роль</div>
            <div>Компания</div>
            <div>Email</div>
            <div style={{textAlign:"right"}}>Заявок</div>
            <div style={{textAlign:"right"}}>Контакт</div>
            <div></div>
          </div>
          {filtered.map((c,i)=>(
            <div key={i} onClick={()=>setPage && setPage("details")} style={{
              display:"grid", gridTemplateColumns:"36px minmax(0,1.6fr) minmax(0,1.4fr) minmax(0,1.4fr) 70px 90px 30px",
              padding:"12px 16px", gap:14, alignItems:"center",
              borderBottom: i<filtered.length-1 ? "1px solid var(--border)" : "none",
              cursor:"pointer", transition:"background 120ms",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--bg-subtle)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <div style={{
                width:30, height:30, borderRadius:99,
                background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
                color:"#fff", display:"grid", placeItems:"center",
                fontSize:11, fontWeight:600,
              }}>{c.fn[0]}{c.ln[0]}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                  {c.fav && <span style={{color:"var(--accent)", marginRight:6}}>★</span>}
                  {c.fn} {c.ln}
                </div>
                <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:1}}>{c.role}</div>
              </div>
              <div style={{fontSize:12.5, color:"var(--fg-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.company}</div>
              <div style={{fontSize:12, color:"var(--fg-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.email}</div>
              <div style={{fontSize:13, fontVariantNumeric:"tabular-nums", textAlign:"right", fontWeight:500}}>{c.apps}</div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", textAlign:"right"}}>{c.last}</div>
              <div style={{color:"var(--fg-subtle)", display:"flex", justifyContent:"flex-end"}}>{IconC.arrow}</div>
            </div>
          ))}
        </CardC>
      </>
    )
  );
}

// ─── INBOX ───────────────────────────────────────────────────────────────────
const INBOX = [
  { from:"Notion",   subj:"Приглашение на технический скрин", preview:"Здравствуйте! Спасибо за интерес к позиции Product Engineer. Хотим пригласить вас на технический скрин в среду…", time:"14:30", unread:true,  type:"interview", related:"Product Engineer" },
  { from:"Stripe",   subj:"Финальный раунд интервью",          preview:"Команда впечатлена твоим выступлением на технике. Финальный раунд — встреча с CTO и продакт-лидом…",      time:"11:05", unread:true,  type:"interview", related:"Frontend Engineer" },
  { from:"Vercel",   subj:"Оффер · DX Engineer",                preview:"Рады предложить тебе позицию. Ниже основные детали — зарплата, стек, льготы и стартовая дата…",            time:"вчера", unread:true,  type:"offer",     related:"DX Engineer" },
  { from:"Datadog",  subj:"Спасибо за заявку",                  preview:"Мы получили твою заявку и внимательно изучаем профиль. Свяжемся в течение 5 рабочих дней…",                time:"3д",    unread:false, type:"system",    related:"Software Engineer" },
  { from:"Sentry",   subj:"К сожалению, в этот раз — нет",     preview:"После рассмотрения мы решили двигаться дальше с другими кандидатами. Желаем удачи в поиске…",              time:"4д",    unread:false, type:"reject",    related:"Full-stack Engineer" },
  { from:"Loopboard",subj:"Дайджест: 7 свежих матчей",         preview:"За последнюю неделю мы нашли 7 новых вакансий по твоим поисковым циклам. Самые релевантные…",                time:"5д",    unread:false, type:"system",    related:"Frontend EU" },
  { from:"GitHub",   subj:"Подтверди интерес к роли",          preview:"Привет! Видели твой отклик на Senior Frontend Engineer. Подтверди, что всё ещё ищешь — и мы запустим процесс…", time:"6д", unread:false, type:"hr",        related:"Senior Frontend Engineer" },
];

const INBOX_FOLDERS = [
  { k:"all",        l:"Все",         c: INBOX.length },
  { k:"unread",     l:"Непрочитанные", c: INBOX.filter(m=>m.unread).length },
  { k:"interview",  l:"Интервью",    c: INBOX.filter(m=>m.type==="interview").length },
  { k:"offer",      l:"Офферы",      c: INBOX.filter(m=>m.type==="offer").length },
  { k:"system",     l:"Системные",   c: INBOX.filter(m=>m.type==="system").length },
];

function InboxPage({ setPage }) {
  const [folder, setFolder] = React.useState("all");
  const [active, setActive] = React.useState(0);
  const list = INBOX.filter(m => folder==="all" ? true : folder==="unread" ? m.unread : m.type===folder);
  const item = list[active] || list[0];

  const toneFor = t => t==="offer" ? "success" : t==="interview" ? "accent" : t==="reject" ? "danger" : "neutral";
  const labelFor = t => ({offer:"Оффер", interview:"Интервью", reject:"Отказ", system:"Система", hr:"HR"})[t] || "Другое";

  return pageWrap(
    {
      crumb:["Loopboard","Воркспейс","Входящие"],
      title:"Входящие",
      subtitle:"Все письма и системные уведомления по заявкам в одном месте.",
      actions: (
        <>
          <BtnC variant="outline" size="sm" icon={IconC.filter}>Фильтры</BtnC>
          <BtnC variant="outline" size="sm" icon={IconC.loop}>Обновить</BtnC>
        </>
      ),
    },
    (
      <div style={{display:"grid", gridTemplateColumns:"180px minmax(280px, 360px) 1fr", gap:14, height:"calc(100vh - 250px)", minHeight:480}}>
        {/* Folders */}
        <CardC padding={10}>
          <SectionLabelC><div style={{padding:"4px 6px"}}>Папки</div></SectionLabelC>
          <div style={{display:"flex", flexDirection:"column", gap:1, marginTop:4}}>
            {INBOX_FOLDERS.map(f => (
              <a key={f.k} onClick={()=>{setFolder(f.k); setActive(0);}} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"6px 8px", borderRadius:6, fontSize:12.5,
                color: folder===f.k ? "var(--fg)" : "var(--fg-muted)",
                background: folder===f.k ? "var(--bg-subtle)" : "transparent",
                fontWeight: folder===f.k ? 500 : 400,
                cursor:"pointer",
              }}>
                <span>{f.l}</span>
                <span style={{
                  fontSize:10.5, padding:"1px 6px", borderRadius:99,
                  background:"var(--bg-elev)", border:"1px solid var(--border)",
                  color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums",
                }}>{f.c}</span>
              </a>
            ))}
          </div>
        </CardC>

        {/* List */}
        <CardC padding={0}>
          <div style={{maxHeight:"100%", overflowY:"auto"}}>
            {list.map((m,i)=>(
              <div key={i} onClick={()=>setActive(i)} style={{
                padding:"12px 14px",
                borderBottom: i<list.length-1 ? "1px solid var(--border)" : "none",
                borderLeft: active===i ? "2px solid var(--accent)" : "2px solid transparent",
                background: active===i ? "var(--bg-subtle)" : "transparent",
                cursor:"pointer",
              }}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3}}>
                  <span style={{fontSize:12.5, fontWeight: m.unread ? 600 : 500, letterSpacing:"-0.005em"}}>
                    {m.unread && <span style={{display:"inline-block", width:6, height:6, borderRadius:99, background:"var(--accent)", marginRight:6, verticalAlign:"middle"}}/>}
                    {m.from}
                  </span>
                  <span style={{fontSize:10.5, color:"var(--fg-subtle)"}}>{m.time}</span>
                </div>
                <div style={{fontSize:12, fontWeight: m.unread ? 500 : 400, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{m.subj}</div>
                <div style={{fontSize:11.5, color:"var(--fg-subtle)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{m.preview}</div>
              </div>
            ))}
          </div>
        </CardC>

        {/* Reading pane */}
        <CardC padding={0}>
          {item && (
            <div style={{display:"flex", flexDirection:"column", height:"100%"}}>
              <div style={{padding:"18px 22px", borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:10}}>
                  <div style={{minWidth:0, flex:1}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap"}}>
                      <PillC tone={toneFor(item.type)}>{labelFor(item.type)}</PillC>
                      <span onClick={()=>setPage && setPage("details")} style={{fontSize:11.5, color:"var(--fg-subtle)", cursor:"pointer", textDecoration:"underline", textDecorationColor:"var(--border-strong)", textUnderlineOffset:3}}>· {item.related}</span>
                    </div>
                    <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.02em"}}>{item.subj}</div>
                  </div>
                  <span style={{fontSize:11.5, color:"var(--fg-subtle)", flexShrink:0}}>{item.time}</span>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <div style={{
                    width:30, height:30, borderRadius:6,
                    background:"var(--bg-subtle)", border:"1px solid var(--border)",
                    display:"grid", placeItems:"center",
                    fontSize:12, fontWeight:600, color:"var(--fg-muted)",
                  }}>{item.from[0]}</div>
                  <div>
                    <div style={{fontSize:13, fontWeight:500}}>{item.from}</div>
                    <div style={{fontSize:11, color:"var(--fg-subtle)"}}>noreply@{item.from.toLowerCase()}.com → ты</div>
                  </div>
                </div>
              </div>
              <div style={{padding:"22px", flex:1, fontSize:13.5, lineHeight:1.65, color:"var(--fg-muted)", overflowY:"auto"}}>
                <p style={{margin:"0 0 12px"}}>{item.preview}</p>
                <p style={{margin:"0 0 12px"}}>Если у тебя есть вопросы — отвечай на это письмо или напиши напрямую рекрутеру. Мы рады уточнить детали и подобрать удобное время.</p>
                <p style={{margin:"0 0 12px"}}>С уважением,<br/>Команда {item.from}</p>
              </div>
              <div style={{padding:"14px 22px", borderTop:"1px solid var(--border)", display:"flex", gap:8, flexWrap:"wrap"}}>
                <BtnC variant="primary" size="sm">Ответить</BtnC>
                <BtnC variant="outline" size="sm">Перенаправить</BtnC>
                <BtnC variant="ghost" size="sm">Отметить как прочитанное</BtnC>
                <BtnC variant="ghost" size="sm" onClick={()=>setPage && setPage("details")}>Открыть заявку</BtnC>
              </div>
            </div>
          )}
        </CardC>
      </div>
    )
  );
}

// ─── CV BUILDER ──────────────────────────────────────────────────────────────
const CV_SECTIONS = [
  { k:"basics",   l:"Личные данные",   done:true },
  { k:"summary",  l:"О себе",          done:true },
  { k:"exp",      l:"Опыт работы",     done:true },
  { k:"edu",      l:"Образование",     done:true },
  { k:"skills",   l:"Навыки",          done:false },
  { k:"projects", l:"Проекты",         done:false },
  { k:"langs",    l:"Языки",           done:true },
  { k:"links",    l:"Ссылки",          done:false },
];

function CvBuilderPage({ setPage }) {
  const [sec, setSec] = React.useState("exp");
  const completion = Math.round(CV_SECTIONS.filter(s=>s.done).length / CV_SECTIONS.length * 100);

  return pageWrap(
    {
      crumb:["Loopboard","CV","Конструктор"],
      title:"Конструктор резюме",
      subtitle:"Собери одно адаптивное резюме — оптимизируй его под каждую вакансию.",
      actions: (
        <>
          <BtnC variant="outline" size="sm" icon={IconC.search}>Превью</BtnC>
          <BtnC variant="outline" size="sm" icon={IconC.arrowUR}>Экспорт PDF</BtnC>
          <BtnC variant="primary" size="sm" icon={IconC.check}>Сохранить</BtnC>
        </>
      ),
    },
    (
      <div style={{display:"grid", gridTemplateColumns:"260px 1fr 320px", gap:14}}>
        {/* Sections nav */}
        <CardC padding={14}>
          <SectionLabelC>Разделы</SectionLabelC>
          <div style={{marginTop:12, marginBottom:14}}>
            <div style={{display:"flex", justifyContent:"space-between", fontSize:11.5, color:"var(--fg-subtle)", marginBottom:6}}>
              <span>Заполнено</span>
              <span style={{fontVariantNumeric:"tabular-nums", color:"var(--fg)", fontWeight:600}}>{completion}%</span>
            </div>
            <div style={{height:4, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
              <div style={{height:"100%", width:`${completion}%`, background:"var(--accent)", borderRadius:99}}/>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:1}}>
            {CV_SECTIONS.map(s=>(
              <a key={s.k} onClick={()=>setSec(s.k)} style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"7px 8px", borderRadius:6, fontSize:12.5,
                color: sec===s.k ? "var(--fg)" : "var(--fg-muted)",
                background: sec===s.k ? "var(--bg-subtle)" : "transparent",
                fontWeight: sec===s.k ? 500 : 400, cursor:"pointer",
              }}>
                <span style={{
                  width:14, height:14, borderRadius:99, flexShrink:0,
                  display:"grid", placeItems:"center",
                  background: s.done ? "rgb(5,150,105)" : "var(--bg-subtle)",
                  border: s.done ? "none" : "1px solid var(--border)",
                  color:"#fff", fontSize:9,
                }}>{s.done ? "✓" : ""}</span>
                <span style={{flex:1}}>{s.l}</span>
              </a>
            ))}
          </div>
        </CardC>

        {/* Editor */}
        <CardC padding={22}>
          <SectionLabelC>Опыт работы</SectionLabelC>
          <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.02em", marginTop:8, marginBottom:18}}>
            3 позиции
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            {[
              { co:"Notion", role:"Senior Frontend Engineer", date:"2023 — настоящее", loc:"Munich · Hybrid" },
              { co:"GitHub", role:"Frontend Engineer",         date:"2020 — 2023",       loc:"Berlin · Remote" },
              { co:"Stripe", role:"Software Engineer",         date:"2018 — 2020",       loc:"Dublin"          },
            ].map((e,i)=>(
              <div key={i} style={{
                padding:16, borderRadius:8,
                border:"1px solid var(--border)", background:"var(--bg-subtle)",
              }}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:6}}>
                  <div>
                    <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>{e.role}</div>
                    <div style={{fontSize:12.5, color:"var(--fg-muted)", marginTop:2}}>{e.co} · {e.loc}</div>
                  </div>
                  <span style={{fontSize:11.5, color:"var(--fg-subtle)", whiteSpace:"nowrap"}}>{e.date}</span>
                </div>
                <div style={{fontSize:12.5, color:"var(--fg-muted)", lineHeight:1.55, marginTop:10}}>
                  Lead frontend initiatives across the editor team — collab editing, performance, design system. Mentored 3 engineers, shipped real-time collaboration to 4M users.
                </div>
                <div style={{display:"flex", gap:6, marginTop:12, flexWrap:"wrap"}}>
                  {["React","TypeScript","WebSockets","ProseMirror"].map(t=>(
                    <PillC key={t} tone="neutral">{t}</PillC>
                  ))}
                </div>
              </div>
            ))}
            <BtnC variant="outline" size="sm" icon={IconC.plus} full>Добавить позицию</BtnC>
          </div>
        </CardC>

        {/* Live preview */}
        <CardC padding={0}>
          <div style={{padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{fontSize:12.5, fontWeight:600}}>Превью</div>
            <span style={{fontSize:10.5, color:"var(--fg-subtle)"}}>A4 · 1 страница</span>
          </div>
          <div style={{padding:18, fontFamily:"var(--font-sans)"}}>
            <div style={{
              padding:18, borderRadius:6,
              background:"#fff", color:"#0a0a0a",
              border:"1px solid var(--border-strong)",
              fontSize:9, lineHeight:1.45,
              boxShadow:"var(--shadow)",
            }}>
              <div style={{fontSize:14, fontWeight:700, letterSpacing:"-0.02em"}}>Мария Климова</div>
              <div style={{fontSize:9, color:"#666", marginTop:2}}>Senior Frontend Engineer · Berlin</div>
              <div style={{fontSize:8, color:"#888", marginTop:4}}>maria@email.com · linkedin.com/in/mklimova · github.com/mk</div>
              <div style={{height:1, background:"#e5e5e5", margin:"10px 0"}}/>
              <div style={{fontSize:8, color:"#888", letterSpacing:"0.05em", textTransform:"uppercase"}}>О себе</div>
              <div style={{marginTop:4, color:"#333"}}>Senior frontend engineer with 7+ years building product-grade interfaces…</div>
              <div style={{height:1, background:"#e5e5e5", margin:"10px 0"}}/>
              <div style={{fontSize:8, color:"#888", letterSpacing:"0.05em", textTransform:"uppercase"}}>Опыт</div>
              <div style={{marginTop:4}}>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <span style={{fontWeight:600}}>Notion · Senior FE</span>
                  <span style={{color:"#888"}}>2023 — 2026</span>
                </div>
                <div style={{color:"#666", marginTop:2}}>Editor team · React, TypeScript, real-time</div>
              </div>
              <div style={{marginTop:8}}>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <span style={{fontWeight:600}}>GitHub · FE Engineer</span>
                  <span style={{color:"#888"}}>2020 — 2023</span>
                </div>
                <div style={{color:"#666", marginTop:2}}>Pull requests UI, accessibility, perf</div>
              </div>
              <div style={{marginTop:8}}>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <span style={{fontWeight:600}}>Stripe · SWE</span>
                  <span style={{color:"#888"}}>2018 — 2020</span>
                </div>
                <div style={{color:"#666", marginTop:2}}>Dashboard, billing flows</div>
              </div>
              <div style={{height:1, background:"#e5e5e5", margin:"10px 0"}}/>
              <div style={{fontSize:8, color:"#888", letterSpacing:"0.05em", textTransform:"uppercase"}}>Навыки</div>
              <div style={{marginTop:4, color:"#333"}}>React · TypeScript · Node · GraphQL · Design Systems</div>
            </div>
          </div>
        </CardC>
      </div>
    )
  );
}

// ─── CV CHECKER ──────────────────────────────────────────────────────────────
function CvCheckerPage({ setPage }) {
  const score = 88;
  const breakdown = [
    { l:"Соответствие ключевым словам", v:92, sub:"React, TypeScript, Node, REST" },
    { l:"Релевантный опыт",              v:85, sub:"7+ лет на нужном стеке"        },
    { l:"Образование и сертификаты",     v:78, sub:"высшее IT, 2 сертификата"      },
    { l:"Soft skills",                   v:70, sub:"лидерство, коммуникация"        },
    { l:"Структура и форматирование",    v:95, sub:"чистая структура, 1 страница"   },
  ];
  const missing = ["ProseMirror", "WebRTC", "Y.js", "Real-time collab"];
  const strong  = ["React", "TypeScript", "Node", "GraphQL", "Design Systems"];

  return pageWrap(
    {
      crumb:["Loopboard","CV","Чекер"],
      title:"Проверка соответствия CV",
      subtitle:"Загрузи резюме и описание вакансии — получи матч-скор и точечные правки.",
      actions: (
        <>
          <BtnC variant="outline" size="sm">Сменить вакансию</BtnC>
          <BtnC variant="primary" size="sm" icon={IconC.spark}>Перепроверить</BtnC>
        </>
      ),
    },
    (
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(360px, 1fr))", gap:14}}>
        {/* Score card */}
        <CardC padding={24} style={{gridColumn:"span 1", minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:24}}>
            <div style={{position:"relative", width:140, height:140, flexShrink:0}}>
              <svg viewBox="0 0 100 100" style={{width:"100%", height:"100%", transform:"rotate(-90deg)"}}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-subtle)" strokeWidth="10"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="10"
                  strokeDasharray={`${(score/100)*264} 264`} strokeLinecap="round"/>
              </svg>
              <div style={{
                position:"absolute", inset:0, display:"grid", placeItems:"center",
              }}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:36, fontWeight:600, letterSpacing:"-0.04em", lineHeight:1}}>{score}</div>
                  <div style={{fontSize:10.5, color:"var(--fg-subtle)", marginTop:2}}>/ 100</div>
                </div>
              </div>
            </div>
            <div style={{minWidth:0}}>
              <SectionLabelC>Общий матч</SectionLabelC>
              <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.02em", marginTop:6}}>Хорошее совпадение</div>
              <div style={{fontSize:12.5, color:"var(--fg-muted)", marginTop:4, lineHeight:1.5}}>
                Кандидат подходит. Есть точечные пробелы — добавь их в CV для +5–8 пунктов.
              </div>
              <div style={{display:"flex", gap:14, marginTop:14, flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:11, color:"var(--fg-subtle)"}}>Заявка</div>
                  <div style={{fontSize:13, fontWeight:500, marginTop:2}}>Notion · Product Engineer</div>
                </div>
                <div>
                  <div style={{fontSize:11, color:"var(--fg-subtle)"}}>CV</div>
                  <div style={{fontSize:13, fontWeight:500, marginTop:2}}>maria-2026.pdf</div>
                </div>
              </div>
            </div>
          </div>
        </CardC>

        {/* Breakdown */}
        <CardC padding={22} style={{gridColumn:"span 1", minWidth:0}}>
          <SectionLabelC>Разбор по категориям</SectionLabelC>
          <div style={{display:"flex", flexDirection:"column", gap:12, marginTop:14}}>
            {breakdown.map(b=>(
              <div key={b.l}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4}}>
                  <span style={{fontSize:12.5, color:"var(--fg)"}}>{b.l}</span>
                  <span style={{fontSize:13, fontWeight:600, fontVariantNumeric:"tabular-nums"}}>{b.v}</span>
                </div>
                <div style={{height:4, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                  <div style={{height:"100%", width:`${b.v}%`, background: b.v>=85 ? "rgb(5,150,105)" : b.v>=70 ? "var(--accent)" : "var(--accent-2)", borderRadius:99}}/>
                </div>
                <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:4}}>{b.sub}</div>
              </div>
            ))}
          </div>
        </CardC>

        {/* Strong points */}
        <CardC padding={22} style={{minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:14}}>
            <span style={{
              width:24, height:24, borderRadius:6,
              background:"color-mix(in oklab, rgb(5,150,105) 14%, transparent)",
              color:"rgb(5,150,105)", display:"grid", placeItems:"center",
            }}>{IconC.check}</span>
            <SectionLabelC>Сильные стороны</SectionLabelC>
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
            {strong.map(t=>(
              <PillC key={t} tone="success">✓ {t}</PillC>
            ))}
          </div>
          <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:14, lineHeight:1.5}}>
            Эти ключевые слова и навыки полностью совпадают с описанием. Они автоматически выделены в CV.
          </div>
        </CardC>

        {/* Missing / suggestions */}
        <CardC padding={22} style={{minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:14}}>
            <span style={{
              width:24, height:24, borderRadius:6,
              background:"color-mix(in oklab, var(--accent) 14%, transparent)",
              color:"var(--accent)", display:"grid", placeItems:"center",
            }}>{IconC.spark}</span>
            <SectionLabelC>Что добавить</SectionLabelC>
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:14}}>
            {missing.map(t=>(
              <PillC key={t} tone="warning">+ {t}</PillC>
            ))}
          </div>
          <div style={{padding:12, borderRadius:8, background:"var(--bg-subtle)", border:"1px solid var(--border)", fontSize:12, lineHeight:1.55, color:"var(--fg-muted)"}}>
            <strong style={{color:"var(--fg)"}}>Совет:</strong> упомяни ProseMirror и Y.js в опыте Notion — это базовый стек для редактора, и описание вакансии его явно требует.
          </div>
          <BtnC variant="outline" size="sm" full style={{marginTop:12}} icon={IconC.spark}>Сгенерировать правки</BtnC>
        </CardC>
      </div>
    )
  );
}

// ─── RESOURCES ───────────────────────────────────────────────────────────────
const RES_CATEGORIES = ["Все", "Интервью", "CV и резюме", "Переезд", "Юр. оформление", "Офферы и зарплата"];
const RESOURCES = [
  { cat:"Интервью",     title:"Как готовиться к техническому интервью",   read:"12 мин", new:true,  src:"Гайд" },
  { cat:"CV и резюме",  title:"5 ошибок в CV, из-за которых не зовут",     read:"6 мин",  new:false, src:"Чек-лист" },
  { cat:"Переезд",      title:"Blue Card EU: что нужно знать в 2026",      read:"15 мин", new:true,  src:"Гайд" },
  { cat:"Офферы и зарплата", title:"Как обсуждать оффер: скрипты и тактики", read:"10 мин", new:false, src:"Шаблоны" },
  { cat:"Интервью",     title:"Behavioral-вопросы: ответы по STAR",        read:"8 мин",  new:false, src:"Шаблоны" },
  { cat:"Юр. оформление", title:"Как читать трудовой договор в Германии",   read:"20 мин", new:false, src:"Гайд" },
  { cat:"CV и резюме",  title:"Шаблоны CV для DACH-региона",                read:"4 мин",  new:false, src:"Шаблоны" },
  { cat:"Переезд",      title:"Anmeldung за один визит: чек-лист",          read:"5 мин",  new:true,  src:"Чек-лист" },
];

function ResourcesPage({ setPage }) {
  const [cat, setCat] = React.useState("Все");
  const list = cat==="Все" ? RESOURCES : RESOURCES.filter(r=>r.cat===cat);

  return pageWrap(
    {
      crumb:["Loopboard","Помощь","Ресурсы"],
      title:"Ресурсы",
      subtitle:"Гайды, шаблоны и чек-листы по поиску работы — собраны в одном месте.",
      actions: (
        <>
          <BtnC variant="outline" size="sm" icon={IconC.search}>Поиск</BtnC>
          <BtnC variant="outline" size="sm">Предложить ресурс</BtnC>
        </>
      ),
    },
    (
      <>
        <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:18}}>
          {RES_CATEGORIES.map(c=>(
            <a key={c} onClick={()=>setCat(c)} style={{
              padding:"6px 12px", fontSize:12.5, borderRadius:99,
              border:"1px solid " + (cat===c ? "var(--fg)" : "var(--border)"),
              background: cat===c ? "var(--fg)" : "var(--bg-elev)",
              color: cat===c ? "var(--bg)" : "var(--fg-muted)",
              cursor:"pointer", transition:"all 120ms",
            }}>{c}</a>
          ))}
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:14}}>
          {list.map((r,i)=>(
            <CardC key={i} padding={18} style={{cursor:"pointer", transition:"all 120ms"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14}}>
                <PillC tone="neutral">{r.src}</PillC>
                {r.new && <PillC tone="success">Новое</PillC>}
              </div>
              <div style={{
                aspectRatio:"16/9", marginBottom:14,
                borderRadius:8, background:"var(--bg-subtle)",
                border:"1px solid var(--border)",
                display:"grid", placeItems:"center",
                fontSize:34, fontWeight:600, letterSpacing:"-0.04em",
                color:"var(--fg-subtle)",
                position:"relative", overflow:"hidden",
              }}>
                <div style={{
                  position:"absolute", inset:0,
                  background:`linear-gradient(135deg, color-mix(in oklab, var(--accent) ${10+i*3}%, transparent), transparent 60%)`,
                }}/>
                <span style={{position:"relative"}}>{r.cat[0]}</span>
              </div>
              <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em", lineHeight:1.4}}>{r.title}</div>
              <div style={{
                marginTop:14, paddingTop:12, borderTop:"1px solid var(--border)",
                display:"flex", justifyContent:"space-between", alignItems:"center",
                fontSize:11.5, color:"var(--fg-subtle)",
              }}>
                <span>{r.cat}</span>
                <span>{r.read}</span>
              </div>
            </CardC>
          ))}
        </div>
      </>
    )
  );
}

// ─── WHATS NEW ───────────────────────────────────────────────────────────────
const RELEASES = [
  { v:"2.4", date:"6 мая 2026", tag:"latest", title:"Поиск по контактам и расширенные фильтры в Inbox", items:[
    "Поиск по контактам с фильтрами по компании и роли.",
    "Inbox: новые папки «Интервью», «Офферы», «Системные».",
    "Тёмная тема — окончательная версия с пересмотренными контрастами.",
    "Производительность: список заявок открывается на 40% быстрее.",
  ]},
  { v:"2.3", date:"22 апреля 2026", tag:"feature", title:"AI-чекер CV: точечные подсказки", items:[
    "Точечные правки CV по описанию вакансии — генерируются за секунду.",
    "Графа «Сильные стороны» с подсветкой в превью CV.",
    "Поддержка PDF и DOCX импорта.",
  ]},
  { v:"2.2", date:"5 апреля 2026", tag:"feature", title:"Канбан-доска и drag-and-drop", items:[
    "Доска заявок с перетаскиванием между статусами.",
    "Кастомизируемые колонки и быстрая фильтрация по циклу.",
  ]},
  { v:"2.1", date:"18 марта 2026", tag:"fix", title:"Стабилизация и мелкие правки", items:[
    "Исправлен сброс фильтров при перелогине.",
    "Уведомления приходят в реальном времени без перезагрузки.",
  ]},
];

function WhatsNewPage({ setPage }) {
  return pageWrap(
    {
      crumb:["Loopboard","Помощь","Что нового"],
      title:"Что нового",
      subtitle:"Регулярные апдейты Loopboard. Самое свежее — сверху.",
      actions: (
        <>
          <BtnC variant="outline" size="sm">Подписаться на обновления</BtnC>
          <BtnC variant="ghost" size="sm">Архив</BtnC>
        </>
      ),
    },
    (
      <div style={{maxWidth:780, margin:"0 auto"}}>
        <div style={{position:"relative", paddingLeft:32}}>
          <span style={{position:"absolute", left:11, top:8, bottom:8, width:1, background:"var(--border)"}}/>
          {RELEASES.map((r,i)=>(
            <div key={r.v} style={{position:"relative", marginBottom:28}}>
              <span style={{
                position:"absolute", left:-32+5, top:8,
                width:13, height:13, borderRadius:99,
                background: i===0 ? "var(--accent)" : "var(--bg-elev)",
                border: i===0 ? "3px solid color-mix(in oklab, var(--accent) 20%, transparent)" : "1px solid var(--border-strong)",
              }}/>
              <CardC padding={22}>
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap"}}>
                  <span style={{
                    fontSize:11, fontWeight:600, letterSpacing:"0.04em",
                    fontFamily:"var(--font-mono)",
                    padding:"3px 8px", borderRadius:5,
                    background:"var(--fg)", color:"var(--bg)",
                  }}>v{r.v}</span>
                  {r.tag==="latest" && <PillC tone="accent">Свежее</PillC>}
                  {r.tag==="feature" && <PillC tone="info">Фича</PillC>}
                  {r.tag==="fix" && <PillC tone="neutral">Фиксы</PillC>}
                  <span style={{fontSize:11.5, color:"var(--fg-subtle)", marginLeft:"auto"}}>{r.date}</span>
                </div>
                <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.02em", marginBottom:10}}>{r.title}</div>
                <ul style={{margin:"0", paddingLeft:18, fontSize:13, lineHeight:1.65, color:"var(--fg-muted)"}}>
                  {r.items.map((it,j)=>(<li key={j} style={{marginBottom:4}}>{it}</li>))}
                </ul>
              </CardC>
            </div>
          ))}
        </div>
      </div>
    )
  );
}

// ─── ABOUT ───────────────────────────────────────────────────────────────────
function AboutPage({ setPage }) {
  return pageWrap(
    {
      crumb:["Loopboard","О проекте"],
      title:"О Loopboard",
      subtitle:"Личный воркспейс для поиска работы.",
    },
    (
      <div style={{maxWidth:780, margin:"0 auto"}}>
        <CardC padding={32} style={{marginBottom:14}}>
          <div style={{
            width:48, height:48, borderRadius:10,
            background:"var(--fg)", color:"var(--bg)",
            display:"grid", placeItems:"center",
            fontSize:22, fontWeight:700, letterSpacing:"-0.04em",
            marginBottom:18,
          }}>L</div>
          <div style={{fontSize:24, fontWeight:600, letterSpacing:"-0.025em", marginBottom:8}}>
            Loopboard — это циклы поиска, а не хаос вкладок.
          </div>
          <div style={{fontSize:14, lineHeight:1.7, color:"var(--fg-muted)", marginBottom:14}}>
            Мы делаем инструмент, который превращает поиск работы в управляемый процесс. Один воркспейс для откликов, доски, контактов, заметок и анализа CV — без 17 закладок и Excel-таблиц.
          </div>
          <div style={{fontSize:14, lineHeight:1.7, color:"var(--fg-muted)"}}>
            Loopboard построен вокруг идеи <em>цикла</em>: ты задаёшь параметры поиска, система собирает совпадения с разных платформ, ты быстро отрабатываешь их в воронке. Цикл повторяется — но осознанно.
          </div>
        </CardC>

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14, marginBottom:14}}>
          {[
            {l:"Активных пользователей", v:"12 400+"},
            {l:"Отслежено заявок",        v:"380K"},
            {l:"Найдено офферов",          v:"2 100+"},
          ].map(s=>(
            <CardC key={s.l} padding={20}>
              <div style={{fontSize:32, fontWeight:600, letterSpacing:"-0.025em", fontVariantNumeric:"tabular-nums"}}>{s.v}</div>
              <div style={{fontSize:12.5, color:"var(--fg-subtle)", marginTop:4}}>{s.l}</div>
            </CardC>
          ))}
        </div>

        <CardC padding={26}>
          <SectionLabelC>Принципы</SectionLabelC>
          <div style={{display:"grid", gap:14, marginTop:14}}>
            {[
              {n:"01", t:"Один воркспейс", d:"Не плагин и не генератор. Полноценный продукт, в котором поиск работы живёт от начала до оффера."},
              {n:"02", t:"Уважение к данным", d:"Ничего не продаём третьим сторонам. Любой пользователь может выгрузить и удалить всё в один клик."},
              {n:"03", t:"Короткая обратная связь", d:"Слышим пользователей и катим обновления каждые 2–3 недели."},
            ].map(p=>(
              <div key={p.n} style={{display:"grid", gridTemplateColumns:"60px 1fr", gap:14, paddingBottom:14, borderBottom:"1px solid var(--border)"}}>
                <div style={{
                  fontSize:11, fontFamily:"var(--font-mono)", color:"var(--fg-subtle)",
                  paddingTop:3,
                }}>{p.n}</div>
                <div>
                  <div style={{fontSize:14, fontWeight:600}}>{p.t}</div>
                  <div style={{fontSize:13, color:"var(--fg-muted)", lineHeight:1.6, marginTop:4}}>{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </CardC>
      </div>
    )
  );
}

// ─── NOT FOUND ───────────────────────────────────────────────────────────────
function NotFoundPage({ setPage }) {
  return (
    <div style={{
      flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      padding:"40px 28px", background:"var(--bg)", height:"100%",
    }}>
      <div style={{maxWidth:520, textAlign:"center"}}>
        <div style={{
          fontSize:120, fontWeight:700, letterSpacing:"-0.06em", lineHeight:1,
          fontFamily:"var(--font-mono)",
          background:"linear-gradient(180deg, var(--fg) 30%, var(--fg-subtle))",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          backgroundClip:"text", color:"transparent",
        }}>404</div>
        <div style={{fontSize:22, fontWeight:600, letterSpacing:"-0.025em", marginTop:8}}>
          Эта вкладка ушла на собеседование
        </div>
        <div style={{fontSize:14, color:"var(--fg-muted)", marginTop:10, lineHeight:1.6}}>
          Страница, которую ты ищешь, не существует или была перемещена. Попробуй вернуться на главную или к обзору.
        </div>
        <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:24, flexWrap:"wrap"}}>
          <BtnC variant="outline" size="md" onClick={()=>setPage("landing")}>← На главную</BtnC>
          <BtnC variant="primary" size="md" onClick={()=>setPage("dashboard")}>К обзору</BtnC>
        </div>

        <div style={{marginTop:48, paddingTop:24, borderTop:"1px solid var(--border)"}}>
          <SectionLabelC>Возможно, ты искал</SectionLabelC>
          <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:12, flexWrap:"wrap"}}>
            {[
              {l:"Заявки", k:"applications"},
              {l:"Доска", k:"board"},
              {l:"Циклы", k:"loops"},
              {l:"Контакты", k:"contacts"},
            ].map(s=>(
              <a key={s.k} onClick={()=>setPage(s.k)} style={{
                fontSize:12.5, padding:"6px 12px", borderRadius:99,
                border:"1px solid var(--border)", background:"var(--bg-elev)",
                color:"var(--fg-muted)", cursor:"pointer",
              }}>{s.l}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.GroupCPages = {
  ContactsPage, InboxPage, CvBuilderPage, CvCheckerPage,
  ResourcesPage, WhatsNewPage, AboutPage, NotFoundPage,
};
