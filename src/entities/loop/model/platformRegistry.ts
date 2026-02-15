import {
  buildAdzunaUrl,
  buildArbeitsagenturUrl,
  buildArbeitnowUrl,
  buildAusbildungDeUrl,
  buildAzubiDeUrl,
  buildAzubiyoUrl,
  buildDevjobsUrl,
  buildGermanTechJobsUrl,
  buildGetInItUrl,
  buildGigajobUrl,
  buildIndeedUrl,
  buildInstaffoUrl,
  buildJobliftUrl,
  buildJobvectorUrl,
  buildJobwareUrl,
  buildKimetaUrl,
  buildLinkedInUrl,
  buildMeinestadtUrl,
  buildMonsterUrl,
  buildPraktikumInfoUrl,
  buildRemoteOkUrl,
  buildRemotiveUrl,
  buildStepstoneUrl,
  buildStellenanzeigenUrl,
  buildWeAreDevelopersUrl,
  buildWeWorkRemotelyUrl,
  buildWellfoundUrl,
  buildXingUrl,
  buildJoobleUrl,
  buildGoogleSiteUrl,
  buildHoneypotUrl,
} from "../lib/links/urlBuilders";

import type { PlatformMeta, SearchFilters, LoopPlatform } from "./types";

function p(
  id: PlatformMeta["id"],
  label: string,
  group: PlatformMeta["group"],
  buildUrl: PlatformMeta["buildUrl"],
  recommended: boolean = false
): PlatformMeta {
  return { id, label, group, buildUrl, recommended };
}

export const PLATFORM_REGISTRY = [
  // ---------- Recommended / Top ----------
  p("linkedin", "LinkedIn", "recommended", buildLinkedInUrl, true),
  p("indeed", "Indeed (DE)", "recommended", buildIndeedUrl, true),
  p("stepstone", "StepStone", "recommended", buildStepstoneUrl, true),
  p("xing", "XING Jobs", "recommended", buildXingUrl, true),
  p(
    "arbeitsagentur",
    "Jobbörse Arbeitsagentur",
    "recommended",
    buildArbeitsagenturUrl,
    true
  ),
  p("jobvector", "Jobvector", "recommended", buildJobvectorUrl, true),
  p("joblift", "Joblift", "recommended", buildJobliftUrl, true),
  p("kimeta", "Kimeta", "recommended", buildKimetaUrl, true),

  // ---------- Germany ----------
  p("meinestadt", "meinestadt.de", "germany", buildMeinestadtUrl),
  p(
    "stellenanzeigen",
    "stellenanzeigen.de",
    "germany",
    buildStellenanzeigenUrl
  ),
  p("monster", "Monster (DE)", "germany", buildMonsterUrl),
  p("jobware", "Jobware", "germany", buildJobwareUrl),
  p("gigajob", "Gigajob", "germany", buildGigajobUrl),
  p("jooble", "Jooble", "germany", buildJoobleUrl),
  p("adzuna", "Adzuna", "germany", buildAdzunaUrl),
  p("glassdoor", "Glassdoor", "germany", (f) =>
    buildGoogleSiteUrl("glassdoor.de", f)
  ),

  // ---------- Tech ----------
  p("germantechjobs", "GermanTechJobs", "tech", buildGermanTechJobsUrl),
  p("honeypot", "Honeypot", "tech", buildHoneypotUrl),
  p("instaffo", "Instaffo", "tech", buildInstaffoUrl),
  p("wellfound", "Wellfound", "tech", buildWellfoundUrl),
  p("getinit", "Get in IT", "tech", buildGetInItUrl),
  p("wearedevelopers", "WeAreDevelopers", "tech", buildWeAreDevelopersUrl),
  p("devjobs", "DevJobs.de", "tech", buildDevjobsUrl),

  // ---------- Remote ----------
  p("arbeitnow", "Arbeitnow", "remote", buildArbeitnowUrl),
  p("remoteok", "RemoteOK", "remote", buildRemoteOkUrl),
  p("weworkremotely", "WeWorkRemotely", "remote", buildWeWorkRemotelyUrl),
  p("remotive", "Remotive", "remote", buildRemotiveUrl),

  // ---------- Ausbildung / Praktikum ----------
  p("azubide", "azubi.de", "ausbildung", buildAzubiDeUrl),
  p("ausbildungde", "ausbildung.de", "ausbildung", buildAusbildungDeUrl),
  p("azubiyo", "azubiyo.de", "ausbildung", buildAzubiyoUrl),
  p("praktikuminfo", "praktikum.info", "ausbildung", buildPraktikumInfoUrl),
  p("ihk", "IHK Lehrstellenbörse", "ausbildung", (f) =>
    buildGoogleSiteUrl("ihk-lehrstellenboerse.de", f)
  ),
] as const satisfies readonly PlatformMeta[];

export const ALL_PLATFORMS: LoopPlatform[] = PLATFORM_REGISTRY.map((x) => x.id);

export const RECOMMENDED_PLATFORMS: LoopPlatform[] = PLATFORM_REGISTRY.filter(
  (x) => x.recommended
).map((x) => x.id);

export const PLATFORM_LABEL_BY_ID: Record<LoopPlatform, string> =
  PLATFORM_REGISTRY.reduce((acc, x) => {
    acc[x.id] = x.label;
    return acc;
  }, {} as Record<LoopPlatform, string>);

export const PLATFORM_BY_ID: Record<
  LoopPlatform,
  (typeof PLATFORM_REGISTRY)[number]
> = PLATFORM_REGISTRY.reduce((acc, x) => {
  acc[x.id] = x;
  return acc;
}, {} as Record<LoopPlatform, (typeof PLATFORM_REGISTRY)[number]>);

export function buildUrlByPlatform(
  platform: LoopPlatform,
  filters: SearchFilters
): string {
  return PLATFORM_BY_ID[platform].buildUrl(filters);
}

export const GROUPS: Array<{ id: PlatformMeta["group"]; title: string }> = [
  { id: "recommended", title: "Recommended" },
  { id: "germany", title: "Germany" },
  { id: "tech", title: "Tech" },
  { id: "remote", title: "Remote" },
  { id: "ausbildung", title: "Ausbildung / Praktikum" },
];

export function platformsByGroup(group: PlatformMeta["group"]): LoopPlatform[] {
  if (group === "recommended") {
    return PLATFORM_REGISTRY.filter((x) => x.recommended).map((x) => x.id);
  }
  return PLATFORM_REGISTRY.filter(
    (x) => x.group === group && !x.recommended
  ).map((x) => x.id);
}
