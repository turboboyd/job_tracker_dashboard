/* Group B pages — Auth (Login/Register), AccountSettings, ProfileQuestions */
const { Card, Pill, Btn, SectionLabel, Icon } = window.UI;

// Brand panel for split-layout auth
function AuthBrandPanel() {
  return (
    <div style={{
      flex:1, minWidth:0, position:"relative", overflow:"hidden",
      background:"linear-gradient(135deg, color-mix(in oklab, var(--accent) 22%, var(--bg)) 0%, color-mix(in oklab, var(--accent-2) 18%, var(--bg)) 100%)",
      display:"flex", flexDirection:"column", justifyContent:"space-between",
      padding:"40px 44px", color:"var(--fg)",
    }}>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <div style={{
          width:28, height:28, borderRadius:7,
          background:"var(--fg)", color:"var(--bg)",
          display:"grid", placeItems:"center",
          fontSize:14, fontWeight:700, letterSpacing:"-0.04em",
        }}>L</div>
        <span style={{fontSize:15, fontWeight:600, letterSpacing:"-0.02em"}}>Loopboard</span>
      </div>

      {/* Decorative card preview */}
      <div style={{position:"relative", flex:1, display:"flex", alignItems:"center", justifyContent:"center", margin:"36px 0"}}>
        <div style={{
          width:"100%", maxWidth:420,
          background:"var(--bg-elev)", border:"1px solid var(--border)",
          borderRadius:14, padding:18, boxShadow:"0 30px 60px -20px rgba(0,0,0,0.25)",
          transform:"rotate(-1.5deg)",
        }}>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:14}}>
            <div>
              <div style={{fontSize:11, color:"var(--fg-subtle)", textTransform:"uppercase", letterSpacing:"0.06em"}}>Цикл</div>
              <div style={{fontSize:14, fontWeight:600, marginTop:2}}>Frontend EU</div>
            </div>
            <Pill tone="success">● Активный</Pill>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, marginBottom:14}}>
            {[{l:"Матчи",v:"24"},{l:"Отклики",v:"14"},{l:"Сегодня",v:"+3"}].map(s=>(
              <div key={s.l} style={{padding:"8px 10px", background:"var(--bg-subtle)", borderRadius:8, border:"1px solid var(--border)"}}>
                <div style={{fontSize:10, color:"var(--fg-subtle)"}}>{s.l}</div>
                <div style={{fontSize:18, fontWeight:600, marginTop:2}}>{s.v}</div>
              </div>
            ))}
          </div>
          {[
            { c:"Notion",  r:"Product Engineer",   m:88 },
            { c:"Stripe",  r:"Frontend Engineer",  m:90 },
            { c:"Vercel",  r:"DX Engineer",        m:94 },
          ].map((j,i)=>(
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"8px 0",
              borderTop: "1px solid var(--border)",
            }}>
              <div style={{width:22, height:22, borderRadius:5, background:"var(--bg-subtle)", border:"1px solid var(--border)", display:"grid", placeItems:"center", fontSize:10, fontWeight:600, color:"var(--fg-muted)"}}>{j.c[0]}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:11.5, fontWeight:500}}>{j.r}</div>
                <div style={{fontSize:10.5, color:"var(--fg-subtle)"}}>{j.c}</div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:5}}>
                <div style={{width:30, height:3, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
                  <div style={{height:"100%", width:`${j.m}%`, background:"var(--accent)"}}/>
                </div>
                <span style={{fontSize:10, fontVariantNumeric:"tabular-nums", color:"var(--fg-muted)"}}>{j.m}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{fontSize:22, fontWeight:600, letterSpacing:"-0.025em", maxWidth:420, lineHeight:1.25}}>
          Один цикл — десятки источников. Откликайся осознанно.
        </div>
        <div style={{display:"flex", gap:18, marginTop:20, fontSize:12, color:"var(--fg-muted)"}}>
          <span>● 2 800+ кандидатов</span>
          <span>● 14 платформ</span>
          <span>● Бесплатно</span>
        </div>
      </div>
    </div>
  );
}

function AuthInput({ label, type="text", placeholder, hint }) {
  return (
    <label style={{display:"block"}}>
      <div style={{fontSize:12, color:"var(--fg-muted)", marginBottom:6, fontWeight:500}}>{label}</div>
      <input type={type} placeholder={placeholder} style={{
        width:"100%", height:38, padding:"0 12px",
        background:"var(--bg-elev)", border:"1px solid var(--border)",
        borderRadius:8, fontSize:13.5, color:"var(--fg)",
        fontFamily:"inherit", outline:"none",
        transition:"border-color 120ms",
      }}
      onFocus={e=>e.target.style.borderColor="var(--accent)"}
      onBlur={e=>e.target.style.borderColor="var(--border)"}
      />
      {hint && <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:5}}>{hint}</div>}
    </label>
  );
}

function SocialBtn({ provider, children }) {
  const icons = {
    google: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.14-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.86 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.68-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.68 2.84C6.72 7.31 9.14 5.38 12 5.38Z"/></svg>,
    github: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5Z"/></svg>,
  };
  return (
    <button style={{
      width:"100%", height:40, padding:"0 14px",
      background:"var(--bg-elev)", border:"1px solid var(--border)",
      borderRadius:8, fontSize:13, fontWeight:500, color:"var(--fg)",
      fontFamily:"inherit", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center", gap:10,
      transition:"all 120ms",
    }}
    onMouseEnter={e=>e.currentTarget.style.background="var(--bg-subtle)"}
    onMouseLeave={e=>e.currentTarget.style.background="var(--bg-elev)"}
    >
      {icons[provider]}
      <span>{children}</span>
    </button>
  );
}

function LoginPage({ setPage }) {
  return (
    <div style={{display:"flex", height:"100vh", overflow:"hidden", background:"var(--bg)"}}>
      {/* Left: form */}
      <div style={{
        width:"min(48%, 560px)", flexShrink:0,
        display:"flex", flexDirection:"column",
        padding:"40px 44px", overflowY:"auto",
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <a onClick={()=>setPage("landing")} style={{
            fontSize:12.5, color:"var(--fg-muted)", cursor:"pointer",
            display:"inline-flex", alignItems:"center", gap:6,
          }}>← Назад на главную</a>
          <a onClick={()=>setPage("register")} style={{fontSize:12.5, color:"var(--fg-muted)", cursor:"pointer"}}>
            Нет аккаунта? <span style={{color:"var(--accent)", fontWeight:500}}>Регистрация</span>
          </a>
        </div>

        <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"center", maxWidth:380, width:"100%", margin:"0 auto"}}>
          <h1 style={{fontSize:28, fontWeight:600, letterSpacing:"-0.025em", margin:0}}>С возвращением</h1>
          <p style={{fontSize:14, color:"var(--fg-muted)", margin:"6px 0 28px"}}>Войди, чтобы продолжить.</p>

          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <SocialBtn provider="google">Продолжить с Google</SocialBtn>
            <SocialBtn provider="github">Продолжить с GitHub</SocialBtn>
          </div>

          <div style={{display:"flex", alignItems:"center", gap:10, margin:"22px 0 18px", fontSize:11, color:"var(--fg-subtle)"}}>
            <span style={{flex:1, height:1, background:"var(--border)"}}/>
            <span>или email</span>
            <span style={{flex:1, height:1, background:"var(--border)"}}/>
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <AuthInput label="Электронная почта" type="email" placeholder="you@company.com" />
            <div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6}}>
                <span style={{fontSize:12, color:"var(--fg-muted)", fontWeight:500}}>Пароль</span>
                <a style={{fontSize:11.5, color:"var(--accent)", cursor:"pointer"}}>Забыл?</a>
              </div>
              <input type="password" placeholder="••••••••" style={{
                width:"100%", height:38, padding:"0 12px",
                background:"var(--bg-elev)", border:"1px solid var(--border)",
                borderRadius:8, fontSize:13.5, color:"var(--fg)",
                fontFamily:"inherit", outline:"none",
              }}/>
            </div>
            <label style={{display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"var(--fg-muted)", cursor:"pointer"}}>
              <input type="checkbox" defaultChecked style={{accentColor:"var(--accent)"}}/>
              Запомнить меня на этом устройстве
            </label>
          </div>

          <div style={{marginTop:18}}>
            <Btn variant="primary" size="lg" full onClick={()=>setPage("dashboard")}>Войти</Btn>
          </div>

          <div style={{marginTop:32, fontSize:11, color:"var(--fg-subtle)", textAlign:"center"}}>
            Продолжая, ты принимаешь <a style={{textDecoration:"underline"}}>условия</a> и <a style={{textDecoration:"underline"}}>политику конфиденциальности</a>.
          </div>
        </div>
      </div>

      <AuthBrandPanel />
    </div>
  );
}

function RegisterPage({ setPage }) {
  return (
    <div style={{display:"flex", height:"100vh", overflow:"hidden", background:"var(--bg)"}}>
      <div style={{
        width:"min(48%, 560px)", flexShrink:0,
        display:"flex", flexDirection:"column",
        padding:"40px 44px", overflowY:"auto",
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <a onClick={()=>setPage("landing")} style={{
            fontSize:12.5, color:"var(--fg-muted)", cursor:"pointer",
          }}>← На главную</a>
          <a onClick={()=>setPage("login")} style={{fontSize:12.5, color:"var(--fg-muted)", cursor:"pointer"}}>
            Уже есть аккаунт? <span style={{color:"var(--accent)", fontWeight:500}}>Войти</span>
          </a>
        </div>

        <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"center", maxWidth:380, width:"100%", margin:"0 auto"}}>
          <h1 style={{fontSize:28, fontWeight:600, letterSpacing:"-0.025em", margin:0}}>Создай аккаунт</h1>
          <p style={{fontSize:14, color:"var(--fg-muted)", margin:"6px 0 28px"}}>Начни отслеживать поиск работы за несколько минут.</p>

          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <SocialBtn provider="google">Регистрация через Google</SocialBtn>
            <SocialBtn provider="github">Регистрация через GitHub</SocialBtn>
          </div>

          <div style={{display:"flex", alignItems:"center", gap:10, margin:"22px 0 18px", fontSize:11, color:"var(--fg-subtle)"}}>
            <span style={{flex:1, height:1, background:"var(--border)"}}/>
            <span>или email</span>
            <span style={{flex:1, height:1, background:"var(--border)"}}/>
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <AuthInput label="Электронная почта" type="email" placeholder="you@company.com" />
            <AuthInput label="Пароль" type="password" placeholder="минимум 8 символов" hint="Используй буквы, цифры и хотя бы один символ." />
            <AuthInput label="Повтори пароль" type="password" placeholder="••••••••" />
          </div>

          <div style={{marginTop:18}}>
            <Btn variant="primary" size="lg" full onClick={()=>setPage("profileQuestions")}>Создать аккаунт</Btn>
          </div>

          <div style={{marginTop:14, fontSize:11, color:"var(--fg-subtle)", textAlign:"center"}}>
            Регистрируясь, ты принимаешь <a style={{textDecoration:"underline"}}>условия</a> и <a style={{textDecoration:"underline"}}>политику</a>.
          </div>
        </div>
      </div>

      <AuthBrandPanel />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT SETTINGS — top tabs
// ─────────────────────────────────────────────────────────────────────────────
function SettingsTabs({ active, setActive }) {
  const tabs = [
    { k:"profile",       l:"Профиль" },
    { k:"preferences",   l:"Предпочтения" },
    { k:"notifications", l:"Уведомления" },
    { k:"pipeline",      l:"Воронка и статусы" },
    { k:"security",      l:"Безопасность" },
    { k:"billing",       l:"Биллинг" },
    { k:"danger",        l:"Опасная зона" },
  ];
  return (
    <div style={{display:"flex", gap:2, alignItems:"flex-end", overflowX:"auto"}}>
      {tabs.map(t => (
        <a key={t.k} onClick={()=>setActive(t.k)} style={{
          padding:"10px 14px", fontSize:13, letterSpacing:"-0.01em",
          color: active===t.k ? "var(--fg)" : "var(--fg-muted)",
          fontWeight: active===t.k ? 500 : 400,
          borderBottom: active===t.k ? "2px solid var(--accent)" : "2px solid transparent",
          marginBottom:-1, cursor:"pointer", whiteSpace:"nowrap",
        }}>{t.l}</a>
      ))}
    </div>
  );
}

function FieldRow({ label, hint, children }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"minmax(180px, 240px) 1fr", gap:24,
      padding:"16px 0", borderBottom:"1px solid var(--border)",
      alignItems:"start",
    }}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:13, fontWeight:500}}>{label}</div>
        {hint && <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:4}}>{hint}</div>}
      </div>
      <div style={{minWidth:0}}>{children}</div>
    </div>
  );
}

function SwitchRow({ title, desc, on, onChange }) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, padding:"14px 0", borderBottom:"1px solid var(--border)"}}>
      <div style={{minWidth:0, flex:1}}>
        <div style={{fontSize:13, fontWeight:500}}>{title}</div>
        {desc && <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:3, lineHeight:1.5}}>{desc}</div>}
      </div>
      <button onClick={onChange} style={{
        width:36, height:20, borderRadius:99,
        background: on ? "var(--accent)" : "var(--bg-subtle)",
        border:"1px solid var(--border)",
        position:"relative", cursor:"pointer", flexShrink:0,
        transition:"background 160ms",
      }}>
        <span style={{
          position:"absolute", top:1, left: on ? 17 : 1,
          width:16, height:16, borderRadius:99,
          background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,0.18)",
          transition:"left 160ms",
        }}/>
      </button>
    </div>
  );
}

function inputStyle(){return{
  width:"100%", height:36, padding:"0 12px",
  background:"var(--bg-elev)", border:"1px solid var(--border)",
  borderRadius:7, fontSize:13, color:"var(--fg)",
  fontFamily:"inherit", outline:"none",
}}

function ProfileTab() {
  return (
    <Card>
      <SectionLabel>Профиль</SectionLabel>
      <div style={{display:"flex", alignItems:"center", gap:16, marginTop:14, paddingBottom:18, borderBottom:"1px solid var(--border)"}}>
        <div style={{
          width:64, height:64, borderRadius:99,
          background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
          color:"#fff", display:"grid", placeItems:"center",
          fontSize:22, fontWeight:600,
        }}>МК</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:14.5, fontWeight:600}}>Мария Климова</div>
          <div style={{fontSize:12, color:"var(--fg-subtle)"}}>maria@example.com · Free plan</div>
        </div>
        <Btn variant="outline" size="sm">Загрузить фото</Btn>
      </div>

      <FieldRow label="Имя">
        <input defaultValue="Мария" style={inputStyle()} />
      </FieldRow>
      <FieldRow label="Фамилия">
        <input defaultValue="Климова" style={inputStyle()} />
      </FieldRow>
      <FieldRow label="Электронная почта" hint="Используется для входа и уведомлений">
        <input defaultValue="maria@example.com" style={inputStyle()} />
      </FieldRow>
      <FieldRow label="Язык приложения" hint="Сохраняется на устройстве">
        <select style={inputStyle()}>
          <option>Русский</option>
          <option>English</option>
          <option>Deutsch</option>
        </select>
      </FieldRow>

      <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:16}}>
        <Btn variant="ghost" size="sm">Сбросить</Btn>
        <Btn variant="primary" size="sm">Сохранить</Btn>
      </div>
    </Card>
  );
}

function PreferencesTab() {
  return (
    <Card>
      <SectionLabel>Предпочтения</SectionLabel>
      <div style={{marginTop:14}}>
        <FieldRow label="Часовой пояс">
          <select style={inputStyle()}>
            <option>Europe/Berlin (UTC+01:00)</option>
            <option>Europe/Moscow (UTC+03:00)</option>
            <option>America/New York (UTC-05:00)</option>
          </select>
        </FieldRow>
        <FieldRow label="Формат даты" hint="Пример: 06.05.2026">
          <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
            {["29.01.2026","01/29/2026","2026-01-29"].map((f,i)=>(
              <label key={f} style={{
                padding:"7px 12px", borderRadius:7, fontSize:12.5,
                border:"1px solid var(--border)",
                background: i===0 ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--bg-elev)",
                color: i===0 ? "var(--fg)" : "var(--fg-muted)",
                cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8,
              }}>
                <input type="radio" name="df" defaultChecked={i===0} style={{accentColor:"var(--accent)"}}/>
                {f}
              </label>
            ))}
          </div>
        </FieldRow>
        <FieldRow label="Хранилище" hint="Где хранятся данные приложения">
          <div style={{fontSize:12.5, color:"var(--fg-muted)"}}>Облако (Firestore) · подключено</div>
        </FieldRow>
      </div>
      <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:16}}>
        <Btn variant="primary" size="sm">Сохранить</Btn>
      </div>
    </Card>
  );
}

function NotificationsTab() {
  const [n, setN] = React.useState({ apps:true, daily:true, browser:false, email:true, gcal:false });
  const tog = k => setN(s => ({...s, [k]: !s[k]}));
  return (
    <div style={{display:"grid", gap:14}}>
      <Card>
        <SectionLabel>Напоминания по заявкам</SectionLabel>
        <p style={{fontSize:12.5, color:"var(--fg-muted)", margin:"4px 0 12px"}}>Настрой звонки, follow-up и задачи по заявкам.</p>
        <SwitchRow title="Включить напоминания по заявкам" desc="Используются дата и время следующего действия внутри заявки." on={n.apps} onChange={()=>tog("apps")} />
        <FieldRow label="Напоминать заранее" hint="Время до события">
          <select style={inputStyle()}>
            <option>В момент события</option>
            <option>За 15 минут</option>
            <option selected>За 1 час</option>
            <option>За 1 день</option>
          </select>
        </FieldRow>
        <SwitchRow title="План на день" desc="Подготовка утренней сводки по запланированным действиям." on={n.daily} onChange={()=>tog("daily")} />
        {n.daily && (
          <FieldRow label="Время сводки">
            <input type="time" defaultValue="09:00" style={inputStyle()} />
          </FieldRow>
        )}
      </Card>

      <Card>
        <SectionLabel>Каналы доставки</SectionLabel>
        <div style={{marginTop:8}}>
          <SwitchRow title="Браузер" desc="Локальные уведомления в браузере, если они поддерживаются." on={n.browser} onChange={()=>tog("browser")} />
          <SwitchRow title="Email" desc="Сохрани настройку для будущих email-напоминаний." on={n.email} onChange={()=>tog("email")} />
          <SwitchRow title="Google Calendar" desc="Синхронизация запланированных действий с календарём." on={n.gcal} onChange={()=>tog("gcal")} />
        </div>
        {!n.gcal && (
          <div style={{
            marginTop:14, padding:"10px 12px",
            background:"color-mix(in oklab, var(--accent-2) 8%, transparent)",
            border:"1px solid color-mix(in oklab, var(--accent-2) 22%, transparent)",
            borderRadius:8, fontSize:12, color:"var(--fg-muted)",
          }}>
            Подключи Google Calendar, чтобы события синхронизировались автоматически.
            <a style={{color:"var(--accent-2)", marginLeft:8, fontWeight:500}}>Подключить →</a>
          </div>
        )}
      </Card>
    </div>
  );
}

function PipelineTab() {
  const stages = [
    { l:"Сохранено",   c:1, color:"var(--fg-subtle)" },
    { l:"Запланировано",c:0, color:"var(--fg-subtle)" },
    { l:"Отправлено",  c:2, color:"var(--accent-2)" },
    { l:"Просмотрено", c:1, color:"var(--accent-2)" },
    { l:"Интервью",    c:3, color:"var(--accent)" },
    { l:"Тестовое",    c:1, color:"var(--accent)" },
    { l:"Предложение", c:1, color:"#d97706" },
    { l:"Отказ",       c:1, color:"#dc2626" },
  ];
  return (
    <Card>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14}}>
        <div>
          <SectionLabel>Этапы воронки</SectionLabel>
          <p style={{fontSize:12.5, color:"var(--fg-muted)", margin:"4px 0 0"}}>Перетаскивай этапы, чтобы изменить порядок. Добавляй подстатусы для уточнения.</p>
        </div>
        <Btn variant="outline" size="sm" icon={Icon.plus}>Добавить этап</Btn>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:14}}>
        {stages.map((s,i)=>(
          <div key={s.l} style={{
            padding:"12px 14px", borderRadius:8,
            background:"var(--bg-subtle)", border:"1px solid var(--border)",
            display:"flex", alignItems:"center", gap:12, cursor:"grab",
          }}>
            <span style={{color:"var(--fg-subtle)", fontSize:14, fontFamily:"var(--font-mono)"}}>⋮⋮</span>
            <span style={{width:8, height:8, borderRadius:2, background:s.color}}/>
            <span style={{fontSize:13, fontWeight:500, flex:1}}>{s.l}</span>
            <span style={{fontSize:11, color:"var(--fg-subtle)"}}>{s.c} подстатуса</span>
            <button style={{background:"transparent", border:"none", color:"var(--fg-subtle)", cursor:"pointer", fontSize:14, padding:4}}>···</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SecurityTab() {
  return (
    <div style={{display:"grid", gap:14}}>
      <Card>
        <SectionLabel>Пароль</SectionLabel>
        <div style={{marginTop:14}}>
          <FieldRow label="Текущий пароль">
            <input type="password" placeholder="••••••••" style={inputStyle()} />
          </FieldRow>
          <FieldRow label="Новый пароль" hint="Минимум 8 символов">
            <input type="password" placeholder="новый пароль" style={inputStyle()} />
          </FieldRow>
          <FieldRow label="Повтори пароль">
            <input type="password" placeholder="••••••••" style={inputStyle()} />
          </FieldRow>
        </div>
        <div style={{display:"flex", justifyContent:"flex-end", marginTop:16}}>
          <Btn variant="primary" size="sm">Обновить пароль</Btn>
        </div>
      </Card>

      <Card>
        <SectionLabel>Сессии</SectionLabel>
        <p style={{fontSize:12.5, color:"var(--fg-muted)", margin:"4px 0 12px"}}>Устройства, на которых открыт аккаунт.</p>
        {[
          { d:"MacBook Pro · Chrome",    loc:"Berlin, DE", last:"сейчас", current:true },
          { d:"iPhone 15 · Safari",       loc:"Berlin, DE", last:"2 ч назад" },
          { d:"Windows · Firefox",        loc:"Hamburg, DE", last:"3 дня назад" },
        ].map((s,i)=>(
          <div key={i} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center", gap:12,
            padding:"12px 0", borderBottom: i<2 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{minWidth:0, flex:1}}>
              <div style={{fontSize:13, fontWeight:500}}>{s.d} {s.current && <Pill tone="success">Текущая</Pill>}</div>
              <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>{s.loc} · {s.last}</div>
            </div>
            {!s.current && <Btn variant="outline" size="sm">Завершить</Btn>}
          </div>
        ))}
      </Card>
    </div>
  );
}

function BillingTab() {
  return (
    <div style={{display:"grid", gap:14}}>
      <Card>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
          <div>
            <SectionLabel>Текущий план</SectionLabel>
            <div style={{fontSize:22, fontWeight:600, marginTop:8, letterSpacing:"-0.02em"}}>Free</div>
            <div style={{fontSize:12.5, color:"var(--fg-muted)", marginTop:4}}>До 3 поисковых циклов · базовая аналитика</div>
          </div>
          <Btn variant="primary" size="md">Обновить до Pro</Btn>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginTop:18, paddingTop:18, borderTop:"1px solid var(--border)"}}>
          {[
            {l:"Использовано циклов", v:"3 / 3"},
            {l:"Активных матчей",     v:"24"},
            {l:"Резюме в банке",      v:"2"},
            {l:"Истории — 30 дней",   v:"Free"},
          ].map(s=>(
            <div key={s.l}>
              <div style={{fontSize:11, color:"var(--fg-subtle)", textTransform:"uppercase", letterSpacing:"0.06em"}}>{s.l}</div>
              <div style={{fontSize:15, fontWeight:600, marginTop:4}}>{s.v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>История платежей</SectionLabel>
        <div style={{marginTop:14, fontSize:12.5, color:"var(--fg-muted)", padding:"24px 0", textAlign:"center"}}>
          Платежей пока нет. После апгрейда сюда попадут счета и квитанции.
        </div>
      </Card>
    </div>
  );
}

function DangerTab() {
  return (
    <Card style={{borderColor:"color-mix(in oklab, #dc2626 30%, var(--border))"}}>
      <SectionLabel><span style={{color:"#dc2626"}}>Опасная зона</span></SectionLabel>
      <p style={{fontSize:12.5, color:"var(--fg-muted)", margin:"4px 0 12px"}}>Эти действия необратимы. Будь осторожен.</p>

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--border)"}}>
        <div>
          <div style={{fontSize:13, fontWeight:500}}>Экспортировать данные</div>
          <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>Скачай все циклы, заявки и контакты в JSON.</div>
        </div>
        <Btn variant="outline" size="sm">Скачать .json</Btn>
      </div>

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--border)"}}>
        <div>
          <div style={{fontSize:13, fontWeight:500}}>Очистить все заявки</div>
          <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>Удалит все заявки. Циклы и настройки останутся.</div>
        </div>
        <button style={{padding:"7px 14px", border:"1px solid #dc2626", color:"#dc2626", background:"transparent", borderRadius:7, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"inherit"}}>Очистить</button>
      </div>

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0"}}>
        <div>
          <div style={{fontSize:13, fontWeight:500, color:"#dc2626"}}>Удалить аккаунт</div>
          <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginTop:2}}>Все данные будут безвозвратно удалены через 30 дней.</div>
        </div>
        <button style={{padding:"7px 14px", border:"none", color:"#fff", background:"#dc2626", borderRadius:7, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"inherit"}}>Удалить аккаунт</button>
      </div>
    </Card>
  );
}

function PageHeaderLite({ crumb, title, subtitle, actions }) {
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

function AccountSettingsPage() {
  const [tab, setTab] = React.useState("profile");
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden"}}>
      <PageHeaderLite
        crumb={["Loopboard","Аккаунт","Настройки"]}
        title="Настройки аккаунта"
        subtitle="Профиль, уведомления, безопасность и биллинг."
      />
      <div style={{padding:"6px 28px 0", borderBottom:"1px solid var(--border)", background:"var(--bg)"}}>
        <SettingsTabs active={tab} setActive={setTab} />
      </div>
      <div style={{flex:1, overflowY:"auto", padding:"22px 28px 48px", background:"var(--bg)"}}>
        <div style={{maxWidth:920}}>
          {tab==="profile"       && <ProfileTab />}
          {tab==="preferences"   && <PreferencesTab />}
          {tab==="notifications" && <NotificationsTab />}
          {tab==="pipeline"      && <PipelineTab />}
          {tab==="security"      && <SecurityTab />}
          {tab==="billing"       && <BillingTab />}
          {tab==="danger"        && <DangerTab />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE QUESTIONS — multi-step onboarding wizard
// ─────────────────────────────────────────────────────────────────────────────
const PQ_STEPS = [
  { k:"role",      l:"Кто ты" },
  { k:"location",  l:"Где ищешь" },
  { k:"prefs",     l:"Предпочтения" },
  { k:"experience",l:"Опыт" },
  { k:"goals",     l:"Цели" },
];

function ChipChoice({ value, options, multi, onChange }) {
  const isSel = (o) => multi ? (value||[]).includes(o) : value===o;
  const toggle = (o) => {
    if (multi) {
      const cur = value || [];
      onChange(cur.includes(o) ? cur.filter(x=>x!==o) : [...cur, o]);
    } else onChange(o);
  };
  return (
    <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
      {options.map(o=>(
        <button key={o} onClick={()=>toggle(o)} style={{
          padding:"10px 14px", borderRadius:99,
          border: isSel(o) ? "1px solid var(--accent)" : "1px solid var(--border)",
          background: isSel(o) ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--bg-elev)",
          color: isSel(o) ? "var(--fg)" : "var(--fg-muted)",
          fontWeight: isSel(o) ? 500 : 400, fontSize:13,
          cursor:"pointer", fontFamily:"inherit",
          transition:"all 120ms",
        }}>{o}</button>
      ))}
    </div>
  );
}

function ProfileQuestionsPage({ setPage }) {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    role:"", level:"", locations:[], modes:[], lang:"", years:"", goals:[],
  });
  const upd = (k,v) => setData(d=>({...d, [k]:v}));
  const cur = PQ_STEPS[step];
  const pct = Math.round(((step+1)/PQ_STEPS.length)*100);
  const last = step===PQ_STEPS.length-1;

  return (
    <div style={{display:"flex", height:"100vh", overflow:"hidden", background:"var(--bg)", flexDirection:"column"}}>
      {/* Top bar */}
      <div style={{
        padding:"14px 28px", borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:16,
      }}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{
            width:24, height:24, borderRadius:6,
            background:"var(--fg)", color:"var(--bg)",
            display:"grid", placeItems:"center",
            fontSize:13, fontWeight:700, letterSpacing:"-0.04em",
          }}>L</div>
          <span style={{fontSize:14, fontWeight:600, letterSpacing:"-0.02em"}}>Loopboard</span>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:14, flex:1, maxWidth:480, margin:"0 24px"}}>
          <span style={{fontSize:11.5, color:"var(--fg-subtle)", fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap"}}>
            Шаг {step+1} из {PQ_STEPS.length}
          </span>
          <div style={{flex:1, height:4, background:"var(--bg-subtle)", borderRadius:99, overflow:"hidden"}}>
            <div style={{height:"100%", width:`${pct}%`, background:"var(--accent)", transition:"width 240ms"}}/>
          </div>
        </div>
        <a onClick={()=>setPage("dashboard")} style={{fontSize:12.5, color:"var(--fg-subtle)", cursor:"pointer"}}>
          Пропустить
        </a>
      </div>

      <div style={{flex:1, overflowY:"auto", display:"flex", justifyContent:"center"}}>
        <div style={{width:"100%", maxWidth:680, padding:"40px 28px 80px"}}>
          {/* Step indicator */}
          <div style={{display:"flex", gap:6, marginBottom:28, flexWrap:"wrap"}}>
            {PQ_STEPS.map((s,i)=>(
              <button key={s.k} onClick={()=>setStep(i)} style={{
                padding:"5px 10px", borderRadius:99, fontSize:11, fontWeight:500,
                border:"1px solid var(--border)",
                background: i<=step ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--bg-elev)",
                color: i<=step ? "var(--fg)" : "var(--fg-subtle)",
                cursor:"pointer", fontFamily:"inherit",
              }}>{i+1}. {s.l}</button>
            ))}
          </div>

          {/* Step 1: role */}
          {cur.k === "role" && (
            <div>
              <h2 style={{fontSize:26, fontWeight:600, letterSpacing:"-0.025em", margin:0}}>Расскажи о себе</h2>
              <p style={{fontSize:14, color:"var(--fg-muted)", margin:"6px 0 28px"}}>Это поможет точнее подбирать вакансии.</p>

              <div style={{display:"flex", flexDirection:"column", gap:24}}>
                <div>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:10}}>Какая у тебя роль?</div>
                  <ChipChoice
                    value={data.role}
                    onChange={v=>upd("role",v)}
                    options={["Frontend","Backend","Full-stack","Mobile","Data / ML","DevOps","Дизайн","Продукт","Менеджмент","Другое"]}
                  />
                </div>
                <div>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:10}}>Уровень</div>
                  <ChipChoice
                    value={data.level}
                    onChange={v=>upd("level",v)}
                    options={["Стажёр","Junior","Middle","Senior","Lead","Staff+"]}
                  />
                </div>
              </div>
            </div>
          )}

          {cur.k === "location" && (
            <div>
              <h2 style={{fontSize:26, fontWeight:600, letterSpacing:"-0.025em", margin:0}}>Где ищешь работу?</h2>
              <p style={{fontSize:14, color:"var(--fg-muted)", margin:"6px 0 28px"}}>Можно выбрать несколько городов или регионов.</p>

              <div style={{display:"flex", flexDirection:"column", gap:24}}>
                <div>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:10}}>Локации</div>
                  <ChipChoice
                    multi value={data.locations}
                    onChange={v=>upd("locations",v)}
                    options={["Berlin","Munich","Hamburg","Frankfurt","Vienna","Zürich","Amsterdam","London","Remote EU","Remote Global"]}
                  />
                </div>
                <div>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:10}}>Формат работы</div>
                  <ChipChoice
                    multi value={data.modes}
                    onChange={v=>upd("modes",v)}
                    options={["В офисе","Гибрид","Удалённо","Только удалённо"]}
                  />
                </div>
              </div>
            </div>
          )}

          {cur.k === "prefs" && (
            <div>
              <h2 style={{fontSize:26, fontWeight:600, letterSpacing:"-0.025em", margin:0}}>Предпочтения</h2>
              <p style={{fontSize:14, color:"var(--fg-muted)", margin:"6px 0 28px"}}>Дополнительные параметры для поиска.</p>

              <div style={{display:"flex", flexDirection:"column", gap:24}}>
                <div>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:10}}>Язык работы</div>
                  <ChipChoice
                    value={data.lang}
                    onChange={v=>upd("lang",v)}
                    options={["Английский","Немецкий","Английский + Немецкий","Любой"]}
                  />
                </div>
                <div>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:10}}>Тип занятости</div>
                  <ChipChoice
                    multi value={data.types||["Полная"]}
                    onChange={v=>upd("types",v)}
                    options={["Полная","Частичная","Контракт","Стажировка","Ausbildung"]}
                  />
                </div>
              </div>
            </div>
          )}

          {cur.k === "experience" && (
            <div>
              <h2 style={{fontSize:26, fontWeight:600, letterSpacing:"-0.025em", margin:0}}>Опыт</h2>
              <p style={{fontSize:14, color:"var(--fg-muted)", margin:"6px 0 28px"}}>Поможет в оценке совпадения с вакансиями.</p>

              <div style={{display:"flex", flexDirection:"column", gap:24}}>
                <div>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:10}}>Сколько лет коммерческого опыта?</div>
                  <ChipChoice
                    value={data.years}
                    onChange={v=>upd("years",v)}
                    options={["< 1","1–2","3–5","6–10","10+"]}
                  />
                </div>
                <div>
                  <div style={{fontSize:13, fontWeight:500, marginBottom:6}}>Ключевые технологии и инструменты</div>
                  <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginBottom:10}}>Через запятую — будут использованы для матчинга.</div>
                  <input placeholder="React, TypeScript, Node, PostgreSQL" style={{
                    width:"100%", height:40, padding:"0 14px",
                    background:"var(--bg-elev)", border:"1px solid var(--border)",
                    borderRadius:8, fontSize:13.5, color:"var(--fg)",
                    fontFamily:"inherit", outline:"none",
                  }}/>
                </div>
              </div>
            </div>
          )}

          {cur.k === "goals" && (
            <div>
              <h2 style={{fontSize:26, fontWeight:600, letterSpacing:"-0.025em", margin:0}}>Что для тебя важно?</h2>
              <p style={{fontSize:14, color:"var(--fg-muted)", margin:"6px 0 28px"}}>Выбери всё, что подходит — поможет приоритизировать вакансии.</p>

              <ChipChoice
                multi value={data.goals}
                onChange={v=>upd("goals",v)}
                options={[
                  "Высокая зарплата","Удалёнка","Стабильность","Рост","Интересная команда",
                  "Современный стек","Work-life balance","Smaller team","Большая компания","Стартап","Релокация","Опционы",
                ]}
              />

              <div style={{
                marginTop:32, padding:"16px 18px",
                background:"color-mix(in oklab, var(--accent) 8%, transparent)",
                border:"1px solid color-mix(in oklab, var(--accent) 22%, transparent)",
                borderRadius:10,
                display:"flex", gap:12, alignItems:"flex-start",
              }}>
                <span style={{color:"var(--accent)", marginTop:1}}>{Icon.spark}</span>
                <div>
                  <div style={{fontSize:13, fontWeight:500}}>Готово!</div>
                  <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:3}}>
                    Создадим первый поисковый цикл на основе твоих ответов. Ты сможешь изменить параметры в любой момент.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding:"14px 28px", borderTop:"1px solid var(--border)", background:"var(--bg)",
        display:"flex", justifyContent:"space-between", alignItems:"center", gap:12,
      }}>
        <Btn variant="ghost" size="md" onClick={()=>step>0 && setStep(step-1)}>
          {step===0 ? "Отмена" : "← Назад"}
        </Btn>
        <div style={{display:"flex", gap:8}}>
          {!last && <Btn variant="ghost" size="md" onClick={()=>setPage("dashboard")}>Пропустить шаг</Btn>}
          <Btn
            variant="primary" size="md"
            onClick={()=> last ? setPage("dashboard") : setStep(step+1)}
            iconRight={!last && Icon.arrow}
          >
            {last ? "Создать первый цикл" : "Далее"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

window.GroupBPages = { LoginPage, RegisterPage, AccountSettingsPage, ProfileQuestionsPage };
