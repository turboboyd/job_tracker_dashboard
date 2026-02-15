import type { SearchFilters } from "src/entities/loop/model";
import { clampRadiusKm } from 'src/entities/loop/model/searchFilters';



function enc(v: string) {
  return encodeURIComponent(v.trim());
}

function buildQuery(filters: SearchFilters): string {
  return filters.role.trim();
}

function addRemoteKeyword(q: string, filters: SearchFilters) {
  if (filters.workMode !== "remote_only") return q;
  return [q, "remote", "home office", "hybrid"].filter(Boolean).join(" ");
}

// ---------- TOP PLATFORMS ----------

export function buildLinkedInUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);
  const loc = filters.location.trim();
  const rad = clampRadiusKm(filters.radiusKm);

  const sp = new URLSearchParams();
  if (q) sp.set("keywords", q);
  if (loc) sp.set("location", loc);
  sp.set("distance", String(rad || 30));
  sp.set("sortBy", "DD");
  if (filters.workMode === "remote_only") sp.set("f_WT", "2");

  return `https://www.linkedin.com/jobs/search/?${sp.toString()}`;
}

export function buildIndeedUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();
  const rad = clampRadiusKm(filters.radiusKm);

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("l", loc);
  sp.set("radius", String(rad || 30));
  sp.set("sort", "date");
  if (filters.workMode === "remote_only") sp.set("remotejob", "1");

  return `https://de.indeed.com/jobs?${sp.toString()}`;
}

export function buildStepstoneUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim() || "deutschland";
  const rad = clampRadiusKm(filters.radiusKm);

  const sp = new URLSearchParams();
  if (q) sp.set("what", q);
  sp.set("radius", String(rad || 30));
  sp.set("sort", "2");
  if (filters.workMode === "remote_only") sp.set("wfh", "1");

  return `https://www.stepstone.de/jobs-in-${enc(loc)}?${sp.toString()}`;
}

export function buildXingUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("keywords", q);
  if (loc) sp.set("location", loc);
  if (filters.workMode === "remote_only") sp.set("remote", "true");

  return `https://www.xing.com/jobs/search?${sp.toString()}`;
}

// ---------- GERMANY GENERAL ----------

export function buildArbeitsagenturUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();
  const rad = clampRadiusKm(filters.radiusKm);

  const sp = new URLSearchParams();
  if (q) sp.set("was", q);
  if (loc) sp.set("wo", loc);
  if (rad) sp.set("umkreis", String(rad));

  return `https://www.arbeitsagentur.de/jobsuche/suche?${sp.toString()}`;
}

export function buildMeinestadtUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("words", q);
  if (loc) sp.set("where", loc);

  return `https://jobs.meinestadt.de/suche?${sp.toString()}`;
}

export function buildMonsterUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("where", loc);

  return `https://www.monster.de/jobs/suche/?${sp.toString()}`;
}

export function buildStellenanzeigenUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("keywords", q);
  if (loc) sp.set("location", loc);

  return `https://www.stellenanzeigen.de/suche/?${sp.toString()}`;
}

export function buildJobliftUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("query", q);
  if (loc) sp.set("location", loc);

  return `https://joblift.de/suche?${sp.toString()}`;
}

export function buildGigajobUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("search", q);
  if (loc) sp.set("location", loc);

  return `https://de.gigajob.com/Jobs?${sp.toString()}`;
}

export function buildJobvectorUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("l", loc);

  return `https://www.jobvector.de/stellenangebote/?${sp.toString()}`;
}

export function buildJobwareUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("l", loc);

  return `https://www.jobware.de/jobsuche/?${sp.toString()}`;
}

export function buildKimetaUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("l", loc);

  return `https://www.kimeta.de/jobsuche?${sp.toString()}`;
}

// ---------- AGGREGATORS ----------

export function buildJoobleUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("l", loc);

  return `https://de.jooble.org/stellenangebote?${sp.toString()}`;
}

export function buildAdzunaUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("w", loc);

  return `https://www.adzuna.de/search?${sp.toString()}`;
}

// ---------- TECH ----------

export function buildGermanTechJobsUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("query", q);
  if (loc) sp.set("location", loc);

  return `https://germantechjobs.de/jobs?${sp.toString()}`;
}

export function buildInstaffoUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);

  const sp = new URLSearchParams();
  if (q) sp.set("search", q);

  return `https://instaffo.com/jobs?${sp.toString()}`;
}

export function buildWellfoundUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("query", q);
  if (loc) sp.set("location", loc);

  return `https://wellfound.com/jobs?${sp.toString()}`;
}

export function buildGetInItUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("l", loc);

  return `https://www.get-in-it.de/jobsuche?${sp.toString()}`;
}

export function buildWeAreDevelopersUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);

  const sp = new URLSearchParams();
  if (q) sp.set("query", q);

  return `https://www.wearedevelopers.com/en/jobs?${sp.toString()}`;
}

export function buildDevjobsUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("query", q);
  if (loc) sp.set("location", loc);

  return `https://devjobs.de/jobs?${sp.toString()}`;
}

export function buildHoneypotUrl(filters: SearchFilters): string {
  const q = addRemoteKeyword(buildQuery(filters), filters);
  const loc = filters.location.trim();
  const full = [q, loc].filter(Boolean).join(" ");
  return `https://www.honeypot.io/search?query=${enc(full)}`;
}

// ---------- REMOTE ----------

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    // eslint-disable-next-line sonarjs/slow-regex, sonarjs/anchor-precedence
    .replace(/^-+|-+$/g, "");
}

export function buildArbeitnowUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);

  const sp = new URLSearchParams();
  if (q) sp.set("search", q);

  return `https://arbeitnow.com/?${sp.toString()}`;
}

export function buildRemoteOkUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);
  const role = slugify(q || "jobs");
  return `https://remoteok.com/remote-${role}-jobs`;
}

export function buildWeWorkRemotelyUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);

  const sp = new URLSearchParams();
  if (q) sp.set("term", q);

  return `https://weworkremotely.com/remote-jobs/search?${sp.toString()}`;
}

export function buildRemotiveUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);

  const sp = new URLSearchParams();
  if (q) sp.set("search", q);

  return `https://remotive.com/remote-jobs/search?${sp.toString()}`;
}

// ---------- AUSBILDUNG / PRAKTIKUM ----------

export function buildAzubiDeUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("query", q);
  if (loc) sp.set("location", loc);

  return `https://www.azubi.de/suche?${sp.toString()}`;
}

export function buildAusbildungDeUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("what", q);
  if (loc) sp.set("where", loc);

  return `https://www.ausbildung.de/stellen/?${sp.toString()}`;
}

export function buildAzubiyoUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (loc) sp.set("l", loc);

  return `https://www.azubiyo.de/jobsuche/?${sp.toString()}`;
}

export function buildPraktikumInfoUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("query", q);
  if (loc) sp.set("city", loc);

  return `https://www.praktikum.info/suche?${sp.toString()}`;
}

// ---------- FALLBACK ----------

export function buildGoogleSiteUrl(
  site: string,
  filters: SearchFilters
): string {
  const q = buildQuery(filters);
  const loc = filters.location.trim();
  const full = [q, loc].filter(Boolean).join(" ");
  const query = `site:${site} ${full}`.trim();
  return `https://www.google.com/search?q=${enc(query)}`;
}
