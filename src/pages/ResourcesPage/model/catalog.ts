import { ResourceItem } from "./types";

export const resourcesCatalog: ResourceItem[] = [
  {
    id: "ats",
    href: "https://www.jobscan.co/blog/ats-resume/",
    category: "cv",
    i18nKey: "ats",
    tagKeys: ["tags.cv", "tags.ats"],
  },
  {
    id: "coverLetter",
    href: "https://www.indeed.com/career-advice/resumes-cover-letters/cover-letter-format",
    category: "cv",
    i18nKey: "coverLetter",
    tagKeys: ["tags.coverLetter", "tags.templates"],
  },
  {
    id: "behavioral",
    href: "https://www.themuse.com/advice/star-interview-method",
    category: "interview",
    i18nKey: "behavioral",
    tagKeys: ["tags.interview", "STAR"],
  },
  {
    id: "systemDesign",
    href: "https://github.com/donnemartin/system-design-primer",
    category: "interview",
    i18nKey: "systemDesign",
    tagKeys: ["tags.systemDesign", "tags.engineering"],
  },
  {
    id: "linkedin",
    href: "https://www.linkedin.com/help/linkedin/answer/a507663",
    category: "jobBoards",
    i18nKey: "linkedin",
    tagKeys: ["LinkedIn", "tags.profile", "tags.search"],
  },
  {
    id: "remote",
    href: "https://remote.com/blog",
    category: "jobBoards",
    i18nKey: "remote",
    tagKeys: ["tags.remote", "tags.jobs"],
  },
  {
    id: "javascript",
    href: "https://javascript.info/",
    category: "learning",
    i18nKey: "javascript",
    tagKeys: ["JS", "tags.learning"],
  },
  {
    id: "react",
    href: "https://react.dev/learn",
    category: "learning",
    i18nKey: "react",
    tagKeys: ["React", "tags.learning"],
  },
  {
    id: "deepWork",
    href: "https://calnewport.com/books/deep-work/",
    category: "productivity",
    i18nKey: "deepWork",
    tagKeys: ["tags.focus", "tags.productivity"],
  },
  {
    id: "timeboxing",
    href: "https://todoist.com/productivity-methods/timeboxing",
    category: "productivity",
    i18nKey: "timeboxing",
    tagKeys: ["tags.planning", "tags.productivity"],
  },
];
