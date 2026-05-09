/**
 * Generates a bookmarklet URL.
 * The bookmarklet copies best-effort job description text from the current page.
 * It works inside the page itself, so it bypasses most CORS restrictions.
 */
const BOOKMARKLET_SCHEME = ["java", "script"].join("") + ":";

const BOOKMARKLET_CANDIDATE_SELECTORS = [
  "main",
  "article",
  "[role=main]",
  "#job-description",
  ".job-description",
  ".jobs-description__content",
  ".show-more-less-html__markup",
  ".description",
].join(",");

export function buildJdBookmarklet(): string {
  const script = [
    "(()=>{",
    "try{",
    `const selectors='${BOOKMARKLET_CANDIDATE_SELECTORS}';`,
    "const candidates=[...document.querySelectorAll(selectors)].filter(Boolean);",
    "const root=candidates[0]||document.body;",
    "const normalize=(value)=>(value||'').replace(/\\n{3,}/g,'\\n\\n').trim();",
    "let text=normalize(root.innerText);",
    "if(!text||text.length<200){text=normalize(document.body.innerText);}",
    "if(!text||text.length<50){alert('Не удалось извлечь текст: он слишком короткий.');return;}",
    "navigator.clipboard.writeText(text).then(()=>{",
    "alert('JD скопирован в буфер: '+text.length+' символов. Вернись в Job Tracker и нажми «Вставить из буфера».');",
    "}).catch(()=>{",
    "prompt('Скопируй текст вручную:',text.slice(0,200000));",
    "});",
    "}catch(error){",
    "alert('Не удалось извлечь текст: '+(error&&error.message?error.message:error));",
    "}",
    "})();",
  ].join("");

  return BOOKMARKLET_SCHEME + encodeURIComponent(script);
}
