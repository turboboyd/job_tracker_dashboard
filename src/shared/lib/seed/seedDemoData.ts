import {
  Timestamp,
  doc,
  getDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

type LoopDoc = {
  name: string;
  titles: string[];
  location: string;
  radiusKm: number;
  remoteMode: string;
  platforms: string[];
  filters?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdAtTs: Timestamp;
  updatedAtTs: Timestamp;
};

type LoopMatchDoc = {
  loopId: string;
  title: string;
  company: string;
  location: string;
  platform: string;
  url: string;
  description: string;
  status: "new" | "saved" | "applied" | "interview" | "offer" | "rejected";
  matchedAt: string;
  createdAt: string;
  updatedAt: string;
  createdAtTs: Timestamp;
  updatedAtTs: Timestamp;
};

function isoNow(): string {
  return new Date().toISOString();
}

function pickStatus(i: number): LoopMatchDoc["status"] {
  if (i < 6) return "new";
  if (i < 10) return "saved";
  if (i < 13) return "applied";
  if (i < 16) return "interview";
  if (i < 18) return "offer";
  return "rejected";
}

function makeLoop(nowIso: string, nowTs: Timestamp): LoopDoc {
  return {
    name: "Demo loop (autocreated)",
    titles: ["Junior Frontend Developer", "Junior Fullstack Developer", "Trainee Software Developer"],
    location: "Frankfurt am Main",
    radiusKm: 25,
    remoteMode: "hybrid",
    platforms: ["linkedin", "indeed", "stepstone"],
    filters: {
      experience: ["junior", "trainee"],
      contract: ["full-time"],
      keywordsAny: ["react", "typescript", "frontend"],
      keywordsNot: ["senior", "lead"],
    },
    createdAt: nowIso,
    updatedAt: nowIso,
    createdAtTs: nowTs,
    updatedAtTs: nowTs,
  };
}

function makeMatches(loopId: string, nowIso: string, nowTs: Timestamp): LoopMatchDoc[] {
  const items = [
    { title: "Junior Frontend Developer (React)", company: "NovaSoft GmbH", location: "Frankfurt am Main", platform: "linkedin", url: "https://example.com/jobs/novasoft-jr-fe", description: "React, TypeScript, UI components, testing basics." },
    { title: "Trainee Web Developer", company: "MainCode AG", location: "Frankfurt am Main", platform: "indeed", url: "https://example.com/jobs/maincode-trainee-web", description: "HTML/CSS/JS, mentorship, small feature tasks." },
    { title: "Junior Fullstack Developer", company: "RheinTech", location: "Wiesbaden", platform: "stepstone", url: "https://example.com/jobs/rheintec-jr-fullstack", description: "Node.js + React, REST APIs, PostgreSQL." },
    { title: "Frontend Developer (Entry)", company: "CloudWerk", location: "Darmstadt", platform: "linkedin", url: "https://example.com/jobs/cloudwerk-fe-entry", description: "SPA, performance basics, accessibility awareness." },
    { title: "Software Developer (Junior)", company: "ByteBahn", location: "Frankfurt am Main", platform: "indeed", url: "https://example.com/jobs/bytebahn-jr-dev", description: "Generalist role, agile team, CI/CD exposure." },
    { title: "Junior UI Developer", company: "UXForge", location: "Offenbach", platform: "stepstone", url: "https://example.com/jobs/uxforge-jr-ui", description: "Design systems, CSS, component libraries." },
    { title: "Junior React Developer", company: "Komet Labs", location: "Mainz", platform: "linkedin", url: "https://example.com/jobs/komet-jr-react", description: "React hooks, state management, API integration." },
    { title: "Trainee Frontend (TypeScript)", company: "SpreeTech", location: "Remote (DE)", platform: "indeed", url: "https://example.com/jobs/spreetech-trainee-ts", description: "Remote-friendly, TypeScript first, code reviews." },
    { title: "Junior Web Engineer", company: "Horizon IT", location: "Frankfurt am Main", platform: "stepstone", url: "https://example.com/jobs/horizon-jr-web", description: "Web fundamentals + modern frameworks." },
    { title: "Frontend Developer (Junior) - Hybrid", company: "Schnittstelle GmbH", location: "Frankfurt am Main", platform: "linkedin", url: "https://example.com/jobs/schnittstelle-jr-hybrid", description: "Hybrid, team collaboration, incremental delivery." },
    { title: "Junior Fullstack (React/Node)", company: "DataDock", location: "Eschborn", platform: "indeed", url: "https://example.com/jobs/datadock-jr-fs", description: "React + Node, basics of cloud and monitoring." },
    { title: "Trainee Software Engineer", company: "AlphaBridge", location: "Frankfurt am Main", platform: "stepstone", url: "https://example.com/jobs/alphabridge-trainee-se", description: "Learning path, structured onboarding." },
    { title: "Junior Frontend - Design System", company: "PixelPoint", location: "Darmstadt", platform: "linkedin", url: "https://example.com/jobs/pixelpoint-jr-ds", description: "Storybook, reusable components, docs." },
    { title: "Junior Developer (Web)", company: "FinLite", location: "Frankfurt am Main", platform: "indeed", url: "https://example.com/jobs/finlite-jr-web", description: "Fintech domain, clean code, security basics." },
    { title: "Frontend Intern/Junior", company: "GreenStack", location: "Mainz", platform: "stepstone", url: "https://example.com/jobs/greenstack-fe-intern", description: "Intern-to-junior pipeline, practical tasks." },
    { title: "Junior Software Developer", company: "CodeCrafters", location: "Wiesbaden", platform: "linkedin", url: "https://example.com/jobs/codecrafters-jr", description: "Pair programming, small increments." },
    { title: "Junior Frontend (React) - Product", company: "Produktiv.io", location: "Frankfurt am Main", platform: "indeed", url: "https://example.com/jobs/produktiv-io-jr-fe", description: "Product team, analytics mindset, UI polish." },
    { title: "Junior Web Dev - Hybrid", company: "MetroByte", location: "Darmstadt", platform: "stepstone", url: "https://example.com/jobs/metrobyte-jr-hybrid", description: "Hybrid schedule, mentor, modern tooling." },
    { title: "Junior Developer - Career Starter", company: "StartWerk", location: "Frankfurt am Main", platform: "linkedin", url: "https://example.com/jobs/startwerk-starter", description: "Career starter program, training + projects." },
    { title: "Junior Frontend - React/TS", company: "MainRiver", location: "Offenbach", platform: "indeed", url: "https://example.com/jobs/mainriver-jr-react-ts", description: "React/TS, tests, pragmatic engineering." },
  ] as const;

  return items.map((x, i) => {
    const matchedDate = new Date(Date.now() - i * 36 * 60 * 60 * 1000);
    return {
      loopId,
      title: x.title,
      company: x.company,
      location: x.location,
      platform: x.platform,
      url: x.url,
      description: x.description,
      status: pickStatus(i),
      matchedAt: matchedDate.toISOString(),
      createdAt: nowIso,
      updatedAt: nowIso,
      createdAtTs: nowTs,
      updatedAtTs: nowTs,
    };
  });
}

/**
 * Creates demo data for a new user ONLY ONCE:
 * - users/{uid} (seeded=true)
 * - users/{uid}/loops/demoLoop
 * - users/{uid}/loopMatches/demoMatch_01..20
 */
export async function seedDemoDataIfNeeded(params: { db: Firestore; uid: string }): Promise<void> {
  const { db, uid } = params;

  const nowIso = isoNow();
  const nowTs = Timestamp.now();
  const loopId = "demoLoop";

  const loopRef = doc(db, "users", uid, "loops", loopId);

  // ✅ If demo loop already exists -> seeded already
  const loopSnap = await getDoc(loopRef);
  if (loopSnap.exists()) return;

  const batch = writeBatch(db);

  // create demo loop
  batch.set(loopRef, makeLoop(nowIso, nowTs), { merge: false });

  // create 20 demo matches
  const matches = makeMatches(loopId, nowIso, nowTs);
  for (let i = 0; i < matches.length; i++) {
    const matchId = `demoMatch_${String(i + 1).padStart(2, "0")}`;
    batch.set(doc(db, "users", uid, "loopMatches", matchId), matches[i], { merge: false });
  }

  await batch.commit();
}