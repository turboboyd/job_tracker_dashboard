/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

// ─────────────────────────────────────────────────────────────────────────────
// TWEAK DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "coral",
  "page": "landing",
  "density": "balanced",
  "showGrid": false
}/*EDITMODE-END*/;

// ─────────────────────────────────────────────────────────────────────────────
// THEME / ACCENT TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    "--bg":            "#fafafa",
    "--bg-elev":       "#ffffff",
    "--bg-subtle":     "#f4f4f5",
    "--border":        "#e7e7ea",
    "--border-strong": "#d4d4d8",
    "--fg":            "#0a0a0a",
    "--fg-muted":      "#52525b",
    "--fg-subtle":     "#71717a",
    "--shadow":        "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 1px 0 rgb(0 0 0 / 0.02)",
    "--shadow-lg":     "0 8px 24px -8px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
    "--grid-line":     "rgba(0,0,0,0.04)",
  },
  dark: {
    "--bg":            "#08080a",
    "--bg-elev":       "#101013",
    "--bg-subtle":     "#16161a",
    "--border":        "#1e1e23",
    "--border-strong": "#2a2a31",
    "--fg":            "#f4f4f5",
    "--fg-muted":      "#a1a1aa",
    "--fg-subtle":     "#71717a",
    "--shadow":        "0 1px 2px 0 rgb(0 0 0 / 0.4)",
    "--shadow-lg":     "0 8px 24px -8px rgb(0 0 0 / 0.6)",
    "--grid-line":     "rgba(255,255,255,0.04)",
  },
};

const ACCENTS = {
  coral:  { primary: "#e65e4c", secondary: "#3b82f6", name: "Coral + Blue" },
  indigo: { primary: "#6366f1", secondary: "#06b6d4", name: "Indigo + Cyan" },
  mono:   { primary: "#0a0a0a", secondary: "#71717a", name: "Mono" },
};

function applyTokens(theme, accent) {
  const root = document.documentElement;
  const tokens = THEMES[theme];
  const a = ACCENTS[accent];
  Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.setProperty("--accent", a.primary);
  root.style.setProperty("--accent-2", a.secondary);
  // Use light/dark for high-contrast accent foreground
  root.style.setProperty("--accent-fg", "#ffffff");
  if (accent === "mono" && theme === "dark") {
    root.style.setProperty("--accent", "#f4f4f5");
    root.style.setProperty("--accent-fg", "#0a0a0a");
    root.style.setProperty("--accent-2", "#a1a1aa");
  }
  document.body.style.background = "var(--bg)";
  document.body.style.color = "var(--fg)";
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function Dot({ color = "var(--accent)", size = 6 }) {
  return <span style={{display:"inline-block", width:size, height:size, borderRadius:999, background:color, flexShrink:0}} />;
}

function Pill({ children, tone = "neutral", subtle = true }) {
  const tones = {
    neutral: { bg: "var(--bg-subtle)", fg: "var(--fg-muted)", bd: "var(--border)" },
    accent:  { bg: "color-mix(in oklab, var(--accent) 8%, transparent)", fg: "var(--accent)", bd: "color-mix(in oklab, var(--accent) 20%, transparent)" },
    info:    { bg: "color-mix(in oklab, var(--accent-2) 8%, transparent)", fg: "var(--accent-2)", bd: "color-mix(in oklab, var(--accent-2) 22%, transparent)" },
    success: { bg: "rgba(16,185,129,0.10)", fg: "rgb(5,150,105)", bd: "rgba(16,185,129,0.22)" },
    warning: { bg: "rgba(245,158,11,0.10)", fg: "rgb(180,83,9)", bd: "rgba(245,158,11,0.22)" },
    danger:  { bg: "rgba(239,68,68,0.10)", fg: "rgb(220,38,38)", bd: "rgba(239,68,68,0.22)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"3px 9px", borderRadius:999,
      fontSize:11.5, fontWeight:500, letterSpacing:"-0.005em",
      background: subtle ? t.bg : "transparent",
      color: t.fg,
      border: `1px solid ${t.bd}`,
      whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

function Btn({ children, variant = "primary", size = "md", onClick, full, icon, iconRight }) {
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12.5, height: 30, gap: 6 },
    md: { padding: "8px 14px", fontSize: 13.5, height: 36, gap: 8 },
    lg: { padding: "10px 18px", fontSize: 14, height: 42, gap: 8 },
  }[size];
  const variants = {
    primary: { bg:"var(--accent)", fg:"var(--accent-fg)", bd:"var(--accent)", hov:"transform: translateY(-0.5px)" },
    outline: { bg:"transparent", fg:"var(--fg)", bd:"var(--border-strong)" },
    ghost:   { bg:"transparent", fg:"var(--fg-muted)", bd:"transparent" },
    subtle:  { bg:"var(--bg-subtle)", fg:"var(--fg)", bd:"var(--border)" },
  }[variant];
  return (
    <button onClick={onClick} className="ui-btn" style={{
      ...sizes,
      width: full ? "100%" : "auto",
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      background: variants.bg, color: variants.fg,
      border:`1px solid ${variants.bd}`, borderRadius:8,
      fontWeight:500, letterSpacing:"-0.01em",
      cursor:"pointer", transition:"all 140ms cubic-bezier(0.16, 1, 0.3, 1)",
      fontFamily:"inherit",
    }}>
      {icon && <span style={{display:"inline-flex"}}>{icon}</span>}
      <span>{children}</span>
      {iconRight && <span style={{display:"inline-flex"}}>{iconRight}</span>}
    </button>
  );
}

function Card({ children, padding = 24, style, onClick, ...rest }) {
  return (
    <div onClick={onClick} {...rest} style={{
      background:"var(--bg-elev)",
      border:"1px solid var(--border)",
      borderRadius:14,
      padding,
      ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize:11, fontWeight:500, letterSpacing:"0.08em",
      textTransform:"uppercase", color:"var(--fg-subtle)",
    }}>{children}</div>
  );
}

// Tiny inline icons (24px viewbox)
const Icon = {
  arrow:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  arrowUR:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>,
  check:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  spark:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></svg>,
  loop:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></svg>,
  filter:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M6 12h12M10 18h4"/></svg>,
  funnel:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h18l-7 9v7l-4-2v-5z"/></svg>,
  link:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  bell:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/></svg>,
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  cmd:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6V3a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v3M9 6h6M9 6v12M15 6v12M9 18v3a3 3 0 1 1-3-3h12a3 3 0 1 1-3 3v-3"/></svg>,
  calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>,
};

// Expose primitives so split-out page files can use them
window.UI = { Card, Pill, Btn, SectionLabel, Dot, Icon };

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────
function TopNav({ page, setPage }) {
  return (
    <header style={{
      position:"sticky", top:0, zIndex:50,
      background:"color-mix(in oklab, var(--bg) 80%, transparent)",
      backdropFilter:"saturate(180%) blur(12px)",
      borderBottom:"1px solid var(--border)",
    }}>
      <div style={{
        maxWidth:1280, margin:"0 auto", padding:"0 24px",
        height:60, display:"flex", alignItems:"center", justifyContent:"space-between", gap:24,
      }}>
        <div style={{display:"flex", alignItems:"center", gap:32}}>
          <div style={{display:"flex", alignItems:"center", gap:9}}>
            <div style={{
              width:24, height:24, borderRadius:6,
              background:"var(--fg)", color:"var(--bg)",
              display:"grid", placeItems:"center",
              fontSize:13, fontWeight:700, letterSpacing:"-0.04em",
            }}>L</div>
            <span style={{fontSize:14.5, fontWeight:600, letterSpacing:"-0.02em"}}>Loopboard</span>
            <span style={{
              fontSize:10.5, fontWeight:500, letterSpacing:"0.02em",
              padding:"2px 6px", borderRadius:4,
              background:"var(--bg-subtle)", color:"var(--fg-subtle)",
              border:"1px solid var(--border)",
              marginLeft:2,
            }}>BETA</span>
          </div>

          <nav style={{display:"flex", alignItems:"center", gap:4}}>
            {[
              {k:"landing", l:"Главная"},
              {k:"dashboard", l:"Обзор"},
              {k:"landing", l:"Ресурсы", noop:true},
              {k:"landing", l:"Поддержка", noop:true},
            ].map((it,i)=>(
              <a key={i} onClick={()=>!it.noop && setPage(it.k)} style={{
                padding:"6px 10px", borderRadius:6,
                fontSize:13, color: page===it.k && !it.noop ? "var(--fg)" : "var(--fg-muted)",
                fontWeight: page===it.k && !it.noop ? 500 : 400,
                background: page===it.k && !it.noop ? "var(--bg-subtle)" : "transparent",
                cursor:"pointer", letterSpacing:"-0.01em",
                transition:"color 140ms",
              }}>{it.l}</a>
            ))}
          </nav>
        </div>

        <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"6px 8px 6px 10px", borderRadius:8,
            border:"1px solid var(--border)", background:"var(--bg-subtle)",
            fontSize:12.5, color:"var(--fg-subtle)",
          }}>
            <span style={{display:"inline-flex"}}>{Icon.search}</span>
            <span style={{
              fontSize:10.5, padding:"1px 5px", borderRadius:4,
              background:"var(--bg-elev)", border:"1px solid var(--border)",
              fontFamily:"var(--font-mono)",
            }}>⌘K</span>
          </div>
          <Btn variant="outline" size="sm" onClick={()=>setPage("dashboard")}>Войти</Btn>
          <Btn variant="primary" size="sm" onClick={()=>setPage("dashboard")}>Создать</Btn>
        </div>
      </div>
    </header>
  );
}

function HeroPreview() {
  return (
    <div style={{position:"relative"}}>
      {/* Subtle grid background */}
      <div aria-hidden style={{
        position:"absolute", inset:-40, zIndex:-1,
        backgroundImage: "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)",
      }} />

      <Card padding={0} style={{overflow:"hidden", boxShadow:"var(--shadow-lg)"}}>
        {/* Window chrome */}
        <div style={{
          padding:"10px 14px",
          borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", gap:8,
          background:"var(--bg-subtle)",
        }}>
          <div style={{display:"flex", gap:6}}>
            <span style={{width:10, height:10, borderRadius:99, background:"var(--border-strong)"}}/>
            <span style={{width:10, height:10, borderRadius:99, background:"var(--border-strong)"}}/>
            <span style={{width:10, height:10, borderRadius:99, background:"var(--border-strong)"}}/>
          </div>
          <div style={{
            marginLeft:8, padding:"3px 10px",
            background:"var(--bg-elev)", border:"1px solid var(--border)",
            borderRadius:6, fontSize:11, color:"var(--fg-subtle)",
            fontFamily:"var(--font-mono)",
          }}>loopboard.app/dashboard</div>
          <Pill tone="info" subtle>● Live demo</Pill>
        </div>

        <div style={{padding:20, display:"grid", gap:14}}>
          {/* Loop card */}
          <div style={{
            border:"1px solid var(--border)", borderRadius:10,
            background:"var(--bg)", padding:16,
          }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <SectionLabel>Поисковый цикл</SectionLabel>
              <Pill tone="accent">● Активен</Pill>
            </div>
            <div style={{fontSize:15, fontWeight:600, letterSpacing:"-0.02em", marginBottom:10}}>
              Frontend Engineer · React · Frankfurt
            </div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {["Радиус 30 км","Гибрид","7 дней","de / en"].map(b=>(
                <span key={b} style={{
                  fontSize:11.5, padding:"3px 9px", borderRadius:6,
                  background:"var(--bg-subtle)", color:"var(--fg-muted)",
                  border:"1px solid var(--border)",
                }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Links + funnel side-by-side */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
            <div style={{border:"1px solid var(--border)", borderRadius:10, background:"var(--bg)", padding:14}}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}>
                <SectionLabel>Площадки</SectionLabel>
                <span style={{fontSize:11, color:"var(--fg-subtle)"}}>4 готовы</span>
              </div>
              <div style={{display:"grid", gap:6}}>
                {["LinkedIn","StepStone","Indeed","XING"].map(p=>(
                  <div key={p} style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"7px 10px", border:"1px solid var(--border)", borderRadius:7,
                    fontSize:12.5, background:"var(--bg-elev)",
                  }}>
                    <span style={{display:"flex", alignItems:"center", gap:8}}>
                      <Dot color="var(--accent-2)" />
                      {p}
                    </span>
                    <span style={{color:"var(--fg-subtle)"}}>{Icon.arrowUR}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{border:"1px solid var(--border)", borderRadius:10, background:"var(--bg)", padding:14}}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}>
                <SectionLabel>Воронка</SectionLabel>
                <span style={{fontSize:11, color:"var(--fg-subtle)"}}>21 / 30 дней</span>
              </div>
              <div style={{display:"grid", gap:8}}>
                {[
                  {l:"Сохранено", v:12, w:100, c:"var(--fg)"},
                  {l:"Отклик",    v:7,  w:58,  c:"var(--accent)"},
                  {l:"Интервью",  v:2,  w:17,  c:"var(--accent-2)"},
                ].map(s=>(
                  <div key={s.l}>
                    <div style={{display:"flex", justifyContent:"space-between", fontSize:11.5, marginBottom:4}}>
                      <span style={{color:"var(--fg-muted)"}}>{s.l}</span>
                      <span style={{fontWeight:600, fontVariantNumeric:"tabular-nums"}}>{s.v}</span>
                    </div>
                    <div style={{height:4, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                      <div style={{height:"100%", width:`${s.w}%`, background:s.c, borderRadius:99}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Hero({ setPage }) {
  return (
    <section style={{padding:"72px 0 48px"}}>
      <div style={{display:"grid", gridTemplateColumns:"1.05fr 1fr", gap:64, alignItems:"center"}}>
        <div>
          <Pill tone="neutral">
            <Dot color="var(--accent)" /> Цикл поиска работы · v2.4
          </Pill>

          <h1 style={{
            margin:"20px 0 0",
            fontSize:"clamp(40px, 5.5vw, 64px)", lineHeight:1.02, letterSpacing:"-0.035em",
            fontWeight:600,
          }}>
            Системный поиск работы
            <br/>
            <span style={{color:"var(--fg-subtle)"}}>вместо 100 вкладок.</span>
          </h1>

          <p style={{
            margin:"24px 0 0", maxWidth:540,
            fontSize:17, lineHeight:1.55, color:"var(--fg-muted)",
            letterSpacing:"-0.01em",
          }}>
            Один сценарий → ссылки площадок → сохранённые матчи → статусы.
            Меньше шума, больше контроля над процессом.
          </p>

          <div style={{display:"flex", gap:10, marginTop:32, flexWrap:"wrap"}}>
            <Btn variant="primary" size="lg" iconRight={Icon.arrow} onClick={()=>setPage("dashboard")}>
              Перейти к обзору
            </Btn>
            <Btn variant="outline" size="lg" onClick={()=>setPage("dashboard")}>
              Создать аккаунт
            </Btn>
            <Btn variant="ghost" size="lg">Узнать больше</Btn>
          </div>

          <div style={{
            display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:0,
            marginTop:48, paddingTop:24, borderTop:"1px solid var(--border)",
          }}>
            {[
              {l:"Порядок", v:"Всё в одном", h:"Вакансии, статусы, заметки"},
              {l:"Скорость", v:"Быстрее на каждом шаге", h:"Шаблоны, фильтры, поиски"},
              {l:"Ясность", v:"Видишь, что работает", h:"История, воронка, метрики"},
            ].map((s,i)=>(
              <div key={i} style={{
                paddingLeft: i===0 ? 0 : 20,
                paddingRight: i===2 ? 0 : 20,
                borderLeft: i===0 ? "none" : "1px solid var(--border)",
              }}>
                <SectionLabel>{s.l}</SectionLabel>
                <div style={{marginTop:6, fontSize:14.5, fontWeight:600, letterSpacing:"-0.015em"}}>{s.v}</div>
                <div style={{marginTop:3, fontSize:12.5, color:"var(--fg-subtle)"}}>{s.h}</div>
              </div>
            ))}
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    {
      icon: Icon.funnel,
      title:"Отслеживай отклики без хаоса",
      text:"Сохраняй вакансии, держи ссылки, отслеживай статусы и дедлайны. Всё остаётся в одном месте.",
      points:["Статусы и история изменений","Заметки и ссылки на переписки","Быстрый поиск по списку"],
    },
    {
      icon: Icon.link,
      title:"Поисковые ссылки под твой сценарий",
      text:"Один раз настраиваешь фильтры — и получаешь готовые ссылки для разных платформ.",
      points:["Один набор фильтров для разных сайтов","Фильтры хранятся внутри цикла","Гибкая расширяемая логика"],
    },
    {
      icon: Icon.spark,
      title:"Воронка и контроль процесса",
      text:"Смотри, где теряется время. Улучшай стратегию на реальных цифрах, а не на ощущениях.",
      points:["Понятная структура по этапам","Фокус на следующем действии","Ритм: планирование и дисциплина"],
    },
  ];

  return (
    <section style={{padding:"56px 0"}}>
      <div style={{maxWidth:640, marginBottom:40}}>
        <SectionLabel>Что внутри</SectionLabel>
        <h2 style={{margin:"10px 0 0", fontSize:36, lineHeight:1.1, letterSpacing:"-0.03em", fontWeight:600}}>
          Инструменты для планомерного поиска
        </h2>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:1, background:"var(--border)", borderRadius:14, overflow:"hidden", border:"1px solid var(--border)"}}>
        {features.map((f,i)=>(
          <div key={i} style={{background:"var(--bg-elev)", padding:32}}>
            <div style={{
              width:36, height:36, borderRadius:8,
              background:"var(--bg-subtle)", border:"1px solid var(--border)",
              display:"grid", placeItems:"center", color:"var(--fg)",
              marginBottom:20,
            }}>{f.icon}</div>
            <h3 style={{margin:0, fontSize:17, fontWeight:600, letterSpacing:"-0.02em"}}>{f.title}</h3>
            <p style={{margin:"10px 0 18px", fontSize:13.5, lineHeight:1.55, color:"var(--fg-muted)"}}>{f.text}</p>
            <ul style={{margin:0, padding:0, listStyle:"none", display:"grid", gap:8}}>
              {f.points.map(p=>(
                <li key={p} style={{display:"flex", alignItems:"flex-start", gap:9, fontSize:13, color:"var(--fg)"}}>
                  <span style={{color:"var(--accent)", marginTop:2}}>{Icon.check}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowToStart({ setPage }) {
  const steps = [
    { n:"01", title:"Собери цикл за 60 секунд", text:"Выбери роль, город и пару фильтров — готово. Ты получишь набор ссылок для поиска." },
    { n:"02", title:"Открой площадки одним сценарием", text:"Ссылки уже подготовлены. Открыл — сохранил подходящие вакансии в список." },
    { n:"03", title:"Меняй статусы, веди процесс", text:"Отмечай, что сделал и что дальше. Процесс становится спокойным и прозрачным." },
  ];

  return (
    <section style={{padding:"56px 0"}}>
      <Card padding={48} style={{background:"var(--bg-elev)"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:64, alignItems:"start"}}>
          <div>
            <SectionLabel>Как начать</SectionLabel>
            <h2 style={{margin:"10px 0 16px", fontSize:32, lineHeight:1.1, letterSpacing:"-0.03em", fontWeight:600}}>
              Один маленький шаг каждый день
            </h2>
            <p style={{margin:0, fontSize:14, lineHeight:1.6, color:"var(--fg-muted)"}}>
              Простое правило: один цикл становится твоим ежедневным ритмом.
              Проверь источники → сохрани матчи → сделай следующий шаг.
            </p>
            <div style={{marginTop:24, display:"flex", gap:8, flexWrap:"wrap"}}>
              <Btn variant="primary" size="md" iconRight={Icon.arrow} onClick={()=>setPage("dashboard")}>
                Создать первый цикл
              </Btn>
              <Btn variant="outline" size="md">Шпаргалки и гайды</Btn>
            </div>
          </div>

          <div style={{display:"grid", gap:0, borderLeft:"1px solid var(--border)"}}>
            {steps.map((s,i)=>(
              <div key={s.n} style={{
                paddingLeft:32, paddingTop: i===0 ? 0 : 24, paddingBottom: i===2 ? 0 : 24,
                borderBottom: i<2 ? "1px solid var(--border)" : "none",
                position:"relative",
              }}>
                <div style={{
                  position:"absolute", left:-7, top: i===0 ? 0 : 24,
                  width:13, height:13, borderRadius:99,
                  background:"var(--bg-elev)", border:"1px solid var(--border-strong)",
                  display:"grid", placeItems:"center",
                }}>
                  <Dot color="var(--accent)" size={5} />
                </div>
                <div style={{display:"flex", alignItems:"baseline", gap:14}}>
                  <span style={{
                    fontFamily:"var(--font-mono)", fontSize:11,
                    color:"var(--fg-subtle)", letterSpacing:"0.05em",
                  }}>{s.n}</span>
                  <h3 style={{margin:0, fontSize:17, fontWeight:600, letterSpacing:"-0.02em"}}>{s.title}</h3>
                </div>
                <p style={{margin:"8px 0 0 35px", fontSize:13.5, lineHeight:1.6, color:"var(--fg-muted)"}}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

function FooterCTA({ setPage }) {
  return (
    <section style={{padding:"56px 0 96px"}}>
      <div style={{
        position:"relative", overflow:"hidden",
        border:"1px solid var(--border)", borderRadius:18,
        background:"var(--bg-elev)",
        padding:"56px 48px",
      }}>
        <div aria-hidden style={{
          position:"absolute", inset:0, zIndex:0, opacity:0.6,
          backgroundImage:"radial-gradient(circle at 90% 50%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 50%), radial-gradient(circle at 10% 100%, color-mix(in oklab, var(--accent-2) 10%, transparent), transparent 50%)",
        }}/>
        <div style={{position:"relative", display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:48, alignItems:"center"}}>
          <div>
            <SectionLabel>Почему так легче</SectionLabel>
            <h2 style={{margin:"12px 0 14px", fontSize:34, lineHeight:1.1, letterSpacing:"-0.03em", fontWeight:600}}>
              Меньше шума, больше контроля
            </h2>
            <p style={{margin:"0 0 24px", fontSize:15, lineHeight:1.6, color:"var(--fg-muted)", maxWidth:520}}>
              Вместо ежедневной пересборки поиска — следуешь сценарию: фильтры
              сохранены, ссылки готовы, статусы видны. Меньше хаоса — больше движения.
            </p>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              <Pill tone="success">Стабильно</Pill>
              <Pill tone="info">Понятные шаги</Pill>
              <Pill tone="warning">Меньше хаоса</Pill>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            <Btn variant="primary" size="lg" full iconRight={Icon.arrow} onClick={()=>setPage("dashboard")}>
              Перейти к обзору
            </Btn>
            <Btn variant="outline" size="lg" full onClick={()=>setPage("dashboard")}>
              Создать аккаунт
            </Btn>
            <div style={{textAlign:"center", fontSize:12, color:"var(--fg-subtle)", marginTop:6}}>
              Бесплатно. Без карты. Без рекламы.
            </div>
          </div>
        </div>
      </div>

      <footer style={{
        marginTop:48, paddingTop:24, borderTop:"1px solid var(--border)",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        fontSize:12, color:"var(--fg-subtle)",
      }}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <div style={{
            width:18, height:18, borderRadius:5,
            background:"var(--fg)", color:"var(--bg)",
            display:"grid", placeItems:"center",
            fontSize:10, fontWeight:700,
          }}>L</div>
          <span>Loopboard · 2026</span>
        </div>
        <div style={{display:"flex", gap:18}}>
          <a style={{color:"inherit"}}>Конфиденциальность</a>
          <a style={{color:"inherit"}}>Условия</a>
          <a style={{color:"inherit"}}>GitHub</a>
        </div>
      </footer>
    </section>
  );
}

function LandingPage({ setPage }) {
  return (
    <div style={{maxWidth:1200, margin:"0 auto", padding:"0 24px"}}>
      <Hero setPage={setPage} />
      <FeaturesGrid />
      <HowToStart setPage={setPage} />
      <FooterCTA setPage={setPage} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────
function DashboardSidebar({ page, setPage }) {
  const items = [
    { l:"Обзор",       k:"dashboard",    icon: Icon.spark },
    { l:"Заявки",      k:"applications", icon: Icon.funnel, count:24 },
    { l:"Доска",       k:"board",        icon: Icon.filter },
    { l:"Контакты",    k:"contacts",     icon: Icon.link, count:8 },
    { l:"Циклы",       k:"loops",        icon: Icon.loop, count:3 },
    { l:"Матчи",       k:"matches",      icon: Icon.search, count:24 },
    { l:"CV-чекер",    k:"cvChecker",    icon: Icon.check },
    { l:"Настройки",   k:"settings",     icon: Icon.filter },
  ];
  return (
    <aside style={{
      width:240, flexShrink:0, padding:"20px 12px",
      borderRight:"1px solid var(--border)",
      display:"flex", flexDirection:"column", gap:20,
      height:"100%",
    }}>
      <div style={{display:"flex", alignItems:"center", gap:9, padding:"0 8px"}}>
        <div style={{
          width:24, height:24, borderRadius:6,
          background:"var(--fg)", color:"var(--bg)",
          display:"grid", placeItems:"center",
          fontSize:13, fontWeight:700, letterSpacing:"-0.04em",
        }}>L</div>
        <span style={{fontSize:14, fontWeight:600, letterSpacing:"-0.02em"}}>Loopboard</span>
      </div>

      <div style={{
        margin:"0 4px", padding:"8px 10px",
        background:"var(--bg-subtle)", borderRadius:8,
        border:"1px solid var(--border)",
        display:"flex", alignItems:"center", gap:10,
      }}>
        <div style={{
          width:28, height:28, borderRadius:6,
          background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
          color:"#fff", display:"grid", placeItems:"center",
          fontSize:11, fontWeight:600,
        }}>МК</div>
        <div style={{minWidth:0, flex:1}}>
          <div style={{fontSize:12.5, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
            Мария Климова
          </div>
          <div style={{fontSize:10.5, color:"var(--fg-subtle)"}}>Free plan</div>
        </div>
      </div>

      <nav style={{display:"flex", flexDirection:"column", gap:1}}>
        <SectionLabel><div style={{padding:"0 8px 6px"}}>Воркспейс</div></SectionLabel>
        {items.map(it=>{
          const active = page===it.k;
          return (
          <a key={it.l} onClick={()=>!it.soon && setPage(it.k)} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"6px 10px", borderRadius:6,
            fontSize:13, letterSpacing:"-0.005em",
            color: active ? "var(--fg)" : "var(--fg-muted)",
            fontWeight: active ? 500 : 400,
            background: active ? "var(--bg-subtle)" : "transparent",
            cursor: it.soon ? "not-allowed" : "pointer",
            opacity: it.soon ? 0.55 : 1,
          }}>
            <span style={{color: active ? "var(--fg)" : "var(--fg-subtle)"}}>{it.icon}</span>
            <span style={{flex:1}}>{it.l}</span>
            {it.count !== undefined && (
              <span style={{
                fontSize:10.5, fontVariantNumeric:"tabular-nums",
                padding:"1px 6px", borderRadius:99,
                background:"var(--bg-elev)", border:"1px solid var(--border)",
                color:"var(--fg-subtle)",
              }}>{it.count}</span>
            )}
          </a>
        )})}
      </nav>

      <div style={{marginTop:"auto", padding:"12px 10px", borderTop:"1px solid var(--border)"}}>
        <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginBottom:8}}>Помощь</div>
        <div style={{display:"flex", flexDirection:"column", gap:4, fontSize:12.5}}>
          <a onClick={()=>setPage("whatsNew")} style={{color:"var(--fg-muted)", cursor:"pointer"}}>Что нового</a>
          <a onClick={()=>setPage("resources")} style={{color:"var(--fg-muted)", cursor:"pointer"}}>Ресурсы</a>
          <a onClick={()=>setPage("about")} style={{color:"var(--fg-muted)", cursor:"pointer"}}>О проекте</a>
        </div>
      </div>
    </aside>
  );
}

function DashboardHeader({ setPage, page = "dashboard" }) {
  const tabs = [
    { l:"Обзор",       k:"dashboard" },
    { l:"Аналитика",   k:"analytics" },
    { l:"Календарь",   k:"calendar" },
    { l:"Оптимизация", k:"optimization" },
    { l:"Активность",  k:"activity" },
  ];
  return (
    <div style={{
      borderBottom:"1px solid var(--border)",
      background:"var(--bg)",
    }}>
      <div style={{padding:"16px 28px 0"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
          <div>
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              fontSize:11.5, color:"var(--fg-subtle)", marginBottom:4,
            }}>
              <span onClick={()=>setPage("landing")} style={{cursor:"pointer"}}>Loopboard</span>
              <span>/</span>
              <span style={{color:"var(--fg-muted)"}}>Воркспейс</span>
            </div>
            <h1 style={{margin:0, fontSize:22, letterSpacing:"-0.025em", fontWeight:600}}>
              Обзор
            </h1>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <Btn variant="outline" size="sm" icon={Icon.filter}>Поисковые циклы · 3</Btn>
            <Btn variant="outline" size="sm" icon={Icon.calendar}>30 дней</Btn>
            <Btn variant="ghost" size="sm" icon={Icon.bell} />
            <Btn variant="primary" size="sm" icon={Icon.plus}>Новая заявка</Btn>
          </div>
        </div>

        <div style={{display:"flex", gap:2, alignItems:"flex-end"}}>
          {tabs.map((tab)=>{
            const active = page === tab.k;
            return (
              <a key={tab.k} onClick={()=>setPage(tab.k)} style={{
                padding:"8px 14px", fontSize:13, letterSpacing:"-0.01em",
                color: active ? "var(--fg)" : "var(--fg-muted)",
                fontWeight: active ? 500 : 400,
                borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom:-1, cursor:"pointer",
              }}>{tab.l}</a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, sub, trend, accent }) {
  return (
    <Card padding={20}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8}}>
        <div style={{flex:1, minWidth:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
          <SectionLabel>{label}</SectionLabel>
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize:11, fontWeight:500, flexShrink:0, whiteSpace:"nowrap",
            color: trend>0 ? "rgb(5,150,105)" : trend<0 ? "rgb(220,38,38)" : "var(--fg-subtle)",
            display:"inline-flex", alignItems:"center", gap:3,
          }}>
            {trend>0 ? "↑" : trend<0 ? "↓" : "→"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{
        marginTop:10, fontSize:30, fontWeight:600,
        letterSpacing:"-0.03em", lineHeight:1,
        fontVariantNumeric:"tabular-nums",
        color: accent ? "var(--accent)" : "var(--fg)",
      }}>{value}</div>
      <div style={{marginTop:6, fontSize:12, color:"var(--fg-subtle)"}}>{sub}</div>
    </Card>
  );
}

function FunnelChart() {
  // Donut-style segmented funnel
  const segments = [
    { l:"Активные", v:14, c:"var(--accent-2)" },
    { l:"Интервью", v:5,  c:"#7c3aed" },
    { l:"Предложение", v:2, c:"#d97706" },
    { l:"Отказ",    v:7,  c:"#dc2626" },
    { l:"Нет ответа", v:8,  c:"var(--fg-subtle)" },
  ];
  const total = segments.reduce((a,b)=>a+b.v, 0);

  // Build donut as svg
  const radius = 70, stroke = 18, c = 90;
  const cf = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <Card>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>Воронка</div>
          <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:3}}>По стадиям</div>
        </div>
        <Pill tone="neutral">{total} всего</Pill>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"minmax(120px, 160px) 1fr", gap:14, alignItems:"center"}}>
        <svg width="100%" height="160" viewBox="0 0 180 180" style={{maxWidth:160}}>
          <circle cx={c} cy={c} r={radius} fill="none" stroke="var(--bg-subtle)" strokeWidth={stroke}/>
          {segments.map((s,i)=>{
            const len = (s.v/total)*cf;
            const off = -acc;
            acc += len;
            return (
              <circle key={i}
                cx={c} cy={c} r={radius} fill="none"
                stroke={s.c} strokeWidth={stroke}
                strokeDasharray={`${len} ${cf}`} strokeDashoffset={off}
                transform={`rotate(-90 ${c} ${c})`}
                strokeLinecap="butt"
              />
            );
          })}
          <text x={c} y={c-2} textAnchor="middle" style={{fontSize:30, fontWeight:600, letterSpacing:"-0.03em", fill:"var(--fg)"}} fontVariantNumeric="tabular-nums">{total}</text>
          <text x={c} y={c+18} textAnchor="middle" style={{fontSize:11, fill:"var(--fg-subtle)"}}>В воронке</text>
        </svg>

        <div style={{display:"grid", gap:6}}>
          {segments.map(s=>(
            <div key={s.l} style={{display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:12.5}}>
              <span style={{display:"flex", alignItems:"center", gap:10}}>
                <span style={{width:8, height:8, borderRadius:2, background:s.c}}/>
                <span style={{color:"var(--fg-muted)"}}>{s.l}</span>
              </span>
              <span style={{fontVariantNumeric:"tabular-nums", color:"var(--fg)", fontWeight:500}}>
                {s.v}
                <span style={{color:"var(--fg-subtle)", fontWeight:400, marginLeft:6, fontSize:11}}>
                  {Math.round(s.v/total*100)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function TrendsSparkline() {
  // 30 days of fake activity
  const data = [3,2,4,3,5,2,1,4,6,5,3,4,7,5,4,6,8,5,7,9,6,5,7,8,5,9,11,8,9,7];
  const max = Math.max(...data);
  const w = 480, h = 120, pad = 8;
  const step = (w - pad*2) / (data.length-1);
  const points = data.map((v,i)=>[pad + i*step, h - pad - (v/max) * (h - pad*2)]);
  const line = points.map((p,i)=>(i===0?"M":"L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L ${w-pad} ${h-pad} L ${pad} ${h-pad} Z`;

  return (
    <Card>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, gap:10, flexWrap:"wrap"}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>Тренды</div>
          <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:3}}>30 дней</div>
        </div>
        <div style={{display:"flex", gap:4, padding:2, background:"var(--bg-subtle)", borderRadius:7, border:"1px solid var(--border)", flexShrink:0}}>
          {["Создано","Обновлено"].map((t,i)=>(
            <span key={t} style={{
              padding:"4px 10px", fontSize:11.5, borderRadius:5,
              background: i===0 ? "var(--bg-elev)" : "transparent",
              color: i===0 ? "var(--fg)" : "var(--fg-subtle)",
              border: i===0 ? "1px solid var(--border)" : "1px solid transparent",
              fontWeight: i===0 ? 500 : 400, cursor:"pointer",
            }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{display:"flex", gap:24, marginBottom:14}}>
        <div>
          <div style={{fontSize:11, color:"var(--fg-subtle)", marginBottom:2}}>В периоде</div>
          <div style={{fontSize:24, fontWeight:600, letterSpacing:"-0.025em", fontVariantNumeric:"tabular-nums"}}>
            162 <span style={{fontSize:12, fontWeight:500, color:"rgb(5,150,105)", marginLeft:4}}>↑ 24%</span>
          </div>
        </div>
        <div style={{borderLeft:"1px solid var(--border)", paddingLeft:24}}>
          <div style={{fontSize:11, color:"var(--fg-subtle)", marginBottom:2}}>Среднее в день</div>
          <div style={{fontSize:24, fontWeight:600, letterSpacing:"-0.025em", fontVariantNumeric:"tabular-nums"}}>5.4</div>
        </div>
      </div>

      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grad)"/>
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((p,i)=>(
          i===points.length-1 ? <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--accent)" stroke="var(--bg-elev)" strokeWidth="2"/> : null
        ))}
      </svg>
    </Card>
  );
}

function PlanCard() {
  const items = [
    { t:"Klarna · Senior Frontend", sub:"Ответить рекрутеру", due:"Сегодня · 15:00", tone:"warning", company:"K" },
    { t:"Vercel · DX Engineer", sub:"Подготовить тестовое", due:"Завтра", tone:"info", company:"V" },
    { t:"Stripe · Frontend Eng", sub:"Followup · 10 дней без ответа", due:"Просрочено · 2д", tone:"danger", company:"S" },
    { t:"Linear · Product Eng", sub:"Технический скрин", due:"Чт · 11:00", tone:"info", company:"L" },
  ];
  return (
    <Card padding={0}>
      <div style={{padding:"18px 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--border)", gap:10, flexWrap:"wrap"}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>План</div>
          <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:3}}>{items.length} в плане</div>
        </div>
        <div style={{display:"flex", gap:4, padding:2, background:"var(--bg-subtle)", borderRadius:7, border:"1px solid var(--border)", flexShrink:0}}>
          {["Все","Просрочено","Сегодня","Завтра"].map((t,i)=>(
            <span key={t} style={{
              padding:"4px 10px", fontSize:11.5, borderRadius:5,
              background: i===0 ? "var(--bg-elev)" : "transparent",
              color: i===0 ? "var(--fg)" : "var(--fg-subtle)",
              border: i===0 ? "1px solid var(--border)" : "1px solid transparent",
              fontWeight: i===0 ? 500 : 400, cursor:"pointer",
            }}>{t}</span>
          ))}
        </div>
      </div>
      <div>
        {items.map((it,i)=>(
          <div key={i} style={{
            padding:"14px 20px",
            borderBottom: i<items.length-1 ? "1px solid var(--border)" : "none",
            display:"flex", alignItems:"center", gap:14,
          }}>
            <div style={{
              width:32, height:32, borderRadius:7,
              background:"var(--bg-subtle)", border:"1px solid var(--border)",
              display:"grid", placeItems:"center",
              fontSize:12, fontWeight:600, letterSpacing:"-0.02em",
              color:"var(--fg-muted)",
            }}>{it.company}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13.5, fontWeight:500, letterSpacing:"-0.005em"}}>{it.t}</div>
              <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:2}}>{it.sub}</div>
            </div>
            <Pill tone={it.tone}>{it.due}</Pill>
            <button style={{
              background:"transparent", border:"none", color:"var(--fg-subtle)", cursor:"pointer",
              padding:6, borderRadius:6,
            }}>{Icon.arrow}</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentJobs() {
  const jobs = [
    { c:"GitHub", role:"Senior Frontend Engineer", loc:"Berlin · Remote", status:"applied", time:"2ч назад" },
    { c:"Notion",  role:"Product Engineer",         loc:"Munich",         status:"interview", time:"вчера" },
    { c:"Figma",   role:"Frontend Engineer · React",loc:"Frankfurt",      status:"saved",     time:"2д назад" },
    { c:"Datadog", role:"Software Engineer",        loc:"Remote · EU",    status:"applied",   time:"3д назад" },
    { c:"Sentry",  role:"Full-stack Engineer",      loc:"Vienna",         status:"rejected",  time:"4д назад" },
  ];
  const tones = {
    saved:    {l:"Сохранено", t:"neutral"},
    applied:  {l:"Отклик",    t:"info"},
    interview:{l:"Интервью",  t:"accent"},
    rejected: {l:"Отказ",     t:"danger"},
  };
  return (
    <Card padding={0}>
      <div style={{padding:"18px 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--border)"}}>
        <div>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>Последние заявки</div>
          <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:3}}>За последние 7 дней</div>
        </div>
        <a style={{fontSize:12, color:"var(--fg-muted)", display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer"}}>
          Смотреть все {Icon.arrow}
        </a>
      </div>
      <div>
        {jobs.map((j,i)=>(
          <div key={i} style={{
            padding:"12px 20px",
            borderBottom: i<jobs.length-1 ? "1px solid var(--border)" : "none",
            display:"flex", alignItems:"center", gap:14,
          }}>
            <div style={{
              width:30, height:30, borderRadius:6,
              background:"var(--bg-subtle)", border:"1px solid var(--border)",
              display:"grid", placeItems:"center",
              fontSize:11, fontWeight:600, color:"var(--fg-muted)",
            }}>{j.c.slice(0,1)}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:500, letterSpacing:"-0.005em"}}>{j.role}</div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:1}}>
                {j.c} · {j.loc}
              </div>
            </div>
            <Pill tone={tones[j.status].t}>{tones[j.status].l}</Pill>
            <span style={{fontSize:11, color:"var(--fg-subtle)", width:70, textAlign:"right"}}>{j.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GoalsCard() {
  const goal = 25, current = 17;
  const pct = current/goal;
  return (
    <Card>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16}}>
        <div>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>Цель недели</div>
          <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:3}}>Откликов: {current} / {goal}</div>
        </div>
        <Pill tone="success">● Серия · 12 дней</Pill>
      </div>

      <div style={{
        display:"flex", gap:3, marginBottom:14,
        height:34,
      }}>
        {Array.from({length:7}).map((_,i)=>{
          const v = [3,2,4,1,5,2,0][i];
          const max = 5;
          return (
            <div key={i} style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:2}}>
              <div style={{
                height: `${(v/max)*100}%`,
                background: v>0 ? "var(--accent)" : "var(--bg-subtle)",
                borderRadius:3,
                minHeight: v>0 ? 4 : 4,
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex", justifyContent:"space-between", fontSize:10.5, color:"var(--fg-subtle)", letterSpacing:"0.04em"}}>
        {["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"].map(d=><span key={d}>{d}</span>)}
      </div>

      <div style={{marginTop:18, paddingTop:14, borderTop:"1px solid var(--border)"}}>
        <div style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8}}>
          <span style={{color:"var(--fg-muted)"}}>Прогресс</span>
          <span style={{fontWeight:500, fontVariantNumeric:"tabular-nums"}}>{Math.round(pct*100)}%</span>
        </div>
        <div style={{height:5, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
          <div style={{height:"100%", width:`${pct*100}%`, background:"var(--accent)", borderRadius:99}}/>
        </div>
      </div>
    </Card>
  );
}

function InsightsCard() {
  const items = [
    { l:"Отклик → Интервью", v:"24%", trend:+5 },
    { l:"Интервью → Оффер",   v:"33%", trend:-2 },
    { l:"Медиана до интервью",v:"6.4д", trend:-12 },
    { l:"Требует внимания",   v:"4",    trend:0 },
  ];
  return (
    <Card>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <div>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.015em"}}>Подсказки</div>
          <div style={{fontSize:12, color:"var(--fg-subtle)", marginTop:3}}>Ключевые показатели</div>
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"var(--border)", border:"1px solid var(--border)", borderRadius:8, overflow:"hidden"}}>
        {items.map((it,i)=>(
          <div key={i} style={{padding:"12px 14px", background:"var(--bg-elev)"}}>
            <div style={{fontSize:11, color:"var(--fg-subtle)", marginBottom:6}}>{it.l}</div>
            <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between"}}>
              <span style={{fontSize:20, fontWeight:600, letterSpacing:"-0.025em", fontVariantNumeric:"tabular-nums"}}>{it.v}</span>
              {it.trend !== 0 && (
                <span style={{
                  fontSize:11, fontWeight:500,
                  color: it.trend>0 ? "rgb(5,150,105)" : "rgb(220,38,38)",
                }}>
                  {it.trend>0?"↑":"↓"} {Math.abs(it.trend)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop:14, padding:"10px 12px",
        border:"1px solid color-mix(in oklab, var(--accent) 25%, transparent)",
        background:"color-mix(in oklab, var(--accent) 6%, transparent)",
        borderRadius:8, display:"flex", gap:10, alignItems:"flex-start",
      }}>
        <span style={{color:"var(--accent)", marginTop:1}}>{Icon.spark}</span>
        <div>
          <div style={{fontSize:12.5, fontWeight:500}}>4 отклика без ответа &gt; 14 дней</div>
          <div style={{fontSize:11.5, color:"var(--fg-muted)", marginTop:2}}>Стоит написать followup или закрыть.</div>
        </div>
      </div>
    </Card>
  );
}

function DashboardPage({ page, setPage }) {
  const { ApplicationsPage, BoardPage, DetailsPage, LoopsPage, MatchesPage } = (window.GroupAPages || {});
  const { AccountSettingsPage } = (window.GroupBPages || {});
  const { ContactsPage, InboxPage, CvBuilderPage, CvCheckerPage, ResourcesPage, WhatsNewPage, AboutPage, NotFoundPage } = (window.GroupCPages || {});
  const { DetailsPageV2, AnalyticsPage, CalendarPage, OptimizationPage, ActivityPage } = (window.PriorityPages || {});
  const { MatchesV2 } = (window.MatchesV2Page || {});
  const { LoopDetailPage } = (window.LoopDetailPage || {});
  const { ModalsShowcase } = (window.MatchesModalsPages || {});
  const { StatesShowcase, CommandHubPage } = (window.StatesAndCommandPages || {});
  const { MobileShowcase } = (window.MobilePages || {});
  let body;
  if (page === "applications" && ApplicationsPage)   body = <ApplicationsPage setPage={setPage}/>;
  else if (page === "board" && BoardPage)            body = <BoardPage setPage={setPage}/>;
  else if (page === "details" && DetailsPageV2)      body = <DetailsPageV2 setPage={setPage}/>;
  else if (page === "details" && DetailsPage)        body = <DetailsPage setPage={setPage}/>;
  else if (page === "loops" && LoopsPage)            body = <LoopsPage setPage={setPage}/>;
  else if (page === "loopDetail" && LoopDetailPage)  body = <LoopDetailPage setPage={setPage}/>;
  else if (page === "matches" && MatchesV2)          body = <MatchesV2 setPage={setPage}/>;
  else if (page === "matchesOld" && MatchesPage)     body = <MatchesPage setPage={setPage}/>;
  else if (page === "modals" && ModalsShowcase)      body = <ModalsShowcase setPage={setPage}/>;
  else if (page === "states" && StatesShowcase)      body = <StatesShowcase setPage={setPage}/>;
  else if (page === "command" && CommandHubPage)     body = <CommandHubPage setPage={setPage}/>;
  else if (page === "mobile" && MobileShowcase)      body = <MobileShowcase setPage={setPage}/>;
  else if (page === "analytics" && AnalyticsPage)    body = <AnalyticsPage setPage={setPage}/>;
  else if (page === "calendar" && CalendarPage)      body = <CalendarPage setPage={setPage}/>;
  else if (page === "optimization" && OptimizationPage) body = <OptimizationPage setPage={setPage}/>;
  else if (page === "activity" && ActivityPage)      body = <ActivityPage setPage={setPage}/>;
  else if (page === "contacts" && ContactsPage)      body = <ContactsPage setPage={setPage}/>;
  else if (page === "inbox" && InboxPage)            body = <InboxPage setPage={setPage}/>;
  else if (page === "cvBuilder" && CvBuilderPage)    body = <CvBuilderPage setPage={setPage}/>;
  else if (page === "cvChecker" && CvCheckerPage)    body = <CvCheckerPage setPage={setPage}/>;
  else if (page === "resources" && ResourcesPage)    body = <ResourcesPage setPage={setPage}/>;
  else if (page === "whatsNew" && WhatsNewPage)      body = <WhatsNewPage setPage={setPage}/>;
  else if (page === "about" && AboutPage)            body = <AboutPage setPage={setPage}/>;
  else if (page === "notFound" && NotFoundPage)      body = <NotFoundPage setPage={setPage}/>;
  else if (page === "settings" && AccountSettingsPage) body = <AccountSettingsPage setPage={setPage}/>;
  else body = (
    <>
      <DashboardHeader setPage={setPage} page={page} />
      <div style={{flex:1, overflowY:"auto", padding:"24px 28px 48px", background:"var(--bg)"}}>
          {/* Stats row */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14, marginBottom:14}}>
            <StatTile label="Всего заявок" value="36" sub="за последние 30 дней" trend={+18} />
            <StatTile label="Активные" value="14" sub="в процессе" trend={+4} accent />
            <StatTile label="Интервью" value="5" sub="запланировано" trend={+2} />
            <StatTile label="Конверсия" value="24%" sub="отклик → интервью" trend={+5} />
          </div>

          {/* Main grid */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:14, marginBottom:14}}>
            <div style={{gridColumn: "span 1", minWidth:0}}><TrendsSparkline /></div>
            <div style={{minWidth:0}}><FunnelChart /></div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:14, marginBottom:14}}>
            <div style={{minWidth:0}}><PlanCard /></div>
            <div style={{minWidth:0}}><GoalsCard /></div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:14}}>
            <div style={{minWidth:0}}><RecentJobs /></div>
            <div style={{minWidth:0}}><InsightsCard /></div>
          </div>
      </div>
    </>
  );

  return (
    <div style={{display:"flex", height:"100vh", overflow:"hidden"}}>
      <DashboardSidebar page={page} setPage={setPage} />
      <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%"}}>
        {body}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TWEAKS
// ─────────────────────────────────────────────────────────────────────────────
const { TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSelect, TweakToggle } = window;

function TweaksUI({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Страница">
        <TweakSelect
          label="Экран"
          value={tweaks.page}
          onChange={v=>setTweak("page", v)}
          options={[
            { value: "landing",          label: "Главная (лендинг)" },
            { value: "login",            label: "Auth · Вход" },
            { value: "register",         label: "Auth · Регистрация" },
            { value: "profileQuestions", label: "Auth · Анкета" },
            { value: "dashboard",        label: "Обзор · Dashboard" },
            { value: "applications",     label: "Заявки" },
            { value: "board",            label: "Доска (Kanban)" },
            { value: "details",          label: "★ Карточка заявки" },
            { value: "analytics",        label: "★ Аналитика" },
            { value: "calendar",         label: "★ Календарь" },
            { value: "optimization",     label: "★ Оптимизация" },
            { value: "activity",         label: "★ Активность" },
            { value: "loops",            label: "Поисковые циклы" },
            { value: "loopDetail",       label: "Цикл · детали (внутри)" },
            { value: "matches",          label: "Матчи цикла (v2)" },
            { value: "modals",           label: "Модальные окна" },
            { value: "states",           label: "★ UX-состояния (пусто/loading/error)" },
            { value: "command",          label: "★ ⌘K + Уведомления" },
            { value: "mobile",           label: "★ Мобильная адаптация" },
            { value: "contacts",         label: "Контакты" },
            { value: "inbox",            label: "Входящие" },
            { value: "cvBuilder",        label: "CV · Конструктор" },
            { value: "cvChecker",        label: "CV · Чекер" },
            { value: "resources",        label: "Ресурсы" },
            { value: "whatsNew",         label: "Что нового" },
            { value: "about",            label: "О проекте" },
            { value: "notFound",         label: "404" },
            { value: "settings",         label: "Настройки аккаунта" },
          ]}
        />
      </TweakSection>
      <TweakSection title="Тема">
        <TweakRadio
          label="Тема"
          value={tweaks.theme}
          onChange={v=>setTweak("theme", v)}
          options={[
            { value: "light", label: "Светлая" },
            { value: "dark", label: "Тёмная" },
          ]}
        />
        <TweakSelect
          label="Акцент"
          value={tweaks.accent}
          onChange={v=>setTweak("accent", v)}
          options={[
            { value: "coral", label: "Coral + Blue (бренд)" },
            { value: "indigo", label: "Indigo + Cyan" },
            { value: "mono", label: "Mono" },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(()=>{
    applyTokens(tweaks.theme, tweaks.accent);
  }, [tweaks.theme, tweaks.accent]);

  const setPage = (p) => setTweak("page", p);

  return (
    <div style={{minHeight:"100vh", background:"var(--bg)", color:"var(--fg)"}}>
      {(() => {
        const p = tweaks.page;
        const fullscreen = ["login","register","profileQuestions"];
        if (p === "landing") {
          return <>
            <TopNav page={p} setPage={setPage} />
            <LandingPage setPage={setPage} />
          </>;
        }
        if (fullscreen.includes(p) && window.GroupBPages) {
          const { LoginPage, RegisterPage, ProfileQuestionsPage } = window.GroupBPages;
          if (p === "login")            return <LoginPage setPage={setPage} />;
          if (p === "register")         return <RegisterPage setPage={setPage} />;
          if (p === "profileQuestions") return <ProfileQuestionsPage setPage={setPage} />;
        }
        return <DashboardPage page={p} setPage={setPage} />;
      })()}
      <TweaksUI tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
