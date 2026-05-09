export interface SkillDict {
  canonical: string;
  synonyms: string[];
  weight: number;
}

export const SKILL_DICTIONARY: SkillDict[] = [
  { canonical: "javascript", synonyms: ["js", "ecmascript"], weight: 1.0 },
  { canonical: "typescript", synonyms: ["ts"], weight: 1.1 },
  { canonical: "react", synonyms: ["reactjs", "react.js"], weight: 1.2 },
  { canonical: "nextjs", synonyms: ["next", "next.js"], weight: 1.1 },
  { canonical: "vue", synonyms: ["vue.js", "vuejs"], weight: 1.0 },
  { canonical: "angular", synonyms: ["angularjs"], weight: 1.0 },

  { canonical: "node", synonyms: ["nodejs", "node.js"], weight: 1.1 },
  { canonical: "express", synonyms: ["expressjs"], weight: 0.9 },
  { canonical: "nestjs", synonyms: ["nest", "nest.js"], weight: 1.0 },

  { canonical: "sql", synonyms: ["postgres", "postgresql", "mysql", "mariadb", "sqlite"], weight: 1.0 },
  { canonical: "mongodb", synonyms: ["mongo"], weight: 0.9 },
  { canonical: "firebase", synonyms: ["firestore", "firebase auth"], weight: 0.9 },

  { canonical: "jest", synonyms: ["unit testing", "unit test"], weight: 1.0 },
  { canonical: "cypress", synonyms: ["e2e", "end-to-end"], weight: 0.9 },
  { canonical: "playwright", synonyms: ["browser automation"], weight: 0.9 },

  { canonical: "docker", synonyms: ["containers", "containerization"], weight: 1.0 },
  { canonical: "kubernetes", synonyms: ["k8s"], weight: 1.1 },
  { canonical: "ci/cd", synonyms: ["cicd", "continuous integration", "continuous delivery", "github actions", "gitlab ci"], weight: 0.9 },

  { canonical: "aws", synonyms: ["amazon web services"], weight: 1.0 },
  { canonical: "gcp", synonyms: ["google cloud", "google cloud platform"], weight: 0.9 },
  { canonical: "azure", synonyms: ["microsoft azure"], weight: 0.9 }
];

export const SENIORITY_KEYWORDS = {
  junior: ["junior", "entry", "trainee", "intern"],
  mid: ["mid", "middle", "intermediate"],
  senior: ["senior", "lead", "staff", "principal", "architect"]
};
