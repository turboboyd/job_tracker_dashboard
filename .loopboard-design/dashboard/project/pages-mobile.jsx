/* Mobile adaptation — key screens in iPhone frames */
const { Card: CardMo, Pill: PillMo, Btn: BtnMo, SectionLabel: SLMo, Icon: IconMo } = window.UI;

// ─────────────────────────────────────────────────────────────────────────────
// Mobile primitives — match the design system but tuned for ~390px screens
// ─────────────────────────────────────────────────────────────────────────────
function MobChrome({ title, left, right, sub }) {
  return (
    <div style={{
      padding:"8px 18px 12px",
      background:"var(--bg)", borderBottom:"1px solid var(--border)",
      display:"flex", flexDirection:"column", gap:6,
    }}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", minHeight:32, gap:8}}>
        <div style={{flex:1, minWidth:0, display:"flex", alignItems:"center", gap:8}}>{left}</div>
        <div style={{display:"flex", alignItems:"center", gap:6, flexShrink:0}}>{right}</div>
      </div>
      <div>
        <div style={{fontSize:24, fontWeight:600, letterSpacing:"-0.025em", lineHeight:1.1}}>{title}</div>
        {sub && <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:2}}>{sub}</div>}
      </div>
    </div>
  );
}

function MobTabBar({ active }) {
  const tabs = [
    { k:"home",     l:"Обзор", icon:"⊞" },
    { k:"apps",     l:"Заявки", icon:"☰", badge:14 },
    { k:"add",      l:"",      icon:"+", primary:true },
    { k:"inbox",    l:"Inbox", icon:"✉", badge:3 },
    { k:"settings", l:"Ещё",   icon:"⋯" },
  ];
  return (
    <div style={{
      borderTop:"1px solid var(--border)",
      background:"color-mix(in oklab, var(--bg-elev) 80%, transparent)",
      backdropFilter:"saturate(180%) blur(12px)",
      padding:"6px 6px 12px",
      display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:4,
    }}>
      {tabs.map(t=>{
        if (t.primary) return (
          <div key={t.k} style={{display:"flex", justifyContent:"center", alignItems:"center"}}>
            <button style={{
              width:46, height:46, borderRadius:14, border:"none",
              background:"var(--accent)", color:"var(--accent-fg)",
              display:"grid", placeItems:"center",
              fontSize:24, fontWeight:300, lineHeight:1, cursor:"pointer",
              boxShadow:"0 6px 16px -4px color-mix(in oklab, var(--accent) 60%, transparent)",
            }}>+</button>
          </div>
        );
        const isActive = active === t.k;
        return (
          <button key={t.k} style={{
            background:"transparent", border:"none", padding:"6px 0", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            color: isActive ? "var(--fg)" : "var(--fg-subtle)",
            position:"relative",
          }}>
            <span style={{fontSize:18, lineHeight:1, fontWeight: isActive ? 600 : 400}}>{t.icon}</span>
            <span style={{fontSize:10, fontWeight:500, letterSpacing:"-0.005em"}}>{t.l}</span>
            {t.badge && (
              <span style={{
                position:"absolute", top:0, right:"50%", marginRight:-18,
                background:"var(--accent)", color:"var(--accent-fg)",
                fontSize:9, fontWeight:600, lineHeight:1,
                padding:"2px 5px", borderRadius:99, border:"2px solid var(--bg-elev)",
                fontVariantNumeric:"tabular-nums",
              }}>{t.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MobPill({ children, tone="neutral" }) {
  const tones = {
    neutral: { bg:"var(--bg-subtle)", fg:"var(--fg-muted)", bd:"var(--border)" },
    accent:  { bg:"color-mix(in oklab, var(--accent) 10%, transparent)", fg:"var(--accent)", bd:"color-mix(in oklab, var(--accent) 25%, transparent)" },
    info:    { bg:"color-mix(in oklab, var(--accent-2) 10%, transparent)", fg:"var(--accent-2)", bd:"color-mix(in oklab, var(--accent-2) 25%, transparent)" },
    success: { bg:"rgba(16,185,129,0.12)", fg:"rgb(5,150,105)", bd:"rgba(16,185,129,0.25)" },
    warning: { bg:"rgba(245,158,11,0.12)", fg:"rgb(180,83,9)", bd:"rgba(245,158,11,0.25)" },
    danger:  { bg:"rgba(239,68,68,0.12)", fg:"rgb(220,38,38)", bd:"rgba(239,68,68,0.25)" },
  };
  const t = tones[tone];
  return <span style={{
    display:"inline-flex", alignItems:"center", gap:4,
    padding:"3px 8px", borderRadius:99,
    fontSize:10.5, fontWeight:500, letterSpacing:"-0.005em",
    background:t.bg, color:t.fg, border:"1px solid "+t.bd,
    whiteSpace:"nowrap",
  }}>{children}</span>;
}

function MobScroll({ children, bottomPad=80 }) {
  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:bottomPad, background:"var(--bg)"}}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 1 — Overview (Dashboard mobile)
// ─────────────────────────────────────────────────────────────────────────────
function MobScreenDashboard() {
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)"}}>
      <MobChrome
        title="Обзор"
        sub="9 мая · Среда"
        left={
          <div style={{
            width:30, height:30, borderRadius:99,
            background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
            color:"#fff", display:"grid", placeItems:"center",
            fontSize:11, fontWeight:600,
          }}>МК</div>
        }
        right={
          <button style={{width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)", position:"relative", cursor:"pointer"}}>
            ◔
            <span style={{position:"absolute", top:5, right:6, width:8, height:8, borderRadius:99, background:"var(--accent)", border:"2px solid var(--bg)"}}/>
          </button>
        }
      />
      <MobScroll>
        {/* Greeting + streak */}
        <div style={{padding:"14px 16px"}}>
          <div style={{
            padding:"14px 16px", borderRadius:12,
            background:"linear-gradient(135deg, color-mix(in oklab, var(--accent) 12%, var(--bg-elev)), var(--bg-elev))",
            border:"1px solid color-mix(in oklab, var(--accent) 25%, var(--border))",
            display:"flex", justifyContent:"space-between", alignItems:"center", gap:12,
          }}>
            <div style={{minWidth:0, flex:1}}>
              <div style={{fontSize:11, color:"var(--fg-subtle)", letterSpacing:"0.04em", textTransform:"uppercase", fontWeight:500, marginBottom:3}}>Серия</div>
              <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.02em"}}>12 дней подряд 🔥</div>
              <div style={{fontSize:11.5, color:"var(--fg-muted)", marginTop:2}}>Действие сегодня — и серия продолжится</div>
            </div>
            <div style={{
              width:46, height:46, borderRadius:99, flexShrink:0,
              background:"var(--accent)", color:"var(--accent-fg)",
              display:"grid", placeItems:"center", fontSize:18, fontWeight:700,
              fontVariantNumeric:"tabular-nums",
            }}>12</div>
          </div>
        </div>

        {/* 4 stat tiles, 2×2 */}
        <div style={{padding:"0 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18}}>
          {[
            { l:"Активные", v:"14", d:"+4", tone:"accent" },
            { l:"Интервью", v:"5",  d:"+2" },
            { l:"Отклики",  v:"36", d:"+18%" },
            { l:"Конверсия",v:"24%", d:"+5%", tone:"success" },
          ].map(s=>(
            <div key={s.l} style={{
              padding:"12px 14px", background:"var(--bg-elev)",
              border:"1px solid var(--border)", borderRadius:10,
            }}>
              <div style={{fontSize:10.5, color:"var(--fg-subtle)", letterSpacing:"0.04em", textTransform:"uppercase", fontWeight:500}}>{s.l}</div>
              <div style={{display:"flex", alignItems:"baseline", gap:6, marginTop:8}}>
                <span style={{
                  fontSize:22, fontWeight:600, letterSpacing:"-0.025em", lineHeight:1, fontVariantNumeric:"tabular-nums",
                  color: s.tone==="accent" ? "var(--accent)" : s.tone==="success" ? "rgb(5,150,105)" : "var(--fg)",
                }}>{s.v}</span>
                <span style={{fontSize:11, color:"rgb(5,150,105)", fontWeight:500}}>{s.d}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Today's plan */}
        <div style={{padding:"0 16px 6px", display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
          <SLMo>План на сегодня</SLMo>
          <a style={{fontSize:11.5, color:"var(--fg-subtle)"}}>3 действия</a>
        </div>
        <div style={{padding:"4px 16px 18px"}}>
          {[
            { c:"N", role:"Финал · Notion · Senior PE", due:"Сегодня · 14:30", tone:"accent" },
            { c:"V", role:"Подготовить ответ Vercel",   due:"До 17:00",       tone:"warning" },
            { c:"S", role:"Followup · Stripe",           due:"+ ещё 1 день",  tone:"neutral" },
          ].map((it,i,arr)=>(
            <div key={i} style={{
              display:"flex", gap:12, alignItems:"center",
              padding:"12px 0", borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                width:32, height:32, borderRadius:7,
                background:"var(--bg-subtle)", border:"1px solid var(--border)",
                display:"grid", placeItems:"center", fontSize:12, fontWeight:600, color:"var(--fg-muted)",
              }}>{it.c}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:500, letterSpacing:"-0.005em"}}>{it.role}</div>
                <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:2}}>{it.due}</div>
              </div>
              <MobPill tone={it.tone}>→</MobPill>
            </div>
          ))}
        </div>

        {/* Pipeline mini */}
        <div style={{padding:"0 16px 6px"}}>
          <SLMo>Воронка</SLMo>
        </div>
        <div style={{padding:"6px 16px 18px"}}>
          {[
            { l:"Сохранено", v:12, w:100, c:"var(--fg-muted)" },
            { l:"Отклик",    v:7,  w:58,  c:"var(--accent-2)" },
            { l:"Интервью",  v:5,  w:41,  c:"var(--accent)" },
            { l:"Оффер",     v:1,  w:8,   c:"rgb(5,150,105)" },
          ].map(s=>(
            <div key={s.l} style={{marginBottom:10}}>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4}}>
                <span>{s.l}</span>
                <span style={{color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>{s.v}</span>
              </div>
              <div style={{height:6, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                <div style={{height:"100%", width:`${s.w}%`, background:s.c, borderRadius:99}}/>
              </div>
            </div>
          ))}
        </div>
      </MobScroll>
      <MobTabBar active="home" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 2 — Applications list
// ─────────────────────────────────────────────────────────────────────────────
function MobScreenApps() {
  const apps = [
    { c:"N", co:"Notion",  role:"Senior Product Engineer", loc:"Munich · Hybrid",  date:"вчера", state:"interview", match:88, fav:true },
    { c:"V", co:"Vercel",  role:"DX Engineer",             loc:"Remote · Global", date:"вчера", state:"offer",     match:94, fav:true },
    { c:"S", co:"Stripe",  role:"Frontend Engineer",       loc:"London · Hybrid", date:"2д",     state:"interview", match:90, fav:false },
    { c:"G", co:"GitHub",  role:"Senior FE Engineer",      loc:"Berlin",          date:"3д",     state:"applied",   match:86, fav:false },
    { c:"L", co:"Linear",  role:"Product Engineer",        loc:"Remote",          date:"4д",     state:"applied",   match:82, fav:false },
    { c:"F", co:"Figma",   role:"Frontend Engineer · React",loc:"Frankfurt",       date:"5д",     state:"saved",     match:81, fav:true },
  ];
  const tones = {
    saved:    { l:"Сохранено",  t:"neutral" },
    applied:  { l:"Отклик",     t:"info" },
    interview:{ l:"Интервью",   t:"accent" },
    offer:    { l:"Оффер",      t:"warning" },
    rejected: { l:"Отказ",      t:"danger" },
  };

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)"}}>
      <MobChrome
        title="Заявки"
        sub="36 всего · 14 активных"
        left={<button style={{background:"transparent", border:"none", color:"var(--fg-muted)", padding:6, cursor:"pointer", fontSize:14}}>‹</button>}
        right={
          <>
            <button style={{width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)", cursor:"pointer"}}>⊜</button>
            <button style={{width:32, height:32, borderRadius:8, background:"var(--accent)", color:"var(--accent-fg)", border:"none", cursor:"pointer", fontSize:14}}>+</button>
          </>
        }
      />

      {/* Search */}
      <div style={{padding:"6px 16px 0", background:"var(--bg)"}}>
        <div style={{
          padding:"8px 12px", borderRadius:10,
          background:"var(--bg-subtle)", border:"1px solid var(--border)",
          display:"flex", alignItems:"center", gap:8,
          fontSize:13, color:"var(--fg-subtle)",
        }}>
          <span style={{display:"inline-flex"}}>{IconMo.search}</span>
          <span>Поиск компаний и ролей</span>
        </div>
      </div>

      {/* Status chips */}
      <div style={{display:"flex", gap:6, padding:"12px 16px 12px", overflowX:"auto", background:"var(--bg)", borderBottom:"1px solid var(--border)"}}>
        {[
          { l:"Все",        c:36, active:true },
          { l:"Сохранено",  c:8 },
          { l:"Отклик",     c:14 },
          { l:"Интервью",   c:5 },
          { l:"Оффер",      c:1 },
          { l:"Отказ",      c:8 },
        ].map(c=>(
          <span key={c.l} style={{
            padding:"6px 12px", borderRadius:99, fontSize:12, whiteSpace:"nowrap",
            background: c.active ? "var(--fg)" : "var(--bg-subtle)",
            color: c.active ? "var(--bg)" : "var(--fg-muted)",
            border:"1px solid " + (c.active ? "var(--fg)" : "var(--border)"),
            fontWeight: c.active ? 500 : 400,
            display:"inline-flex", alignItems:"center", gap:6, flexShrink:0,
          }}>
            <span>{c.l}</span>
            <span style={{
              fontSize:10, padding:"1px 5px", borderRadius:99,
              background: c.active ? "color-mix(in oklab, white 20%, var(--fg))" : "var(--bg-elev)",
              fontVariantNumeric:"tabular-nums",
            }}>{c.c}</span>
          </span>
        ))}
      </div>

      <MobScroll>
        {apps.map((a,i)=>(
          <div key={i} style={{
            display:"flex", gap:12, padding:"14px 16px",
            borderBottom:"1px solid var(--border)",
          }}>
            <div style={{
              width:36, height:36, borderRadius:8, flexShrink:0,
              background:"var(--bg-subtle)", border:"1px solid var(--border)",
              display:"grid", placeItems:"center",
              fontSize:13, fontWeight:600, color:"var(--fg-muted)",
            }}>{a.c}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, marginBottom:3}}>
                <span style={{fontSize:13.5, fontWeight:500, letterSpacing:"-0.005em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                  {a.fav && <span style={{color:"var(--accent)", marginRight:4}}>★</span>}
                  {a.role}
                </span>
                <span style={{fontSize:11, color:"var(--fg-subtle)", flexShrink:0}}>{a.date}</span>
              </div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginBottom:8, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                {a.co} · {a.loc}
              </div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
                <MobPill tone={tones[a.state].t}>{tones[a.state].l}</MobPill>
                <div style={{display:"flex", alignItems:"center", gap:5}}>
                  <div style={{width:32, height:3, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                    <div style={{height:"100%", width:`${a.match}%`, background:a.match>=85 ? "rgb(5,150,105)" : "var(--accent)", borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:10.5, fontWeight:600, fontVariantNumeric:"tabular-nums", color:"var(--fg-muted)"}}>{a.match}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </MobScroll>
      <MobTabBar active="apps" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 3 — Application detail
// ─────────────────────────────────────────────────────────────────────────────
function MobScreenDetails() {
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)"}}>
      {/* Header */}
      <div style={{padding:"8px 16px 14px", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", minHeight:32, marginBottom:14}}>
          <button style={{background:"transparent", border:"none", color:"var(--fg-muted)", padding:6, cursor:"pointer", fontSize:14}}>‹ Заявки</button>
          <div style={{display:"flex", gap:6}}>
            <button style={{width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)", cursor:"pointer"}}>★</button>
            <button style={{width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)", cursor:"pointer"}}>⋯</button>
          </div>
        </div>

        <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
          <div style={{
            width:44, height:44, borderRadius:9, flexShrink:0,
            background:"#000", color:"#fff",
            display:"grid", placeItems:"center", fontSize:18, fontWeight:700, letterSpacing:"-0.04em",
          }}>N</div>
          <div style={{minWidth:0, flex:1}}>
            <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.02em", lineHeight:1.2}}>Senior Product Engineer</div>
            <div style={{fontSize:12.5, color:"var(--fg-muted)", marginTop:3}}>Notion · Munich (Hybrid)</div>
          </div>
        </div>

        <div style={{display:"flex", gap:6, marginTop:12, flexWrap:"wrap"}}>
          <MobPill tone="accent">Финал</MobPill>
          <MobPill tone="success">88 матч</MobPill>
          <MobPill tone="neutral">€95–115K</MobPill>
        </div>
      </div>

      <MobScroll>
        {/* Stage ribbon */}
        <div style={{padding:"16px 16px 14px"}}>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:11}}>
            <span style={{color:"var(--fg-subtle)", letterSpacing:"0.04em", textTransform:"uppercase", fontWeight:500}}>Этап 4 / 5</span>
            <span style={{color:"var(--fg-muted)"}}>Финал · 6 мая</span>
          </div>
          <div style={{display:"flex", gap:4}}>
            {[1,2,3,4,5].map(i=>(
              <div key={i} style={{
                flex:1, height:5, borderRadius:99,
                background: i<=4 ? (i===4 ? "var(--accent)" : "color-mix(in oklab, var(--accent) 60%, transparent)") : "var(--bg-subtle)",
              }}/>
            ))}
          </div>
        </div>

        {/* Next action — sticky-feel */}
        <div style={{padding:"4px 16px 14px"}}>
          <div style={{
            padding:"14px 16px", borderRadius:12,
            background:"linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, var(--bg-elev)), var(--bg-elev))",
            border:"1px solid color-mix(in oklab, var(--accent) 28%, var(--border))",
          }}>
            <div style={{display:"flex", gap:12, alignItems:"flex-start", marginBottom:12}}>
              <div style={{
                width:42, height:42, borderRadius:9, flexShrink:0,
                background:"var(--accent)", color:"var(--accent-fg)",
                display:"grid", placeItems:"center", textAlign:"center", lineHeight:1,
              }}>
                <div>
                  <div style={{fontSize:13, fontWeight:700}}>6</div>
                  <div style={{fontSize:9, opacity:0.85, marginTop:1}}>МАЙ</div>
                </div>
              </div>
              <div style={{minWidth:0, flex:1}}>
                <div style={{fontSize:11, color:"var(--fg-subtle)", letterSpacing:"0.04em", textTransform:"uppercase", fontWeight:500}}>Следующее</div>
                <div style={{fontSize:15, fontWeight:600, letterSpacing:"-0.02em", marginTop:2, lineHeight:1.25}}>Финальное интервью</div>
                <div style={{fontSize:11.5, color:"var(--fg-muted)", marginTop:3}}>14:30 · Google Meet · 60 мин</div>
              </div>
            </div>
            <div style={{display:"flex", gap:6}}>
              <button style={{
                flex:1, height:36, borderRadius:8, border:"none",
                background:"var(--accent)", color:"var(--accent-fg)",
                fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
              }}>Открыть встречу</button>
              <button style={{
                width:36, height:36, borderRadius:8,
                background:"transparent", border:"1px solid var(--border-strong)",
                color:"var(--fg)", fontSize:14, cursor:"pointer",
              }}>⋯</button>
            </div>
          </div>
        </div>

        {/* AI brief snippet */}
        <div style={{padding:"4px 16px 14px"}}>
          <div style={{padding:"12px 14px", borderRadius:10, background:"var(--bg-elev)", border:"1px solid var(--border)"}}>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
              <span style={{width:18, height:18, borderRadius:5, background:"color-mix(in oklab, var(--accent) 14%, transparent)", color:"var(--accent)", display:"grid", placeItems:"center", fontSize:10, fontWeight:700}}>✦</span>
              <span style={{fontSize:11, fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase", color:"var(--fg-subtle)"}}>AI-бриф · 2 ч</span>
            </div>
            <div style={{fontSize:12.5, lineHeight:1.55, color:"var(--fg-muted)"}}>
              <strong style={{color:"var(--fg)", fontWeight:500}}>Сильный кандидат.</strong> Полный матч по React/TS. Слабее: меньше опыта с Y.js — освежи перед финалом.
            </div>
            <a style={{fontSize:12, color:"var(--accent)", fontWeight:500, marginTop:8, display:"inline-block"}}>Полная подготовка →</a>
          </div>
        </div>

        {/* Quick facts grid */}
        <div style={{padding:"4px 16px 14px"}}>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"var(--border)", borderRadius:10, overflow:"hidden", border:"1px solid var(--border)"}}>
            {[
              ["Match", "88 / 100"],
              ["Дней", "24"],
              ["Интервью", "3 / 4"],
              ["Шанс оффера", "62%"],
            ].map(([k,v])=>(
              <div key={k} style={{padding:"12px 14px", background:"var(--bg-elev)"}}>
                <div style={{fontSize:10, color:"var(--fg-subtle)", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:500}}>{k}</div>
                <div style={{fontSize:16, fontWeight:600, letterSpacing:"-0.015em", marginTop:6, fontVariantNumeric:"tabular-nums"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky bottom CTA */}
        <div style={{padding:"4px 16px 80px"}}>
          <SLMo>Контакт</SLMo>
          <div style={{display:"flex", alignItems:"center", gap:10, marginTop:10, padding:"12px 14px", background:"var(--bg-elev)", border:"1px solid var(--border)", borderRadius:10}}>
            <div style={{
              width:36, height:36, borderRadius:99,
              background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
              color:"#fff", display:"grid", placeItems:"center", fontSize:12, fontWeight:600,
            }}>АП</div>
            <div style={{minWidth:0, flex:1}}>
              <div style={{fontSize:13, fontWeight:500}}>Anna Petrova</div>
              <div style={{fontSize:11, color:"var(--fg-subtle)"}}>HR · Notion</div>
            </div>
            <button style={{width:34, height:34, borderRadius:8, background:"var(--bg-subtle)", border:"1px solid var(--border)", color:"var(--fg)", cursor:"pointer"}}>✉</button>
          </div>
        </div>
      </MobScroll>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 4 — Board (Kanban — vertical lanes via swipe)
// ─────────────────────────────────────────────────────────────────────────────
function MobScreenBoard() {
  const cards = [
    { c:"N", role:"Senior Product Engineer", co:"Notion",  loc:"Munich",   match:88, next:"Финал · сегодня" },
    { c:"V", role:"DX Engineer",             co:"Vercel",  loc:"Remote",   match:94, next:"Решение до пт" },
    { c:"S", role:"Frontend Engineer",       co:"Stripe",  loc:"London",   match:90, next:"Финал · 19 мая" },
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)"}}>
      <MobChrome
        title="Доска"
        sub="Свайпом — между колонками"
        left={<button style={{background:"transparent", border:"none", color:"var(--fg-muted)", padding:6, cursor:"pointer", fontSize:14}}>‹</button>}
        right={
          <button style={{width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)", cursor:"pointer"}}>⊜</button>
        }
      />

      {/* Column header */}
      <div style={{padding:"10px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--bg)"}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <button style={{background:"transparent", border:"none", color:"var(--fg-subtle)", fontSize:14, padding:4}}>‹</button>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{width:8, height:8, borderRadius:2, background:"#7c3aed"}}/>
            <span style={{fontSize:13.5, fontWeight:600}}>Интервью</span>
            <span style={{fontSize:11, color:"var(--fg-subtle)", padding:"1px 6px", borderRadius:99, background:"var(--bg-subtle)", border:"1px solid var(--border)", fontVariantNumeric:"tabular-nums"}}>3</span>
          </div>
          <button style={{background:"transparent", border:"none", color:"var(--fg-subtle)", fontSize:14, padding:4}}>›</button>
        </div>
        <span style={{fontSize:11, color:"var(--fg-subtle)"}}>3 / 6</span>
      </div>

      {/* Column dots */}
      <div style={{padding:"8px 16px", display:"flex", justifyContent:"center", gap:6, background:"var(--bg-subtle)"}}>
        {["#3b82f6","#7c3aed","#d97706","#059669","#dc2626","#71717a"].map((c,i)=>(
          <span key={i} style={{
            width: i===1 ? 24 : 6, height:6, borderRadius:99,
            background: i===1 ? c : "var(--border-strong)",
            transition:"width 200ms",
          }}/>
        ))}
      </div>

      <MobScroll>
        <div style={{padding:"12px 16px"}}>
          {cards.map((c,i)=>(
            <div key={i} style={{
              padding:14, marginBottom:10, borderRadius:11,
              background:"var(--bg-elev)", border:"1px solid var(--border)",
              boxShadow:"var(--shadow)",
            }}>
              <div style={{display:"flex", gap:10, alignItems:"flex-start", marginBottom:8}}>
                <div style={{
                  width:28, height:28, borderRadius:6, flexShrink:0,
                  background:"var(--bg-subtle)", border:"1px solid var(--border)",
                  display:"grid", placeItems:"center", fontSize:11, fontWeight:600, color:"var(--fg-muted)",
                }}>{c.c}</div>
                <div style={{minWidth:0, flex:1}}>
                  <div style={{fontSize:13.5, fontWeight:500, letterSpacing:"-0.005em"}}>{c.role}</div>
                  <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:2}}>{c.co} · {c.loc}</div>
                </div>
              </div>
              {c.next && (
                <div style={{
                  padding:"6px 9px", borderRadius:6, marginTop:8,
                  background:"color-mix(in oklab, var(--accent) 8%, transparent)",
                  border:"1px solid color-mix(in oklab, var(--accent) 25%, transparent)",
                  fontSize:11, color:"var(--fg)",
                  display:"flex", alignItems:"center", gap:6,
                }}>
                  <span style={{color:"var(--accent)"}}>◆</span>
                  {c.next}
                </div>
              )}
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, paddingTop:8, borderTop:"1px solid var(--border)"}}>
                <span style={{fontSize:10.5, color:"var(--fg-subtle)"}}>3 дня в колонке</span>
                <span style={{display:"inline-flex", alignItems:"center", gap:5}}>
                  <span style={{width:24, height:3, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                    <div style={{height:"100%", width:`${c.match}%`, background:"var(--accent)"}}/>
                  </span>
                  <span style={{fontSize:10.5, fontWeight:600, fontVariantNumeric:"tabular-nums"}}>{c.match}</span>
                </span>
              </div>
            </div>
          ))}

          {/* Add card */}
          <button style={{
            width:"100%", padding:"14px", borderRadius:11,
            border:"1.5px dashed var(--border-strong)",
            background:"transparent",
            fontSize:13, color:"var(--fg-muted)", fontFamily:"inherit", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>+ Добавить в Интервью</button>
        </div>
      </MobScroll>
      <MobTabBar active="apps" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 5 — Matches (with sources)
// ─────────────────────────────────────────────────────────────────────────────
function MobScreenMatches() {
  const jobs = [
    { c:"N", co:"Notion",  role:"Senior Product Engineer", loc:"Munich",       match:94, src:"LinkedIn", sc:"#0a66c2", posted:"2ч", top:true },
    { c:"V", co:"Vercel",  role:"DX Engineer",             loc:"Remote",       match:91, src:"LinkedIn", sc:"#0a66c2", posted:"4ч", top:true },
    { c:"S", co:"Stripe",  role:"Frontend Engineer",       loc:"London",       match:88, src:"StepStone", sc:"#005c5c", posted:"6ч" },
    { c:"G", co:"GitHub",  role:"Senior FE Engineer",      loc:"Berlin",       match:86, src:"LinkedIn", sc:"#0a66c2", posted:"8ч" },
    { c:"L", co:"Linear",  role:"Product Engineer",        loc:"Remote",       match:82, src:"LinkedIn", sc:"#0a66c2", posted:"вчера" },
    { c:"K", co:"Klarna",  role:"Senior Frontend",         loc:"Stockholm",    match:78, src:"StepStone", sc:"#005c5c", posted:"вчера" },
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)"}}>
      {/* Header */}
      <div style={{padding:"8px 16px 12px", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", minHeight:32, marginBottom:8}}>
          <button style={{background:"transparent", border:"none", color:"var(--fg-muted)", padding:6, cursor:"pointer", fontSize:13}}>‹ Циклы</button>
          <button style={{width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)", cursor:"pointer"}}>⟳</button>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
          <div style={{fontSize:20, fontWeight:600, letterSpacing:"-0.02em"}}>Frontend EU</div>
          <span style={{
            fontSize:10, padding:"2px 7px", borderRadius:99,
            background:"color-mix(in oklab, rgb(5,150,105) 12%, transparent)",
            color:"rgb(5,150,105)", border:"1px solid color-mix(in oklab, rgb(5,150,105) 25%, transparent)",
            fontWeight:500,
          }}>● Sync</span>
        </div>
        <div style={{fontSize:11.5, color:"var(--fg-muted)"}}>30 вакансий · 7 источников · обновлено 2 мин назад</div>
      </div>

      {/* Sources chips */}
      <div style={{padding:"10px 16px 12px", borderBottom:"1px solid var(--border)", background:"var(--bg)", display:"flex", gap:6, overflowX:"auto"}}>
        {[
          { l:"Все", c:30, active:true },
          { l:"LinkedIn", color:"#0a66c2", c:12 },
          { l:"StepStone", color:"#005c5c", c:7 },
          { l:"Indeed", color:"#2164f3", c:5 },
          { l:"XING", color:"#006567", c:3 },
          { l:"HN", color:"#ff6600", c:2 },
          { l:"AngelList", color:"#000", c:0, err:true },
        ].map(s=>(
          <span key={s.l} style={{
            padding:"5px 10px", borderRadius:99, fontSize:11.5, whiteSpace:"nowrap", flexShrink:0,
            background: s.active ? "var(--fg)" : "var(--bg-subtle)",
            color: s.active ? "var(--bg)" : "var(--fg)",
            border:"1px solid " + (s.active ? "var(--fg)" : "var(--border)"),
            fontWeight: s.active ? 500 : 400,
            display:"inline-flex", alignItems:"center", gap:6,
            position:"relative",
          }}>
            {s.color && <span style={{width:7, height:7, borderRadius:2, background:s.color}}/>}
            <span>{s.l}</span>
            <span style={{
              fontSize:10, padding:"0px 5px", borderRadius:99,
              background: s.active ? "color-mix(in oklab, white 25%, var(--fg))" : "var(--bg-elev)",
              color: s.active ? "var(--bg)" : "var(--fg-subtle)",
              fontVariantNumeric:"tabular-nums",
            }}>{s.c}</span>
            {s.err && <span style={{position:"absolute", top:-2, right:-2, width:7, height:7, borderRadius:99, background:"rgb(220,38,38)", border:"1.5px solid var(--bg)"}}/>}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div style={{padding:"0 16px", borderBottom:"1px solid var(--border)", display:"flex", background:"var(--bg)"}}>
        {[{l:"Новые",c:18,a:true},{l:"Сохр.",c:5},{l:"Отклики",c:7},{l:"Скрытые",c:0}].map(t=>(
          <a key={t.l} style={{
            padding:"10px 0", flex:1, textAlign:"center",
            fontSize:12.5, color: t.a ? "var(--fg)" : "var(--fg-muted)",
            fontWeight: t.a ? 500 : 400,
            borderBottom: t.a ? "2px solid var(--accent)" : "2px solid transparent",
            marginBottom:-1, display:"inline-flex", justifyContent:"center", alignItems:"center", gap:5,
          }}>
            {t.l}
            <span style={{fontSize:10, padding:"1px 5px", borderRadius:99, background:"var(--bg-subtle)", border:"1px solid var(--border)", color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums"}}>{t.c}</span>
          </a>
        ))}
      </div>

      <MobScroll>
        {jobs.map((j,i)=>(
          <div key={i} style={{
            padding:"12px 16px", borderBottom:"1px solid var(--border)",
            display:"flex", gap:12, alignItems:"flex-start",
          }}>
            <div style={{
              width:30, height:30, borderRadius:7, flexShrink:0,
              background:"#000", color:"#fff",
              display:"grid", placeItems:"center", fontSize:12, fontWeight:700,
            }}>{j.c}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap"}}>
                <span style={{fontSize:13, fontWeight:500, letterSpacing:"-0.005em"}}>{j.role}</span>
                {j.top && <MobPill tone="accent">★ Топ</MobPill>}
              </div>
              <div style={{fontSize:11, color:"var(--fg-subtle)", marginBottom:3}}>
                <span style={{color:"var(--fg-muted)", fontWeight:500}}>{j.co}</span>
                <span> · {j.loc}</span>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:8, fontSize:10.5, color:"var(--fg-subtle)"}}>
                <span style={{display:"inline-flex", alignItems:"center", gap:5}}>
                  <span style={{width:6, height:6, borderRadius:2, background:j.sc}}/>
                  {j.src}
                </span>
                <span>· {j.posted}</span>
              </div>
            </div>
            <div style={{
              width:36, height:36, borderRadius:7, flexShrink:0,
              background: j.match>=90 ? "color-mix(in oklab, rgb(5,150,105) 14%, transparent)" : j.match>=85 ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "var(--bg-subtle)",
              color: j.match>=90 ? "rgb(5,150,105)" : j.match>=85 ? "var(--accent)" : "var(--fg-muted)",
              border:"1px solid " + (j.match>=85 ? "transparent" : "var(--border)"),
              display:"grid", placeItems:"center",
              fontSize:13, fontWeight:600, fontVariantNumeric:"tabular-nums", letterSpacing:"-0.02em",
            }}>{j.match}</div>
          </div>
        ))}
      </MobScroll>
      <MobTabBar active="apps" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 6 — Login
// ─────────────────────────────────────────────────────────────────────────────
function MobScreenLogin() {
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)", padding:"20px 24px"}}>
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:32}}>
        <div style={{
          width:32, height:32, borderRadius:8,
          background:"var(--fg)", color:"var(--bg)",
          display:"grid", placeItems:"center", fontSize:15, fontWeight:700, letterSpacing:"-0.04em",
        }}>L</div>
        <span style={{fontSize:15, fontWeight:600, letterSpacing:"-0.02em"}}>Loopboard</span>
      </div>

      <div style={{marginBottom:24}}>
        <div style={{fontSize:26, fontWeight:600, letterSpacing:"-0.025em", marginBottom:6}}>С возвращением</div>
        <div style={{fontSize:13.5, color:"var(--fg-muted)"}}>Войди, чтобы продолжить.</div>
      </div>

      <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:20}}>
        <button style={{
          height:46, borderRadius:10, border:"1px solid var(--border)",
          background:"var(--bg-elev)", color:"var(--fg)",
          fontSize:13.5, fontWeight:500, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"inherit",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.14-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.86 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.68-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.68 2.84C6.72 7.31 9.14 5.38 12 5.38Z"/></svg>
          Продолжить с Google
        </button>
        <button style={{
          height:46, borderRadius:10, border:"1px solid var(--border)",
          background:"var(--bg-elev)", color:"var(--fg)",
          fontSize:13.5, fontWeight:500, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"inherit",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5Z"/></svg>
          Продолжить с GitHub
        </button>
      </div>

      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:18, fontSize:11, color:"var(--fg-subtle)"}}>
        <span style={{flex:1, height:1, background:"var(--border)"}}/>
        <span>или email</span>
        <span style={{flex:1, height:1, background:"var(--border)"}}/>
      </div>

      <div style={{display:"flex", flexDirection:"column", gap:12}}>
        <div>
          <div style={{fontSize:11.5, color:"var(--fg-muted)", marginBottom:6, fontWeight:500}}>Email</div>
          <div style={{height:44, padding:"0 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--bg-elev)", display:"flex", alignItems:"center", fontSize:13.5, color:"var(--fg-subtle)"}}>you@company.com</div>
        </div>
        <div>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6}}>
            <span style={{fontSize:11.5, color:"var(--fg-muted)", fontWeight:500}}>Пароль</span>
            <span style={{fontSize:11, color:"var(--accent)"}}>Забыл?</span>
          </div>
          <div style={{height:44, padding:"0 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--bg-elev)", display:"flex", alignItems:"center", fontSize:13.5, color:"var(--fg-subtle)"}}>••••••••</div>
        </div>
      </div>

      <button style={{
        marginTop:18, height:48, borderRadius:10, border:"none",
        background:"var(--accent)", color:"var(--accent-fg)",
        fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
      }}>Войти</button>

      <div style={{flex:1}}/>
      <div style={{textAlign:"center", fontSize:12, color:"var(--fg-subtle)"}}>
        Нет аккаунта? <span style={{color:"var(--accent)", fontWeight:500}}>Регистрация</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 7 — Inbox
// ─────────────────────────────────────────────────────────────────────────────
function MobScreenInbox() {
  const items = [
    { f:"Notion", subj:"Приглашение на финал",   prev:"Команда впечатлена твоим выступлением…", t:"14:30", unread:true,  tone:"accent" },
    { f:"Vercel", subj:"Оффер · DX Engineer",     prev:"Рады предложить тебе позицию. €140K…",   t:"11:05", unread:true,  tone:"success" },
    { f:"Stripe", subj:"Подтверди время финала", prev:"Среда в 14:30 или четверг в 11:00?",     t:"вчера", unread:true,  tone:"accent" },
    { f:"Loopboard",subj:"Дайджест · 7 матчей", prev:"За неделю — 7 новых вакансий по твоему циклу…", t:"вчера", unread:false, tone:"info" },
    { f:"GitHub", subj:"Подтверди интерес",       prev:"Всё ещё ищешь? Запустим процесс…",       t:"3д",    unread:false, tone:"neutral" },
    { f:"Sentry", subj:"К сожалению, не сейчас", prev:"После рассмотрения мы решили…",          t:"5д",    unread:false, tone:"danger" },
  ];
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)"}}>
      <MobChrome
        title="Inbox"
        sub="3 непрочитанных"
        left={<div style={{width:30, height:30, borderRadius:99, background:"linear-gradient(135deg, var(--accent), var(--accent-2))", color:"#fff", display:"grid", placeItems:"center", fontSize:11, fontWeight:600}}>МК</div>}
        right={
          <>
            <button style={{width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)", cursor:"pointer"}}>⊜</button>
            <button style={{width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--fg-muted)", cursor:"pointer"}}>⌕</button>
          </>
        }
      />
      <div style={{display:"flex", gap:6, padding:"10px 16px 12px", overflowX:"auto", background:"var(--bg)", borderBottom:"1px solid var(--border)"}}>
        {[
          {l:"Все",c:13,active:true},{l:"Непрочит.",c:3},{l:"Интервью",c:5},{l:"Офферы",c:1},{l:"Система",c:4}
        ].map(c=>(
          <span key={c.l} style={{
            padding:"5px 10px", borderRadius:99, fontSize:11.5, whiteSpace:"nowrap", flexShrink:0,
            background: c.active ? "var(--fg)" : "var(--bg-subtle)",
            color: c.active ? "var(--bg)" : "var(--fg-muted)",
            border:"1px solid " + (c.active ? "var(--fg)" : "var(--border)"),
            fontWeight: c.active ? 500 : 400,
          }}>{c.l} · {c.c}</span>
        ))}
      </div>
      <MobScroll>
        {items.map((m,i)=>(
          <div key={i} style={{
            padding:"12px 16px", borderBottom:"1px solid var(--border)",
            display:"flex", gap:12, alignItems:"flex-start",
            background: m.unread ? "color-mix(in oklab, var(--accent) 3%, transparent)" : "transparent",
          }}>
            <div style={{
              width:34, height:34, borderRadius:99, flexShrink:0,
              background:"var(--bg-subtle)", border:"1px solid var(--border)",
              display:"grid", placeItems:"center", fontSize:12, fontWeight:600, color:"var(--fg-muted)",
            }}>{m.f[0]}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, marginBottom:2}}>
                <span style={{fontSize:13, fontWeight: m.unread ? 600 : 500, letterSpacing:"-0.005em"}}>
                  {m.unread && <span style={{display:"inline-block", width:6, height:6, borderRadius:99, background:"var(--accent)", marginRight:6, verticalAlign:"middle"}}/>}
                  {m.f}
                </span>
                <span style={{fontSize:10.5, color:"var(--fg-subtle)", whiteSpace:"nowrap"}}>{m.t}</span>
              </div>
              <div style={{fontSize:12.5, fontWeight: m.unread ? 500 : 400, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{m.subj}</div>
              <div style={{fontSize:11, color:"var(--fg-subtle)", lineHeight:1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", textOverflow:"ellipsis"}}>{m.prev}</div>
            </div>
          </div>
        ))}
      </MobScroll>
      <MobTabBar active="inbox" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Showcase shell
// ─────────────────────────────────────────────────────────────────────────────
const IS_IOS_READY = () => typeof window !== "undefined" && window.IOSDevice;

function MobileFrame({ children, label, dark, hideChrome }) {
  if (!IS_IOS_READY()) {
    // fallback fake frame
    return (
      <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:12}}>
        <div style={{
          width:340, height:680, borderRadius:42, padding:8,
          background:"#111", boxShadow:"0 24px 48px -12px rgba(0,0,0,0.25)",
        }}>
          <div style={{width:"100%", height:"100%", borderRadius:34, overflow:"hidden", background:"#fff"}}>
            {children}
          </div>
        </div>
        {label && <div style={{fontSize:13, fontWeight:500, color:"var(--fg-muted)"}}>{label}</div>}
      </div>
    );
  }
  const IOSDevice = window.IOSDevice;
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:14, flexShrink:0}}>
      <IOSDevice width={340} height={720} dark={dark}>
        <div style={{height:"calc(100% - 12px)", display:"flex", flexDirection:"column", paddingTop:48}}>
          {children}
        </div>
      </IOSDevice>
      {label && (
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:13, fontWeight:600, letterSpacing:"-0.005em"}}>{label.title}</div>
          {label.sub && <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:3}}>{label.sub}</div>}
        </div>
      )}
    </div>
  );
}

function MobileShowcase({ setPage }) {
  const screens = [
    { k:"dashboard", title:"Обзор",        sub:"главный экран, KPI, план", el: <MobScreenDashboard/> },
    { k:"apps",      title:"Заявки",       sub:"список + фильтры + поиск", el: <MobScreenApps/> },
    { k:"details",   title:"Карточка",     sub:"заявка с next-action", el: <MobScreenDetails/> },
    { k:"board",     title:"Доска",        sub:"свайп между колонками", el: <MobScreenBoard/> },
    { k:"matches",   title:"Матчи цикла",  sub:"источники + список", el: <MobScreenMatches/> },
    { k:"inbox",     title:"Inbox",        sub:"уведомления и письма", el: <MobScreenInbox/> },
    { k:"login",     title:"Вход",         sub:"auth + соц-логины", el: <MobScreenLogin/> },
  ];

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <div style={{borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <div style={{padding:"16px 28px"}}>
          <div style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-subtle)", marginBottom:4}}>
            <a onClick={()=>setPage("dashboard")} style={{cursor:"pointer", color:"inherit"}}>Loopboard</a>
            <span>/</span>
            <span style={{color:"var(--fg-muted)"}}>Мобильная адаптация</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:16, flexWrap:"wrap"}}>
            <div style={{minWidth:0, flex:1}}>
              <h1 style={{margin:0, fontSize:22, letterSpacing:"-0.025em", fontWeight:600}}>Мобильная версия</h1>
              <p style={{margin:"4px 0 0", fontSize:13, color:"var(--fg-muted)"}}>
                7 ключевых экранов в iPhone-фрейме. Прокрути вправо, чтобы увидеть все.
              </p>
            </div>
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <PillMo tone="neutral">iPhone 15 Pro · 393×852</PillMo>
              <PillMo tone="neutral">7 экранов</PillMo>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        flex:1, overflow:"auto", padding:"32px 28px 60px",
        background:"linear-gradient(180deg, var(--bg) 0%, var(--bg-subtle) 100%)",
      }}>
        <div style={{
          display:"flex", gap:38, paddingBottom:20,
          width:"max-content", minWidth:"100%", alignItems:"flex-start",
        }}>
          {screens.map(s=>(
            <MobileFrame key={s.k} label={{title:s.title, sub:s.sub}}>
              {s.el}
            </MobileFrame>
          ))}
        </div>

        <div style={{
          marginTop:40, padding:"22px 26px",
          background:"var(--bg-elev)", border:"1px solid var(--border)", borderRadius:14,
          maxWidth:880,
        }}>
          <SLMo>Что учтено в мобиле</SLMo>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:18, marginTop:14}}>
            {[
              { t:"Touch targets ≥ 44px", d:"Все интерактивные элементы крупнее физического минимума."},
              { t:"Bottom-нав на 5 пунктов", d:"С центральным «+» как primary action — стандарт SaaS."},
              { t:"Stack > grid", d:"Карточки в одну колонку, статы — 2×2, чипы — горизонтальный скролл."},
              { t:"Sticky bottom CTA", d:"Главное действие всегда виден над таб-баром в карточке заявки."},
              { t:"Horizontal swipe", d:"Между колонками доски, между источниками в матчах."},
              { t:"Тёмная тема", d:"Все экраны работают на dark — переключи через Tweaks."},
            ].map(f=>(
              <div key={f.t}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:4}}>{f.t}</div>
                <div style={{fontSize:12, color:"var(--fg-muted)", lineHeight:1.5}}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.MobilePages = { MobileShowcase };
