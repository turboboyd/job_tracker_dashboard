import type { UrlBuilderConfig } from "./urlBuilders.shared";

export const URL_CONFIGS = {
  meinestadt: {
    baseUrl: "https://jobs.meinestadt.de/suche",
    queryParam: "words",
    locationParam: "where",
    addRemoteKeyword: true,
  },
  monster: {
    baseUrl: "https://www.monster.de/jobs/suche/",
    queryParam: "q",
    locationParam: "where",
    addRemoteKeyword: true,
  },
  stellenanzeigen: {
    baseUrl: "https://www.stellenanzeigen.de/suche/",
    queryParam: "keywords",
    locationParam: "location",
    addRemoteKeyword: true,
  },
  joblift: {
    baseUrl: "https://joblift.de/suche",
    queryParam: "query",
    locationParam: "location",
    addRemoteKeyword: true,
  },
  gigajob: {
    baseUrl: "https://de.gigajob.com/Jobs",
    queryParam: "search",
    locationParam: "location",
    addRemoteKeyword: true,
  },
  jobvector: {
    baseUrl: "https://www.jobvector.de/stellenangebote/",
    queryParam: "q",
    locationParam: "l",
    addRemoteKeyword: true,
  },
  jobware: {
    baseUrl: "https://www.jobware.de/jobsuche/",
    queryParam: "q",
    locationParam: "l",
    addRemoteKeyword: true,
  },
  kimeta: {
    baseUrl: "https://www.kimeta.de/jobsuche",
    queryParam: "q",
    locationParam: "l",
    addRemoteKeyword: true,
  },
  jooble: {
    baseUrl: "https://de.jooble.org/stellenangebote",
    queryParam: "q",
    locationParam: "l",
    addRemoteKeyword: true,
  },
  adzuna: {
    baseUrl: "https://www.adzuna.de/search",
    queryParam: "q",
    locationParam: "w",
    addRemoteKeyword: true,
  },
  germanTechJobs: {
    baseUrl: "https://germantechjobs.de/jobs",
    queryParam: "query",
    locationParam: "location",
    addRemoteKeyword: true,
  },
  instaffo: {
    baseUrl: "https://instaffo.com/jobs",
    queryParam: "search",
    addRemoteKeyword: true,
  },
  wellfound: {
    baseUrl: "https://wellfound.com/jobs",
    queryParam: "query",
    locationParam: "location",
    addRemoteKeyword: true,
  },
  getInIt: {
    baseUrl: "https://www.get-in-it.de/jobsuche",
    queryParam: "q",
    locationParam: "l",
    addRemoteKeyword: true,
  },
  weAreDevelopers: {
    baseUrl: "https://www.wearedevelopers.com/en/jobs",
    queryParam: "query",
    addRemoteKeyword: true,
  },
  devjobs: {
    baseUrl: "https://devjobs.de/jobs",
    queryParam: "query",
    locationParam: "location",
    addRemoteKeyword: true,
  },
  arbeitnow: {
    baseUrl: "https://arbeitnow.com/",
    queryParam: "search",
    addRemoteKeyword: true,
  },
  weWorkRemotely: {
    baseUrl: "https://weworkremotely.com/remote-jobs/search",
    queryParam: "term",
  },
  remotive: {
    baseUrl: "https://remotive.com/remote-jobs/search",
    queryParam: "search",
  },
  azubiDe: {
    baseUrl: "https://www.azubi.de/suche",
    queryParam: "query",
    locationParam: "location",
  },
  ausbildungDe: {
    baseUrl: "https://www.ausbildung.de/stellen/",
    queryParam: "what",
    locationParam: "where",
  },
  azubiyo: {
    baseUrl: "https://www.azubiyo.de/jobsuche/",
    queryParam: "q",
    locationParam: "l",
  },
  praktikumInfo: {
    baseUrl: "https://www.praktikum.info/suche",
    queryParam: "query",
    locationParam: "city",
  },
} satisfies Record<string, UrlBuilderConfig>;
