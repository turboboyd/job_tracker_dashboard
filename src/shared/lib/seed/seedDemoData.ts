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

type DemoItem = {
  loopId: string;
  title: string;
  company: string;
  location: string;
  platform: string;
  url: string;
  description: string;
  status: "new" | "saved" | "applied" | "interview" | "offer" | "rejected";
  matchedAt: string;
};

function isoNow(): string {
  return new Date().toISOString();
}

function pickStatus(i: number): DemoItem["status"] {
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
    titles: [
      "Junior Frontend Developer",
      "Junior Fullstack Developer",
      "Trainee Software Developer",
    ],
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

function makeItems(loopId: string): DemoItem[] {
  const items = [
    {
      title: "Junior Frontend Developer (React)",
      company: "NovaSoft GmbH",
      location: "Frankfurt am Main",
      platform: "linkedin",
      url: "https://example.com/jobs/novasoft-jr-fe",
      description: "React, TypeScript, UI components, testing basics.",
    },
    {
      title: "Trainee Web Developer",
      company: "MainCode AG",
      location: "Frankfurt am Main",
      platform: "indeed",
      url: "https://example.com/jobs/maincode-trainee-web",
      description: "HTML/CSS/JS, mentorship, small feature tasks.",
    },
    {
      title: "Junior Fullstack Developer",
      company: "RheinTech",
      location: "Wiesbaden",
      platform: "stepstone",
      url: "https://example.com/jobs/rheintec-jr-fullstack",
      description: "Node.js + React, REST APIs, PostgreSQL.",
    },
    {
      title: "Frontend Developer (Entry)",
      company: "CloudWerk",
      location: "Darmstadt",
      platform: "linkedin",
      url: "https://example.com/jobs/cloudwerk-fe-entry",
      description: "SPA, performance basics, accessibility awareness.",
    },
    {
      title: "Software Developer (Junior)",
      company: "ByteBahn",
      location: "Frankfurt am Main",
      platform: "indeed",
      url: "https://example.com/jobs/bytebahn-jr-dev",
      description: "Generalist role, agile team, CI/CD exposure.",
    },
    {
      title: "Junior UI Developer",
      company: "UXForge",
      location: "Offenbach",
      platform: "stepstone",
      url: "https://example.com/jobs/uxforge-jr-ui",
      description: "Design systems, CSS, component libraries.",
    },
    {
      title: "Junior React Developer",
      company: "Komet Labs",
      location: "Mainz",
      platform: "linkedin",
      url: "https://example.com/jobs/komet-jr-react",
      description: "React hooks, state management, API integration.",
    },
    {
      title: "Trainee Frontend (TypeScript)",
      company: "SpreeTech",
      location: "Remote (DE)",
      platform: "indeed",
      url: "https://example.com/jobs/spreetech-trainee-ts",
      description: "Remote-friendly, TypeScript first, code reviews.",
    },
    {
      title: "Junior Web Engineer",
      company: "Horizon IT",
      location: "Frankfurt am Main",
      platform: "stepstone",
      url: "https://example.com/jobs/horizon-jr-web",
      description: "Web fundamentals + modern frameworks.",
    },
    {
      title: "Frontend Developer (Junior) - Hybrid",
      company: "Schnittstelle GmbH",
      location: "Frankfurt am Main",
      platform: "linkedin",
      url: "https://example.com/jobs/schnittstelle-jr-hybrid",
      description: "Hybrid, team collaboration, incremental delivery.",
    },
    {
      title: "Junior Fullstack (React/Node)",
      company: "DataDock",
      location: "Eschborn",
      platform: "indeed",
      url: "https://example.com/jobs/datadock-jr-fs",
      description: "React + Node, basics of cloud and monitoring.",
    },
    {
      title: "Trainee Software Engineer",
      company: "AlphaBridge",
      location: "Frankfurt am Main",
      platform: "stepstone",
      url: "https://example.com/jobs/alphabridge-trainee-se",
      description: "Learning path, structured onboarding.",
    },
    {
      title: "Junior Frontend - Design System",
      company: "PixelPoint",
      location: "Darmstadt",
      platform: "linkedin",
      url: "https://example.com/jobs/pixelpoint-jr-ds",
      description: "Storybook, reusable components, docs.",
    },
    {
      title: "Junior Developer (Web)",
      company: "FinLite",
      location: "Frankfurt am Main",
      platform: "indeed",
      url: "https://example.com/jobs/finlite-jr-web",
      description: "Fintech domain, clean code, security basics.",
    },
    {
      title: "Frontend Intern/Junior",
      company: "GreenStack",
      location: "Mainz",
      platform: "stepstone",
      url: "https://example.com/jobs/greenstack-fe-intern",
      description: "Intern-to-junior pipeline, practical tasks.",
    },
    {
      title: "Junior Software Developer",
      company: "CodeCrafters",
      location: "Wiesbaden",
      platform: "linkedin",
      url: "https://example.com/jobs/codecrafters-jr",
      description: "Pair programming, small increments.",
    },
    {
      title: "Junior Frontend (React) - Product",
      company: "Produktiv.io",
      location: "Frankfurt am Main",
      platform: "indeed",
      url: "https://example.com/jobs/produktiv-io-jr-fe",
      description: "Product team, analytics mindset, UI polish.",
    },
    {
      title: "Junior Web Dev - Hybrid",
      company: "MetroByte",
      location: "Darmstadt",
      platform: "stepstone",
      url: "https://example.com/jobs/metrobyte-jr-hybrid",
      description: "Hybrid schedule, mentor, modern tooling.",
    },
    {
      title: "Junior Developer - Career Starter",
      company: "StartWerk",
      location: "Frankfurt am Main",
      platform: "linkedin",
      url: "https://example.com/jobs/startwerk-starter",
      description: "Career starter program, training + projects.",
    },
    {
      title: "Junior Frontend - React/TS",
      company: "MainRiver",
      location: "Offenbach",
      platform: "indeed",
      url: "https://example.com/jobs/mainriver-jr-react-ts",
      description: "React/TS, tests, pragmatic engineering.",
    },
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
    };
  });
}

function mapToProcess(m: DemoItem): {
  status: string;
  stage: string;
  subStatus: string;
} {
  switch (m.status) {
    case "saved":
    case "new":
      return { status: "SAVED", stage: "ACTIVE", subStatus: "SAVED" };
    case "applied":
      return { status: "APPLIED", stage: "ACTIVE", subStatus: "APPLIED" };
    case "interview":
      return {
        status: "INTERVIEW_1",
        stage: "INTERVIEW",
        subStatus: "HR_CALL_SCHEDULED",
      };
    case "offer":
      return { status: "OFFER", stage: "OFFER", subStatus: "OFFER_RECEIVED" };
    case "rejected":
      return {
        status: "REJECTED",
        stage: "REJECTED",
        subStatus: "REJECTED_PRE_INTERVIEW",
      };
    default:
      return { status: "SAVED", stage: "ACTIVE", subStatus: "SAVED" };
  }
}

/**
 * Idempotent demo seeding.
 * Ensures:
 *  - users/{uid}/loops/demoLoop exists
 *  - users/{uid}/applications/demoApp_01..20 exist
 *  - each demo application has loopLinkage + hasLoop=true + archived=false
 */
export async function seedDemoDataIfNeeded(params: {
  db: Firestore;
  uid: string;
}): Promise<void> {
  const { db, uid } = params;

  const nowIso = isoNow();
  const nowTs = Timestamp.now();
  const loopId = "demoLoop";

  const loopRef = doc(db, "users", uid, "loops", loopId);
  const loopSnap = await getDoc(loopRef);

  const items = makeItems(loopId);

  // Find missing demo applications; also backfill critical fields for existing ones.
  const missing: Array<{ appId: string; m: DemoItem }> = [];
  for (let i = 0; i < items.length; i++) {
    const appId = `demoApp_${String(i + 1).padStart(2, "0")}`;
    const appRef = doc(db, "users", uid, "applications", appId);
     
    const snap = await getDoc(appRef);
    if (!snap.exists()) {
      missing.push({ appId, m: items[i] });
      continue;
    }

    const data = snap.data() as Record<string, unknown>;
    const archivedVal = data["archived"];
    const linkage = data["loopLinkage"];
    const hasLoop = data["hasLoop"];

    const needsArchived = typeof archivedVal !== "boolean";
    const linkageObj = (linkage && typeof linkage === "object") ? (linkage as Record<string, unknown>) : null;
    const needsLinkage = !linkageObj || typeof linkageObj.loopId !== "string";
    const needsHasLoop = needsLinkage ? true : hasLoop !== true;

    if (needsArchived || needsLinkage || needsHasLoop) {
      const batch = writeBatch(db);
      batch.set(
        appRef,
        {
          archived: false,
          loopLinkage: {
            loopId,
            platform: items[i].platform,
            matchedAt: Timestamp.fromDate(new Date(items[i].matchedAt)),
            source: "loop",
          },
          hasLoop: true,
        },
        { merge: true },
      );
       
      await batch.commit();
    }
  }

  // Nothing to do.
  if (loopSnap.exists() && missing.length === 0) return;

  const batch = writeBatch(db);

  if (!loopSnap.exists()) {
    batch.set(loopRef, makeLoop(nowIso, nowTs), { merge: false });
  }

  for (const { appId, m } of missing) {
    const p = mapToProcess(m);
    batch.set(
      doc(db, "users", uid, "applications", appId),
      {
        createdAt: nowTs,
        updatedAt: nowTs,
        createdBy: uid,
        archived: false,
        job: {
          companyName: m.company,
          roleTitle: m.title,
          locationText: m.location,
          vacancyUrl: m.url,
          source: m.platform,
        },
        process: {
          status: p.status,
          stage: p.stage,
          subStatus: p.subStatus,
          lastStatusChangeAt: nowTs,
          contactAttempts: 0,
          followUpLevel: 0,
          needsFollowUp: false,
          needsReapplySuggestion: false,
        },
        notes: { currentNote: "", tags: [] },
        vacancy: { rawDescription: m.description },
        loopLinkage: {
          loopId: m.loopId,
          platform: m.platform,
          matchedAt: Timestamp.fromDate(new Date(m.matchedAt)),
          source: "loop",
        },
        hasLoop: true,
      },
      { merge: false },
    );
  }

  await batch.commit();
}
