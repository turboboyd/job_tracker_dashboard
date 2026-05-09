import type { SearchFilters } from "../../model/types";

import { URL_CONFIGS } from "./urlBuilderConfigs";
import { buildConfiguredUrl } from "./urlBuilders.shared";

export function buildMeinestadtUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.meinestadt);
}

export function buildMonsterUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.monster);
}

export function buildStellenanzeigenUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.stellenanzeigen);
}

export function buildJobliftUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.joblift);
}

export function buildGigajobUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.gigajob);
}

export function buildJobvectorUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.jobvector);
}

export function buildJobwareUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.jobware);
}

export function buildKimetaUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.kimeta);
}

export function buildJoobleUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.jooble);
}

export function buildAdzunaUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.adzuna);
}

export function buildGermanTechJobsUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.germanTechJobs);
}

export function buildInstaffoUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.instaffo);
}

export function buildWellfoundUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.wellfound);
}

export function buildGetInItUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.getInIt);
}

export function buildWeAreDevelopersUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.weAreDevelopers);
}

export function buildDevjobsUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.devjobs);
}

export function buildArbeitnowUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.arbeitnow);
}

export function buildWeWorkRemotelyUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.weWorkRemotely);
}

export function buildRemotiveUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.remotive);
}

export function buildAzubiDeUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.azubiDe);
}

export function buildAusbildungDeUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.ausbildungDe);
}

export function buildAzubiyoUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.azubiyo);
}

export function buildPraktikumInfoUrl(filters: SearchFilters): string {
  return buildConfiguredUrl(filters, URL_CONFIGS.praktikumInfo);
}
