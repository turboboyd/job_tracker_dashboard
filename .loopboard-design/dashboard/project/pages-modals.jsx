/* Modals showcase — examples of dialogs / overlays */
const { Card: CardMd, Pill: PillMd, Btn: BtnMd, SectionLabel: SLMd, Icon: IconMd } = window.UI;

// ─────────────────────────────────────────────────────────────────────────────
// Faux blurred dashboard background
// ─────────────────────────────────────────────────────────────────────────────
function FauxBg() {
  return (
    <div aria-hidden style={{
      position:"absolute", inset:0, zIndex:0,
      opacity:0.55, filter:"blur(2px) saturate(0.85)",
      pointerEvents:"none",
      backgroundImage:`
        linear-gradient(to right, var(--border) 1px, transparent 1px),
        linear-gradient(to bottom, var(--border) 1px, transparent 1px),
        radial-gradient(at 20% 30%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 50%),
        radial-gradient(at 80% 70%, color-mix(in oklab, var(--accent-2) 6%, transparent), transparent 50%)
      `,
      backgroundSize:"40px 40px, 40px 40px, 100% 100%, 100% 100%",
      backgroundColor:"var(--bg)",
    }}/>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable shell
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ width=560, children, label, sub, danger }) {
  return (
    <div style={{position:"relative", display:"flex", flexDirection:"column", alignItems:"center", padding:"18px 22px"}}>
      <div style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"3px 9px", borderRadius:99,
        fontSize:11, fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase",
        background:"var(--bg-subtle)", color:"var(--fg-subtle)",
        border:"1px solid var(--border)", marginBottom:10,
      }}>{label}</div>
      {sub && <div style={{fontSize:11.5, color:"var(--fg-subtle)", marginBottom:14, textAlign:"center"}}>{sub}</div>}

      <div style={{
        width:"min(100%, " + width + "px)",
        background:"var(--bg-elev)",
        border:"1px solid " + (danger ? "color-mix(in oklab, rgb(220,38,38) 35%, var(--border))" : "var(--border)"),
        borderRadius:14,
        boxShadow:"0 24px 64px -16px rgba(0,0,0,0.16), 0 2px 8px -2px rgba(0,0,0,0.08)",
        overflow:"hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose, badge }) {
  return (
    <div style={{padding:"18px 22px 14px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14}}>
      <div style={{minWidth:0}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom: subtitle ? 4 : 0}}>
          <span style={{fontSize:16, fontWeight:600, letterSpacing:"-0.015em"}}>{title}</span>
          {badge}
        </div>
        {subtitle && <div style={{fontSize:12.5, color:"var(--fg-muted)", lineHeight:1.5}}>{subtitle}</div>}
      </div>
      <button style={{
        width:28, height:28, borderRadius:6,
        background:"transparent", border:"1px solid var(--border)",
        cursor:"pointer", color:"var(--fg-muted)", fontSize:14, lineHeight:1,
        flexShrink:0, fontFamily:"inherit",
      }}>✕</button>
    </div>
  );
}

function ModalBody({ children, padding=22 }) {
  return <div style={{padding}}>{children}</div>;
}

function ModalFooter({ children }) {
  return (
    <div style={{padding:"14px 22px", borderTop:"1px solid var(--border)", background:"var(--bg-subtle)", display:"flex", justifyContent:"flex-end", gap:8, flexWrap:"wrap"}}>
      {children}
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <label style={{display:"block"}}>
      <div style={{fontSize:12, color:"var(--fg-muted)", marginBottom:6, fontWeight:500}}>{label}</div>
      {children}
      {hint && <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:5}}>{hint}</div>}
    </label>
  );
}

const modalInput = {
  width:"100%", height:36, padding:"0 12px",
  background:"var(--bg)", border:"1px solid var(--border)",
  borderRadius:7, fontSize:13, color:"var(--fg)",
  fontFamily:"inherit", outline:"none",
};
const modalTextarea = {
  ...modalInput, height:80, padding:"10px 12px", resize:"vertical", lineHeight:1.5,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. New Application
// ─────────────────────────────────────────────────────────────────────────────
function ModalNewApplication() {
  return (
    <Modal label="Создание заявки" sub="Из заголовка кнопки «Новая заявка»">
      <ModalHeader
        title="Новая заявка"
        subtitle="Заполни главное — остальное добавишь позже на странице заявки."
      />
      <ModalBody>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
          <FormField label="Компания"><input style={modalInput} defaultValue="Notion" /></FormField>
          <FormField label="Должность"><input style={modalInput} defaultValue="Senior Product Engineer" /></FormField>
          <FormField label="Ссылка на вакансию" hint="Можно вставлять без https://"><input style={modalInput} defaultValue="notion.so/careers/senior-product-engineer" /></FormField>
          <FormField label="Источник">
            <select style={modalInput}>
              <option>LinkedIn</option><option>StepStone</option><option>Indeed</option><option>XING</option><option>Сайт компании</option>
            </select>
          </FormField>
        </div>
        <div style={{marginTop:14}}>
          <FormField label="Описание (необязательно)" hint="Вставь текст вакансии — это улучшит матч-скор и подсказки.">
            <textarea style={modalTextarea} placeholder="We're looking for a product-minded engineer to join our editor team…"/>
          </FormField>
        </div>

        <div style={{
          marginTop:18, padding:"12px 14px",
          background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:8,
          fontSize:12, color:"var(--fg-muted)", display:"flex", gap:10, alignItems:"flex-start",
        }}>
          <span style={{color:"var(--accent)", marginTop:1}}>{IconMd.spark}</span>
          <div>
            <strong style={{color:"var(--fg)", fontWeight:500}}>AI разберёт описание</strong> — заполнит локацию, формат, стек и оценит match-скор автоматически.
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <BtnMd variant="ghost" size="md">Отмена</BtnMd>
        <BtnMd variant="outline" size="md">Создать и закрыть</BtnMd>
        <BtnMd variant="primary" size="md">Создать и открыть</BtnMd>
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. New Loop (search scenario)
// ─────────────────────────────────────────────────────────────────────────────
function ModalNewLoop() {
  return (
    <Modal width={640} label="Создание поискового цикла" sub="Сценарий поиска · фильтры один раз, ссылки готовы">
      <ModalHeader
        title="Новый цикл поиска"
        subtitle="Задай параметры один раз — ссылки для платформ соберутся автоматически."
      />
      <ModalBody>
        <FormField label="Название цикла" hint="Чтобы быстро узнать его в списке">
          <input style={modalInput} defaultValue="Frontend EU" />
        </FormField>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:14}}>
          <FormField label="Роль / должность"><input style={modalInput} defaultValue="Frontend Engineer" /></FormField>
          <FormField label="Уровень">
            <select style={modalInput}>
              <option>Любой</option><option>Junior</option><option selected>Middle / Senior</option><option>Senior+</option>
            </select>
          </FormField>
          <FormField label="Локация"><input style={modalInput} defaultValue="Berlin, Frankfurt, Remote EU" /></FormField>
          <FormField label="Радиус">
            <select style={modalInput}>
              <option>В городе</option><option>15 км</option><option selected>30 км</option><option>50 км</option>
            </select>
          </FormField>
        </div>

        <div style={{marginTop:16}}>
          <SLMd>Источники</SLMd>
          <div style={{display:"flex", flexWrap:"wrap", gap:6, marginTop:8}}>
            {[
              {l:"LinkedIn", on:true},
              {l:"StepStone", on:true},
              {l:"Indeed", on:true},
              {l:"XING", on:true},
              {l:"Glassdoor", on:false},
              {l:"AngelList", on:false},
              {l:"HN Hiring", on:true},
            ].map(s=>(
              <label key={s.l} style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"6px 12px", borderRadius:99, cursor:"pointer",
                fontSize:12.5, fontWeight:500,
                background: s.on ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--bg)",
                border:"1px solid " + (s.on ? "color-mix(in oklab, var(--accent) 35%, var(--border))" : "var(--border)"),
                color: s.on ? "var(--fg)" : "var(--fg-muted)",
              }}>
                <input type="checkbox" defaultChecked={s.on} style={{accentColor:"var(--accent)"}}/>
                {s.l}
              </label>
            ))}
          </div>
        </div>

        <details style={{marginTop:18}}>
          <summary style={{fontSize:12.5, color:"var(--fg-muted)", cursor:"pointer", fontWeight:500}}>+ Расширенные фильтры</summary>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:14}}>
            <FormField label="Формат работы"><input style={modalInput} defaultValue="Hybrid, Remote" /></FormField>
            <FormField label="Язык"><input style={modalInput} defaultValue="de / en" /></FormField>
            <FormField label="Включить ключевые слова"><input style={modalInput} defaultValue="react typescript next" /></FormField>
            <FormField label="Исключить"><input style={modalInput} defaultValue="senior lead manager" /></FormField>
          </div>
        </details>
      </ModalBody>
      <ModalFooter>
        <BtnMd variant="ghost" size="md">Отмена</BtnMd>
        <BtnMd variant="outline" size="md">Сохранить как черновик</BtnMd>
        <BtnMd variant="primary" size="md" icon={IconMd.loop}>Создать и запустить</BtnMd>
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Delete confirmation
// ─────────────────────────────────────────────────────────────────────────────
function ModalDelete() {
  return (
    <Modal width={460} danger label="Подтверждение опасного действия" sub="Используется для удаления заявок, циклов, контактов">
      <div style={{padding:"22px 22px 18px", display:"flex", gap:16, alignItems:"flex-start"}}>
        <div style={{
          width:40, height:40, borderRadius:8, flexShrink:0,
          background:"color-mix(in oklab, rgb(220,38,38) 12%, transparent)",
          color:"rgb(220,38,38)", display:"grid", placeItems:"center",
          fontSize:18, fontWeight:700,
        }}>!</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:15, fontWeight:600, letterSpacing:"-0.015em", marginBottom:6}}>
            Удалить заявку «Notion · Senior PE»?
          </div>
          <div style={{fontSize:13, lineHeight:1.55, color:"var(--fg-muted)"}}>
            Это удалит карточку заявки, все заметки, файлы и историю событий. Связанные контакты останутся.
            <strong style={{color:"var(--fg)", fontWeight:500}}> Действие необратимо.</strong>
          </div>
        </div>
      </div>
      <div style={{padding:"0 22px 18px"}}>
        <div style={{
          padding:"10px 12px", borderRadius:7,
          background:"var(--bg-subtle)", border:"1px solid var(--border)",
          fontSize:11.5, color:"var(--fg-muted)", lineHeight:1.5,
        }}>
          Подсказка: вместо удаления заявку можно <a style={{color:"var(--accent)", borderBottom:"1px solid currentColor"}}>архивировать</a> — все данные сохранятся, но она исчезнет из активного списка.
        </div>
      </div>
      <div style={{padding:"14px 22px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"flex-end", gap:8, alignItems:"center"}}>
        <label style={{display:"inline-flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-muted)", marginRight:"auto", cursor:"pointer"}}>
          <input type="checkbox" style={{accentColor:"rgb(220,38,38)"}}/>
          Больше не спрашивать
        </label>
        <BtnMd variant="ghost" size="md">Отмена</BtnMd>
        <button style={{
          height:36, padding:"0 14px", borderRadius:8,
          background:"rgb(220,38,38)", color:"#fff", border:"none",
          fontSize:13.5, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
        }}>Удалить</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Loops filter (dashboard scope)
// ─────────────────────────────────────────────────────────────────────────────
function ModalLoopsFilter() {
  return (
    <Modal width={520} label="Фильтр на дашборде" sub="Какие циклы учитывать в статистике обзора">
      <ModalHeader
        title="Поисковые циклы для обзора"
        subtitle="Выбери, какие циклы учитывать в статистике и списке последних заявок."
      />
      <ModalBody padding={18}>
        <div style={{display:"flex", gap:6, marginBottom:14, padding:2, background:"var(--bg-subtle)", borderRadius:7, border:"1px solid var(--border)"}}>
          <a style={{flex:1, padding:"6px 12px", textAlign:"center", fontSize:12.5, borderRadius:5, background:"var(--bg-elev)", border:"1px solid var(--border)", fontWeight:500, cursor:"pointer"}}>Только выбранные</a>
          <a style={{flex:1, padding:"6px 12px", textAlign:"center", fontSize:12.5, borderRadius:5, color:"var(--fg-subtle)", cursor:"pointer"}}>Все циклы</a>
        </div>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <span style={{fontSize:11.5, color:"var(--fg-subtle)"}}>Выбрано: 2 из 4</span>
          <div style={{display:"flex", gap:10, fontSize:11.5}}>
            <a style={{color:"var(--accent)", cursor:"pointer"}}>Выбрать все</a>
            <a style={{color:"var(--fg-subtle)", cursor:"pointer"}}>Очистить</a>
          </div>
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:1, border:"1px solid var(--border)", borderRadius:8, overflow:"hidden"}}>
          {[
            { l:"Frontend EU",          on:true,  matches:24, applied:14 },
            { l:"Backend Remote",       on:true,  matches:18, applied:6 },
            { l:"Senior React",         on:false, matches:12, applied:3 },
            { l:"Engineering Manager",  on:false, matches:5,  applied:1, paused:true },
          ].map((l,i,arr)=>(
            <label key={l.l} style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
              borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none",
              background: l.on ? "var(--bg-subtle)" : "var(--bg-elev)",
              cursor:"pointer",
            }}>
              <input type="checkbox" defaultChecked={l.on} style={{accentColor:"var(--accent)"}}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:13, fontWeight:500}}>{l.l}</span>
                  {l.paused && <PillMd tone="neutral">Пауза</PillMd>}
                </div>
                <div style={{fontSize:11, color:"var(--fg-subtle)", marginTop:2}}>
                  {l.matches} матчей · {l.applied} откликов
                </div>
              </div>
            </label>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <BtnMd variant="ghost" size="md">Отмена</BtnMd>
        <BtnMd variant="primary" size="md">Применить</BtnMd>
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Job quick-view (from matches)
// ─────────────────────────────────────────────────────────────────────────────
function ModalJobQuickView() {
  return (
    <Modal width={620} label="Быстрый просмотр вакансии" sub="Открывается при клике на матч">
      <div style={{padding:"22px 22px 0"}}>
        <div style={{display:"flex", gap:14, alignItems:"flex-start", marginBottom:14}}>
          <div style={{
            width:48, height:48, borderRadius:8, flexShrink:0,
            background:"#000", color:"#fff",
            display:"grid", placeItems:"center", fontSize:20, fontWeight:700, letterSpacing:"-0.04em",
          }}>N</div>
          <div style={{minWidth:0, flex:1}}>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap"}}>
              <PillMd tone="accent">★ Топ-матч</PillMd>
              <span style={{
                fontSize:10.5, padding:"2px 7px", borderRadius:99,
                background:"var(--bg-subtle)", border:"1px solid var(--border)", color:"var(--fg-muted)",
              }}>LinkedIn · 2 ч назад</span>
            </div>
            <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.02em"}}>Senior Product Engineer</div>
            <div style={{fontSize:13, color:"var(--fg-muted)", marginTop:2}}>Notion · Munich (Hybrid) · €95–115K + equity</div>
          </div>
          <button style={{
            width:28, height:28, borderRadius:6,
            background:"transparent", border:"1px solid var(--border)",
            cursor:"pointer", color:"var(--fg-muted)", fontSize:14, lineHeight:1, fontFamily:"inherit",
          }}>✕</button>
        </div>
      </div>

      <div style={{padding:"0 22px"}}>
        <div style={{
          padding:"12px 14px", borderRadius:8, marginBottom:14,
          background:"linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, var(--bg-subtle)), var(--bg-subtle))",
          border:"1px solid color-mix(in oklab, var(--accent) 25%, var(--border))",
          display:"flex", alignItems:"center", gap:14,
        }}>
          <div style={{textAlign:"center", flexShrink:0}}>
            <div style={{fontSize:28, fontWeight:600, color:"var(--accent)", letterSpacing:"-0.04em", lineHeight:1, fontVariantNumeric:"tabular-nums"}}>94</div>
            <div style={{fontSize:10, color:"var(--fg-subtle)", marginTop:2}}>матч</div>
          </div>
          <div style={{minWidth:0, flex:1, fontSize:12.5, lineHeight:1.55, color:"var(--fg-muted)"}}>
            <strong style={{color:"var(--fg)", fontWeight:500}}>Сильное совпадение.</strong> Полное попадание по основному стеку (React, TS, Y.js), команда нужного размера, локация в твоих предпочтениях.
          </div>
        </div>

        <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:14}}>
          {["React","TypeScript","Y.js","CRDT","ProseMirror"].map(t=>(
            <PillMd key={t} tone="neutral">{t}</PillMd>
          ))}
        </div>

        <div style={{fontSize:13, lineHeight:1.6, color:"var(--fg-muted)", marginBottom:14, maxHeight:120, overflow:"hidden", position:"relative"}}>
          Команда редактора (9 человек) ищет инженера на real-time коллаборацию и производительность UI на больших документах. Hybrid 2/3 — обязательно вторник + ещё один день в офисе Munich. Релокация спонсируется, виза BlueCard ~3 месяца.
          <div style={{position:"absolute", bottom:0, left:0, right:0, height:30, background:"linear-gradient(transparent, var(--bg-elev))"}}/>
        </div>
        <a style={{fontSize:12, color:"var(--accent)", cursor:"pointer", fontWeight:500}}>Показать полностью →</a>
      </div>

      <div style={{padding:"14px 22px", borderTop:"1px solid var(--border)", background:"var(--bg-subtle)", display:"flex", justifyContent:"space-between", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:14}}>
        <div style={{display:"flex", gap:8}}>
          <BtnMd variant="ghost" size="sm">Скрыть</BtnMd>
          <BtnMd variant="ghost" size="sm" icon={IconMd.arrowUR}>На LinkedIn</BtnMd>
        </div>
        <div style={{display:"flex", gap:8}}>
          <BtnMd variant="outline" size="sm" icon={IconMd.bookmark}>Сохранить</BtnMd>
          <BtnMd variant="primary" size="sm">Откликнуться</BtnMd>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Reminder / follow-up
// ─────────────────────────────────────────────────────────────────────────────
function ModalReminder() {
  return (
    <Modal width={460} label="Напоминание" sub="Создание follow-up или задачи по заявке">
      <ModalHeader
        title="Напомнить о Notion · Senior PE"
        subtitle="Создастся событие в календаре и в плане заявок."
      />
      <ModalBody>
        <FormField label="Когда">
          <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
            {[
              {l:"Завтра 09:00", on:false},
              {l:"Через 3 дня",  on:true },
              {l:"Через неделю", on:false},
              {l:"Через 14 дней",on:false},
            ].map(t=>(
              <a key={t.l} style={{
                padding:"7px 12px", borderRadius:99, fontSize:12,
                border:"1px solid " + (t.on ? "color-mix(in oklab, var(--accent) 35%, var(--border))" : "var(--border)"),
                background: t.on ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--bg)",
                color: t.on ? "var(--fg)" : "var(--fg-muted)",
                fontWeight: t.on ? 500 : 400, cursor:"pointer",
              }}>{t.l}</a>
            ))}
          </div>
        </FormField>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:14}}>
          <FormField label="Дата"><input type="date" defaultValue="2026-05-21" style={modalInput} /></FormField>
          <FormField label="Время"><input type="time" defaultValue="09:00" style={modalInput} /></FormField>
        </div>

        <FormField label="Что напомнить" hint="Появится в плане и уведомлении">
          <input style={modalInput} defaultValue="Followup Anna · уточнить статус после финала" />
        </FormField>

        <div style={{marginTop:16, display:"flex", flexDirection:"column", gap:10}}>
          <label style={{display:"flex", alignItems:"center", gap:10, fontSize:12.5, cursor:"pointer"}}>
            <input type="checkbox" defaultChecked style={{accentColor:"var(--accent)"}}/>
            Создать событие в Google Calendar
          </label>
          <label style={{display:"flex", alignItems:"center", gap:10, fontSize:12.5, cursor:"pointer"}}>
            <input type="checkbox" defaultChecked style={{accentColor:"var(--accent)"}}/>
            Прислать локальное уведомление в браузере
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <BtnMd variant="ghost" size="md">Отмена</BtnMd>
        <BtnMd variant="primary" size="md" icon={IconMd.calendar}>Создать</BtnMd>
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. AI prep modal (from Details page)
// ─────────────────────────────────────────────────────────────────────────────
function ModalAIPrep() {
  return (
    <Modal width={560} label="Подготовка к интервью" sub="Через кнопку «Подготовить к интервью» на карточке заявки">
      <ModalHeader
        title="Подготовка к интервью"
        subtitle="AI составит пошаговый план под конкретное интервью."
        badge={<PillMd tone="accent">Beta</PillMd>}
      />
      <ModalBody>
        <FormField label="Какое интервью?">
          <select style={modalInput}>
            <option>Финал · 6 мая 14:30 (CTO + Product Lead)</option>
            <option>Технический · пройдено</option>
            <option>HR-скрин · пройдено</option>
          </select>
        </FormField>

        <FormField label="Что подготовить (множественный выбор)">
          <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
            {[
              {l:"Вероятные вопросы", on:true},
              {l:"System design сценарии", on:true},
              {l:"Behavioral STAR-истории", on:true},
              {l:"Вопросы команде", on:true},
              {l:"Обзор продукта компании", on:false},
              {l:"Резюме слабых тем", on:false},
            ].map(o=>(
              <label key={o.l} style={{
                display:"inline-flex", alignItems:"center", gap:7, padding:"6px 11px", borderRadius:99,
                border:"1px solid " + (o.on ? "color-mix(in oklab, var(--accent) 35%, var(--border))" : "var(--border)"),
                background: o.on ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--bg)",
                fontSize:12, fontWeight:500, cursor:"pointer",
                color: o.on ? "var(--fg)" : "var(--fg-muted)",
              }}>
                <input type="checkbox" defaultChecked={o.on} style={{accentColor:"var(--accent)"}}/>
                {o.l}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Длительность подготовки">
          <div style={{display:"flex", gap:6}}>
            {["30 мин","60 мин","90 мин","2+ часа"].map((t,i)=>(
              <a key={t} style={{
                flex:1, padding:"7px 0", textAlign:"center", borderRadius:7, fontSize:12,
                border:"1px solid " + (i===1 ? "color-mix(in oklab, var(--accent) 35%, var(--border))" : "var(--border)"),
                background: i===1 ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--bg)",
                color: i===1 ? "var(--fg)" : "var(--fg-muted)", fontWeight: i===1 ? 500 : 400, cursor:"pointer",
              }}>{t}</a>
            ))}
          </div>
        </FormField>

        <div style={{
          marginTop:14, padding:"12px 14px",
          background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:8,
          fontSize:12, color:"var(--fg-muted)", lineHeight:1.55,
        }}>
          AI учтёт описание вакансии, твоё CV, заметки и предыдущие интервью. Результат появится во вкладке «Подготовка».
        </div>
      </ModalBody>
      <ModalFooter>
        <BtnMd variant="ghost" size="md">Отмена</BtnMd>
        <BtnMd variant="primary" size="md" icon={IconMd.spark}>Сгенерировать план</BtnMd>
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Toast / inline notification
// ─────────────────────────────────────────────────────────────────────────────
function ToastDemo() {
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", padding:"18px 22px", gap:10}}>
      <div style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"3px 9px", borderRadius:99,
        fontSize:11, fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase",
        background:"var(--bg-subtle)", color:"var(--fg-subtle)",
        border:"1px solid var(--border)", marginBottom:6,
      }}>Тосты и уведомления</div>

      {[
        { tone:"success", icon:"✓", title:"Заявка создана", body:"Notion · Senior PE добавлена в воронку.", action:"Открыть" },
        { tone:"info",    icon:"i", title:"Цикл запущен", body:"Frontend EU обновится через ≈ 2 минуты." },
        { tone:"warning", icon:"!", title:"3 контакта ждут ответа > 5 дней", body:"Anna, Maria и Eva. Долгое молчание снижает шанс.", action:"Открыть Inbox" },
        { tone:"danger",  icon:"!", title:"Источник AngelList: ошибка соединения", body:"Не удалось обновить. Проверь токен в настройках.", action:"Настроить" },
      ].map((t,i)=>{
        const colorMap = {
          success:{bg:"color-mix(in oklab, rgb(5,150,105) 12%, var(--bg-elev))", bd:"rgb(5,150,105)", fg:"rgb(5,150,105)"},
          info:{bg:"color-mix(in oklab, var(--accent-2) 12%, var(--bg-elev))", bd:"var(--accent-2)", fg:"var(--accent-2)"},
          warning:{bg:"color-mix(in oklab, rgb(218,113,38) 12%, var(--bg-elev))", bd:"rgb(218,113,38)", fg:"rgb(180,83,9)"},
          danger:{bg:"color-mix(in oklab, rgb(220,38,38) 12%, var(--bg-elev))", bd:"rgb(220,38,38)", fg:"rgb(220,38,38)"},
        }[t.tone];
        return (
          <div key={i} style={{
            width:"min(100%, 420px)",
            background:"var(--bg-elev)",
            border:"1px solid var(--border)",
            borderLeft:"3px solid " + colorMap.fg,
            borderRadius:10,
            padding:"12px 14px",
            display:"flex", gap:12, alignItems:"flex-start",
            boxShadow:"0 6px 20px -8px rgba(0,0,0,0.12)",
          }}>
            <span style={{
              width:22, height:22, borderRadius:99, flexShrink:0,
              background: colorMap.bg, color: colorMap.fg,
              display:"grid", placeItems:"center", fontSize:12, fontWeight:700,
            }}>{t.icon}</span>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:500}}>{t.title}</div>
              <div style={{fontSize:12, color:"var(--fg-muted)", marginTop:2, lineHeight:1.5}}>{t.body}</div>
              {t.action && <a style={{fontSize:12, color:colorMap.fg, fontWeight:500, cursor:"pointer", marginTop:6, display:"inline-block"}}>{t.action} →</a>}
            </div>
            <button style={{background:"transparent", border:"none", color:"var(--fg-subtle)", cursor:"pointer", fontSize:13, padding:2, flexShrink:0}}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Showcase host
// ─────────────────────────────────────────────────────────────────────────────
function ModalsShowcase({ setPage }) {
  const [active, setActive] = React.useState("newApplication");

  const items = [
    { k:"newApplication", l:"Новая заявка",    el: <ModalNewApplication/> },
    { k:"newLoop",        l:"Новый цикл",      el: <ModalNewLoop/> },
    { k:"jobQuickView",   l:"Быстрый просмотр вакансии", el: <ModalJobQuickView/> },
    { k:"loopsFilter",    l:"Фильтр циклов на дашборде", el: <ModalLoopsFilter/> },
    { k:"reminder",       l:"Напоминание",     el: <ModalReminder/> },
    { k:"aiPrep",         l:"AI · Подготовка к интервью", el: <ModalAIPrep/> },
    { k:"delete",         l:"Подтверждение удаления", el: <ModalDelete/> },
    { k:"toasts",         l:"Тосты и нотификации", el: <ToastDemo/> },
  ];

  const current = items.find(i=>i.k===active) || items[0];

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100%", overflow:"hidden", position:"relative"}}>
      <div style={{borderBottom:"1px solid var(--border)", background:"var(--bg)", position:"relative", zIndex:2}}>
        <div style={{padding:"16px 28px"}}>
          <div style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:"var(--fg-subtle)", marginBottom:4}}>
            <a onClick={()=>setPage("dashboard")} style={{cursor:"pointer", color:"inherit"}}>Loopboard</a>
            <span>/</span>
            <span style={{color:"var(--fg-muted)"}}>Модальные окна</span>
          </div>
          <h1 style={{margin:0, fontSize:22, letterSpacing:"-0.025em", fontWeight:600}}>Модальные окна</h1>
          <p style={{margin:"4px 0 0", fontSize:13, color:"var(--fg-muted)"}}>
            Все диалоги в одном месте. Выбери слева, чтобы посмотреть.
          </p>
        </div>
      </div>

      <div style={{flex:1, display:"flex", overflow:"hidden", position:"relative"}}>
        <FauxBg/>

        <aside style={{
          width:240, flexShrink:0, padding:"18px 14px",
          borderRight:"1px solid var(--border)", background:"var(--bg)",
          overflowY:"auto", position:"relative", zIndex:1,
        }}>
          <SLMd><div style={{padding:"0 6px 8px"}}>Каталог</div></SLMd>
          <div style={{display:"flex", flexDirection:"column", gap:1}}>
            {items.map(it=>{
              const isActive = active===it.k;
              return (
                <a key={it.k} onClick={()=>setActive(it.k)} style={{
                  padding:"7px 10px", borderRadius:6, fontSize:12.5,
                  color: isActive ? "var(--fg)" : "var(--fg-muted)",
                  background: isActive ? "var(--bg-subtle)" : "transparent",
                  fontWeight: isActive ? 500 : 400, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  <span style={{
                    width:6, height:6, borderRadius:99,
                    background: isActive ? "var(--accent)" : "var(--border-strong)",
                  }}/>
                  {it.l}
                </a>
              );
            })}
          </div>

          <div style={{height:1, background:"var(--border)", margin:"14px 0"}}/>
          <div style={{padding:"0 6px", fontSize:11, color:"var(--fg-subtle)", lineHeight:1.55}}>
            Все модалки центрированы, используют единые primitives: header / body / footer и одинаковую тень. На мобильных переходят в bottom-sheet.
          </div>
        </aside>

        <div style={{
          flex:1, overflowY:"auto", position:"relative", zIndex:1,
          display:"flex", flexDirection:"column", alignItems:"center",
          padding:"28px 18px 80px",
        }}>
          {current.el}
        </div>
      </div>
    </div>
  );
}

window.MatchesModalsPages = { ModalsShowcase };
