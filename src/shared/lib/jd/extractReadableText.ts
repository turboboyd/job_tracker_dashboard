/**
 * Very lightweight "readability-like" extractor.
 * Client-only, no dependencies.
 *
 * Strategy:
 * - Parse HTML
 * - Remove scripts/styles/nav/footer/header/aside
 * - Prefer <main> or <article> or [role="main"]
 * - Fallback to biggest text container
 */
export function extractReadableText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove noisy nodes
  const removeSelectors = [
    "script",
    "style",
    "noscript",
    "svg",
    "canvas",
    "iframe",
    "header",
    "footer",
    "nav",
    "aside",
    "[aria-hidden='true']",
    ".cookie",
    ".cookies",
    ".consent",
    ".header",
    ".footer",
    ".nav",
    ".sidebar",
    ".menu",
    ".modal",
    ".popup"
  ];
  for (const sel of removeSelectors) {
    doc.querySelectorAll(sel).forEach((n) => n.remove());
  }

  const candidates: Element[] = [];
  const main = doc.querySelector("main");
  const article = doc.querySelector("article");
  const roleMain = doc.querySelector("[role='main']");

  if (main) candidates.push(main);
  if (article) candidates.push(article);
  if (roleMain) candidates.push(roleMain);

  // Common job description containers
  const common = [
    "#job-description",
    ".job-description",
    ".jobs-description__content",
    ".show-more-less-html__markup",
    ".description",
    ".vacancy-description",
    ".posting-requirements",
    ".posting-categories"
  ];
  for (const sel of common) {
    const el = doc.querySelector(sel);
    if (el) candidates.push(el);
  }

  // Fallback: choose element with max text length among sections/divs
  if (candidates.length === 0) {
    const blocks = Array.from(doc.querySelectorAll("section, div"));
    blocks.sort((a, b) => (b.textContent?.length ?? 0) - (a.textContent?.length ?? 0));
    if (blocks[0]) candidates.push(blocks[0]);
  }

  const pick = candidates[0] ?? doc.body;

  const text = (pick?.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If too short, fallback to body text
  if (text.length < 200) {
    const bodyText = (doc.body?.textContent ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return bodyText;
  }

  return text;
}
