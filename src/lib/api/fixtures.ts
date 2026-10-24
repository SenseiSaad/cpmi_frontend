/**
 * Deterministic sample data for the demo. Nothing here talks to a server. Course content is
 * illustrative (DBE/ACDBE = 49 CFR Parts 26 and 23) — the real material is supplied by the client.
 */
import { daysFromNow } from "@/lib/utils";
import type {
  ActivityItem,
  AgencySummary,
  Certificate,
  CatalogProduct,
  Course,
  HealthSnapshot,
  Invitation,
  LearnCourse,
  LessonType,
  MemberRow,
  NotificationItem,
  Order,
  PlatformKpis,
  Price,
  QuizQuestion,
  SessionUser,
  StoreProduct,
  RoleCode,
} from "./types";

export const METRO = { publicId: "5b1f3c6e-8d2a-4e5b-9c7a-1a2b3c4d5e6f", displayName: "Metro Transit Authority", slug: "metro-transit" };

export const PERSONAS: Record<RoleCode, SessionUser> = {
  learner: {
    userPublicId: "u-learner-sara",
    email: "sara.lisbon@metrotransit.gov",
    firstName: "Sara",
    lastName: "Lisbon",
    role: "learner",
    title: "Compliance Analyst",
    agency: METRO,
  },
  agency_admin: {
    userPublicId: "u-admin-marcus",
    email: "marcus.chen@metrotransit.gov",
    firstName: "Marcus",
    lastName: "Chen",
    role: "agency_admin",
    title: "Training Coordinator",
    agency: METRO,
  },
  super_admin: {
    userPublicId: "u-super-priya",
    email: "priya.raman@certification-academy.org",
    firstName: "Priya",
    lastName: "Raman",
    role: "super_admin",
    title: "Platform Owner",
    agency: null,
  },
  training_manager: {
    userPublicId: "u-tm-daniel",
    email: "daniel.okafor@certification-academy.org",
    firstName: "Daniel",
    lastName: "Okafor",
    role: "training_manager",
    title: "Training Manager",
    agency: null,
  },
};

export const ROLE_LABEL: Record<RoleCode, string> = {
  super_admin: "Super Admin",
  training_manager: "Training Manager",
  agency_admin: "Agency Admin",
  learner: "Learner",
};

export const ROLE_HOME: Record<RoleCode, string> = {
  learner: "/learner",
  agency_admin: "/agency",
  super_admin: "/admin",
  training_manager: "/admin",
};

// ---- People -------------------------------------------------------------------------------------

const FIRST = ["Aisha", "Brandon", "Carmen", "Devon", "Elena", "Frank", "Grace", "Hector", "Imani", "Jamal", "Keiko", "Luis", "Maya", "Noah", "Olivia", "Pedro", "Quinn", "Rosa", "Sam", "Tara", "Umar", "Vera", "Wes", "Ximena", "Yusuf", "Zoe", "Andre", "Bianca", "Cole", "Dana"];
const LAST = ["Alvarez", "Brooks", "Castillo", "Dawson", "Edwards", "Foster", "Gupta", "Hayes", "Ibrahim", "Jensen", "Kim", "Lopez", "Morgan", "Nguyen", "Ortiz", "Patel", "Quigley", "Reyes", "Singh", "Turner", "Underwood", "Vasquez", "Walker", "Xu", "Young", "Zimmer", "Adams", "Bell", "Cruz", "Diaz"];

function buildMembers(): MemberRow[] {
  const rows: MemberRow[] = [];
  const staff: { first: string; last: string; email: string; roles: RoleCode[] }[] = [
    { first: "Marcus", last: "Chen", email: "marcus.chen@metrotransit.gov", roles: ["agency_admin"] },
    { first: "Sara", last: "Lisbon", email: "sara.lisbon@metrotransit.gov", roles: ["learner"] },
    { first: "Helen", last: "Brandt", email: "helen.brandt@metrotransit.gov", roles: ["agency_admin"] },
  ];
  for (let i = 0; i < 27; i += 1) {
    const first = FIRST[i % FIRST.length]!;
    const last = LAST[(i * 7 + 3) % LAST.length]!;
    staff.push({ first, last, email: `${first}.${last}@metrotransit.gov`.toLowerCase(), roles: ["learner"] });
  }
  staff.forEach((s, i) => {
    const status = i === 7 || i === 19 ? "suspended" : i === 23 || i === 26 ? "left" : i === 29 ? "invited" : "active";
    rows.push({
      membershipId: String(1001 + i),
      membershipStatus: status,
      employeeReference: i % 3 === 0 ? `EMP-${4200 + i}` : null,
      joinedAt: status === "invited" ? null : daysFromNow(-(20 + i * 6)),
      user: { publicId: `u-${i}`, email: s.email, firstName: s.first, lastName: s.last, status: status === "invited" ? "invited" : "active" },
      roles: s.roles,
      progress: s.roles.includes("agency_admin") ? 100 : status === "left" ? 0 : Math.min(100, (i * 17 + 9) % 101),
      lastActiveAt: status === "active" ? daysFromNow(-((i * 3) % 14)) : null,
    });
  });
  return rows;
}

export const MEMBERS: MemberRow[] = buildMembers();

export const INVITATIONS: Invitation[] = [
  { id: "301", emailNormalized: "t.washington@metrotransit.gov", roleCode: "learner", expiresAt: daysFromNow(2), status: "pending" },
  { id: "302", emailNormalized: "l.moreno@metrotransit.gov", roleCode: "learner", expiresAt: daysFromNow(3), status: "pending" },
  { id: "303", emailNormalized: "d.hartley@metrotransit.gov", roleCode: "learner", expiresAt: daysFromNow(1), status: "pending" },
];

// ---- Commerce -------------------------------------------------------------------------------------

function price(id: string, period: "annual" | "monthly", amount: number): Price {
  return { id, billingPeriod: period, currency: "USD", unitAmountMinor: amount, activeFrom: daysFromNow(-200), activeUntil: null, isActive: true };
}

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    publicId: "prod-program",
    code: "DBE-ACDBE-FULL",
    name: "DBE / ACDBE Certification Program",
    productType: "program",
    description: "All 11 modules, module assessments, the comprehensive final exam and a verifiable certificate for every learner.",
    highlights: ["11 modules · 40+ lessons", "Module quizzes + final exam", "Verifiable certificates", "Progress reports for administrators"],
    prices: [price("11", "annual", 45000), price("12", "monthly", 4500)],
  },
  {
    publicId: "prod-gfe",
    code: "MOD-GFE",
    name: "Module 6 · Contract Goals & Good Faith Efforts",
    productType: "module",
    description: "A focused module on setting contract goals and documenting good faith efforts, with its own assessment and certificate.",
    highlights: ["5 lessons · 1 assessment", "Module certificate", "Ideal for contracting staff"],
    prices: [price("21", "annual", 7900), price("22", "monthly", 900)],
  },
  {
    publicId: "prod-acdbe",
    code: "MOD-ACDBE",
    name: "Module 9 · ACDBE Airport Concessions",
    productType: "module",
    description: "Airport Concession DBE rules under 49 CFR Part 23 — goals, certification and counting participation.",
    highlights: ["4 lessons · 1 assessment", "Module certificate", "For airport sponsors"],
    prices: [price("31", "annual", 7900), price("32", "monthly", 900)],
  },
  {
    publicId: "prod-eligibility",
    code: "MOD-ELIG",
    name: "Module 2 · Eligibility & Disadvantage",
    productType: "module",
    description: "Social and economic disadvantage standards, personal net worth and business size limits.",
    highlights: ["4 lessons · 1 assessment", "Module certificate"],
    prices: [price("41", "annual", 7900), price("42", "monthly", 900)],
  },
];

function order(n: number, status: Order["status"], method: Order["paymentMethod"], product: string, qty: number, unit: number, daysAgo: number, po: string | null, billing: string): Order {
  const total = qty * unit;
  return {
    publicId: `ord-${n}`,
    status,
    paymentMethod: method,
    currency: "USD",
    subtotalMinor: total,
    taxMinor: 0,
    totalMinor: total,
    purchaseOrderNumber: po,
    paidAt: status === "paid" ? daysFromNow(-daysAgo + 1) : null,
    createdAt: daysFromNow(-daysAgo),
    item: { productName: product, quantity: qty, unitAmountMinor: unit, lineTotalMinor: total, billingPeriod: billing },
  };
}

export const ORDERS: Order[] = [
  order(6, "pending", "invoice", "Module 6 · Contract Goals & Good Faith Efforts", 6, 7900, 3, "PO-2026-1187", "annual"),
  order(5, "paid", "card", "DBE / ACDBE Certification Program", 5, 45000, 41, null, "annual"),
  order(4, "paid", "invoice", "DBE / ACDBE Certification Program", 20, 45000, 224, "PO-2026-0412", "annual"),
  order(3, "paid", "invoice", "Module 6 · Contract Goals & Good Faith Efforts", 10, 7900, 331, "PO-2025-0977", "annual"),
  order(2, "void", "card", "Module 9 · ACDBE Airport Concessions", 2, 7900, 338, null, "annual"),
  order(1, "paid", "card", "Module 2 · Eligibility & Disadvantage", 3, 900, 352, null, "monthly"),
];

// ---- Platform ---------------------------------------------------------------------------------------

const agency = (n: number, name: string, state: string, status: AgencySummary["status"], members: number, used: number, cap: number, daysOld: number): AgencySummary => ({
  publicId: n === 1 ? METRO.publicId : `ag-${String(n).padStart(4, "0")}-${state.toLowerCase()}`,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  displayName: name,
  legalName: `${name} (Public Agency)`,
  status,
  billingEmail: `billing@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.gov`,
  memberCount: members,
  seatsUsed: used,
  seatCapacity: cap,
  createdAt: daysFromNow(-daysOld),
  state,
});

export const AGENCIES: AgencySummary[] = [
  agency(1, "Metro Transit Authority", "TX", "active", 30, 22, 35, 410),
  agency(2, "Cascade Regional Airport", "WA", "active", 18, 12, 20, 380),
  agency(3, "Lone Star Highway Commission", "TX", "active", 64, 48, 60, 365),
  agency(4, "Great Lakes Port Authority", "OH", "active", 22, 9, 25, 300),
  agency(5, "Heartland Rail District", "KS", "active", 15, 15, 15, 270),
  agency(6, "Sunbelt Airport Concessions", "AZ", "suspended", 11, 0, 10, 250),
  agency(7, "Piedmont Public Works", "NC", "active", 27, 19, 30, 210),
  agency(8, "Bayou State DOT", "LA", "pending", 3, 0, 0, 6),
  agency(9, "Granite State Transit", "NH", "active", 12, 7, 12, 180),
  agency(10, "Pacific Harbor Commission", "CA", "active", 41, 33, 45, 150),
  agency(11, "Prairie County Airport Board", "SD", "active", 8, 5, 10, 120),
  agency(12, "Mountain West Transportation", "CO", "active", 36, 28, 40, 95),
  agency(13, "Capital City Transit", "VA", "pending", 2, 0, 0, 3),
  agency(14, "Delta Levee District", "MS", "closed", 5, 0, 0, 500),
];

export const CATALOG: CatalogProduct[] = [
  { publicId: "prod-program", code: "DBE-ACDBE-FULL", name: "DBE / ACDBE Certification Program", productType: "program", status: "active", content: { kind: "course", title: "DBE/ACDBE Compliance Certification" }, prices: [price("11", "annual", 45000), price("12", "monthly", 4500)] },
  { publicId: "prod-gfe", code: "MOD-GFE", name: "Module 6 · Contract Goals & Good Faith Efforts", productType: "module", status: "active", content: { kind: "module", title: "Contract Goals & Good Faith Efforts" }, prices: [price("21", "annual", 7900), price("22", "monthly", 900)] },
  { publicId: "prod-acdbe", code: "MOD-ACDBE", name: "Module 9 · ACDBE Airport Concessions", productType: "module", status: "active", content: { kind: "module", title: "ACDBE Airport Concessions" }, prices: [price("31", "annual", 7900), price("32", "monthly", 900)] },
  { publicId: "prod-elig", code: "MOD-ELIG", name: "Module 2 · Eligibility & Disadvantage", productType: "module", status: "active", content: { kind: "module", title: "Eligibility & Disadvantage" }, prices: [price("41", "annual", 7900), price("42", "monthly", 900)] },
  { publicId: "prod-own", code: "MOD-OWN", name: "Module 3 · Ownership & Control", productType: "module", status: "draft", content: null, prices: [] },
  { publicId: "prod-legacy", code: "DBE-2024", name: "DBE Essentials (2024 edition)", productType: "program", status: "retired", content: { kind: "course", title: "DBE Essentials 2024" }, prices: [] },
];

// ---- Course content (authoring + learner preview share the module list) ---------------------------------

const MODULE_TITLES: [string, string][] = [
  ["Program Overview & Regulatory Framework", "How 49 CFR Part 26 is structured and who it applies to."],
  ["Eligibility: Social & Economic Disadvantage", "Presumptions, personal net worth and the small-business size standard."],
  ["Ownership & Control", "Demonstrating real ownership, management control and independence."],
  ["The Certification Process", "Unified Certification Programs, site visits, decisions and appeals."],
  ["Goal Setting & Methodology", "Base figures, step-one and step-two adjustments, and public participation."],
  ["Contract Goals & Good Faith Efforts", "Setting contract goals and documenting good faith efforts."],
  ["Counting DBE Participation", "Commercially useful function, supplier credit and what may be counted."],
  ["Monitoring & Compliance", "Prompt payment, substitutions, and ongoing oversight duties."],
  ["ACDBE: Airport Concessions", "49 CFR Part 23 goals, certification and counting for concessions."],
  ["Reporting & Recordkeeping", "Uniform reports, retention periods and audit readiness."],
  ["Program Integrity, Fraud & Penalties", "Fronts, pass-throughs, enforcement and whistleblower protections."],
];

const LESSON_PATTERNS: { title: string; type: LessonType; seconds: number }[] = [
  { title: "Introduction", type: "video", seconds: 540 },
  { title: "Key definitions", type: "reading", seconds: 420 },
  { title: "Worked example", type: "video", seconds: 780 },
  { title: "Checklist & forms", type: "resource", seconds: 300 },
  { title: "Common mistakes", type: "reading", seconds: 360 },
];

export function buildCourse(): Course {
  const modules = MODULE_TITLES.map(([title, description], mi) => {
    const lessonCount = mi % 3 === 0 ? 5 : 4;
    return {
      id: `mv-${mi + 1}`,
      code: `M${String(mi + 1).padStart(2, "0")}`,
      title: `Module ${mi + 1} · ${title}`,
      description,
      status: "published" as const,
      lessons: LESSON_PATTERNS.slice(0, lessonCount).map((p, li) => ({
        id: `lv-${mi + 1}-${li + 1}`,
        code: `M${mi + 1}-L${li + 1}`,
        title: p.title,
        lessonType: p.type,
        status: "published" as const,
        durationSeconds: p.seconds,
        isRequired: true,
        completionRule: p.type === "video" ? ("video_percent" as const) : p.type === "reading" ? ("manual" as const) : ("open" as const),
        completionThreshold: p.type === "video" ? 90 : null,
        videoAssetId: p.type === "video" ? `${812340000 + mi * 10 + li}` : null,
        bodyHtml: p.type === "video" ? "" : `<p>Sample lesson body for <strong>${title}</strong>.</p>`,
      })),
    };
  });

  return {
    publicId: "course-dbe",
    code: "DBE-CERT",
    title: "DBE/ACDBE Compliance Certification",
    versions: [
      { id: "cv-2", versionNo: 2, title: "2026 Edition (draft)", status: "draft", publishedAt: null, navigationMode: "sequential", certificateMode: "module_and_final", modules: modules.map((m, i) => (i === 10 ? { ...m, status: "draft" as const } : m)) },
      { id: "cv-1", versionNo: 1, title: "2025 Edition", status: "published", publishedAt: daysFromNow(-260), navigationMode: "sequential", certificateMode: "module_and_final", modules },
    ],
  };
}

export function buildLearnCourse(): LearnCourse {
  const course = buildCourse().versions[1]!;
  const modules = course.modules.map((m, mi) => {
    const doneModules = 4;
    const lessons = m.lessons.map((l, li) => {
      let state: "done" | "current" | "todo" | "locked";
      if (mi < doneModules) state = "done";
      else if (mi === doneModules) state = li < 2 ? "done" : li === 2 ? "current" : "todo";
      else state = "locked";
      return { id: l.id, title: l.title, type: l.lessonType, minutes: Math.round((l.durationSeconds ?? 300) / 60), state };
    });
    return {
      id: m.id,
      number: mi + 1,
      title: m.title.replace(/^Module \d+ · /, ""),
      summary: m.description,
      lessons,
      quiz: { id: `quiz-${mi + 1}`, title: `Module ${mi + 1} assessment`, questions: 8, passingScore: 80, best: mi < doneModules ? 84 + ((mi * 5) % 14) : null, attemptsUsed: mi < doneModules ? 1 : 0, maxAttempts: 3 },
    };
  });
  return {
    id: "course-dbe",
    title: "DBE/ACDBE Compliance Certification",
    description: "The complete 11-module program covering eligibility, certification, goals, good faith efforts, counting, compliance and program integrity.",
    progress: 42,
    validUntil: daysFromNow(139),
    modules,
  };
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    type: "single_choice",
    prompt: "A prime contractor cannot meet a contract goal. Which action best demonstrates good faith efforts?",
    options: [
      { id: "a", text: "Solicit certified DBEs in advance of bid opening and document the outreach" },
      { id: "b", text: "State that no DBEs were available in the area" },
      { id: "c", text: "Wait for DBEs to contact the prime after award" },
      { id: "d", text: "Select the lowest bidder regardless of DBE participation" },
    ],
    correct: ["a"],
    explanation: "Good faith efforts are about documented, active, timely outreach — not about the outcome alone.",
  },
  {
    id: "q2",
    type: "true_false",
    prompt: "A DBE may be counted toward a contract goal only if it performs a commercially useful function.",
    options: [
      { id: "t", text: "True" },
      { id: "f", text: "False" },
    ],
    correct: ["t"],
    explanation: "Only work a DBE actually performs and is responsible for executing counts toward the goal.",
  },
  {
    id: "q3",
    type: "multiple_choice",
    prompt: "Select ALL items that should be kept in good faith effort documentation.",
    options: [
      { id: "a", text: "Dates and methods of DBE solicitations" },
      { id: "b", text: "Quotes received and reasons any were rejected" },
      { id: "c", text: "Private notes about the DBE owner's personal finances" },
      { id: "d", text: "Records of assistance offered with bonding or insurance" },
    ],
    correct: ["a", "b", "d"],
    explanation: "Keep solicitation records, quotes and the reasons for rejection, and evidence of assistance offered.",
  },
  {
    id: "q4",
    type: "matching",
    prompt: "Match each term with its definition.",
    pairs: [
      { left: "Commercially useful function", rightOptions: ["Performing real, necessary work", "A joint-venture partner", "A bonding requirement", "A site-visit report"], correct: "Performing real, necessary work" },
      { left: "Good faith efforts", rightOptions: ["Performing real, necessary work", "Steps taken to obtain DBE participation", "A bonding requirement", "A site-visit report"], correct: "Steps taken to obtain DBE participation" },
      { left: "UCP", rightOptions: ["Performing real, necessary work", "A joint-venture partner", "A single statewide certification program", "A site-visit report"], correct: "A single statewide certification program" },
    ],
    explanation: "Unified Certification Programs give one-stop certification valid across the state.",
  },
  {
    id: "q5",
    type: "single_choice",
    prompt: "Who is responsible for determining whether a DBE is performing a commercially useful function?",
    options: [
      { id: "a", text: "The recipient (the funded agency)" },
      { id: "b", text: "The prime contractor alone" },
      { id: "c", text: "The DBE's bank" },
      { id: "d", text: "No one — it is assumed" },
    ],
    correct: ["a"],
    explanation: "The recipient must monitor and make the determination, normally through on-site reviews.",
  },
];

export const CERTIFICATES: Certificate[] = [
  { id: "c1", number: "CA-2026-M0412-7XQ9", title: "Module 1 · Program Overview & Regulatory Framework", kind: "module", holder: "Sara Lisbon", issuedAt: daysFromNow(-62), expiresAt: daysFromNow(303), status: "valid", agency: METRO.displayName },
  { id: "c2", number: "CA-2026-M0413-4KD2", title: "Module 2 · Eligibility: Social & Economic Disadvantage", kind: "module", holder: "Sara Lisbon", issuedAt: daysFromNow(-48), expiresAt: daysFromNow(317), status: "valid", agency: METRO.displayName },
  { id: "c3", number: "CA-2026-M0414-9MB6", title: "Module 3 · Ownership & Control", kind: "module", holder: "Sara Lisbon", issuedAt: daysFromNow(-33), expiresAt: daysFromNow(332), status: "valid", agency: METRO.displayName },
  { id: "c4", number: "CA-2026-M0415-2TR8", title: "Module 4 · The Certification Process", kind: "module", holder: "Sara Lisbon", issuedAt: daysFromNow(-12), expiresAt: daysFromNow(353), status: "valid", agency: METRO.displayName },
];

export const VERIFY_REGISTRY: Record<string, Certificate> = {
  ...Object.fromEntries(CERTIFICATES.map((c) => [c.number, c])),
  "CA-2025-F0099-1ZZ4": { id: "c9", number: "CA-2025-F0099-1ZZ4", title: "DBE / ACDBE Certification Program — Final", kind: "final", holder: "Jordan Whitfield", issuedAt: daysFromNow(-400), expiresAt: daysFromNow(-35), status: "expired", agency: "Cascade Regional Airport" },
  "CA-2025-F0071-8RV3": { id: "c8", number: "CA-2025-F0071-8RV3", title: "DBE / ACDBE Certification Program — Final", kind: "final", holder: "Alex Romero", issuedAt: daysFromNow(-300), expiresAt: null, status: "revoked", agency: "Lone Star Highway Commission" },
};

// ---- Feeds ------------------------------------------------------------------------------------------

export const ACTIVITY: ActivityItem[] = [
  { id: "a1", at: daysFromNow(0), text: "Brandon Dawson completed Module 5", tone: "ok" },
  { id: "a2", at: daysFromNow(0), text: "Invoice order PO-2026-1187 is awaiting payment", tone: "warn" },
  { id: "a3", at: daysFromNow(-1), text: "Seat reassigned from Tara Singh to Quinn Reyes", tone: "info" },
  { id: "a4", at: daysFromNow(-2), text: "6 invitations sent from CSV upload", tone: "info" },
  { id: "a5", at: daysFromNow(-3), text: "Carmen Ortiz passed the Module 4 assessment (92%)", tone: "ok" },
  { id: "a6", at: daysFromNow(-5), text: "Devon Patel was suspended by Marcus Chen", tone: "bad" },
];

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "Renewal coming up", body: "Module 6 access ends in 21 days. Renew to keep your team's progress.", at: daysFromNow(0), unread: true },
  { id: "n2", title: "Seat assigned", body: "You have been given a seat on the DBE / ACDBE Certification Program.", at: daysFromNow(-3), unread: true },
  { id: "n3", title: "Certificate issued", body: "Your Module 4 certificate is ready to download.", at: daysFromNow(-12), unread: false },
];

export const KPIS: PlatformKpis = {
  revenueMinor: 18_724_500,
  revenueDeltaPct: 12.4,
  agencies: AGENCIES.filter((a) => a.status === "active").length,
  activeLearners: 1284,
  completionRate: 61,
  passRate: 87,
  revenueSeries: [
    { label: "Nov", value: 9.1 }, { label: "Dec", value: 10.4 }, { label: "Jan", value: 12.2 }, { label: "Feb", value: 11.8 },
    { label: "Mar", value: 14.6 }, { label: "Apr", value: 15.1 }, { label: "May", value: 16.9 }, { label: "Jun", value: 15.7 },
    { label: "Jul", value: 17.4 }, { label: "Aug", value: 18.1 }, { label: "Sep", value: 19.3 }, { label: "Oct", value: 18.7 },
  ],
  moduleCompletion: MODULE_TITLES.map(([t], i) => ({ label: `M${i + 1}`, value: Math.max(28, 94 - i * 6 - (i % 3) * 3) })),
  passFail: { pass: 87, fail: 13 },
};

export const HEALTH: HealthSnapshot = {
  integrityChecks: { total: 22, failed: 0 },
  auditQueue: { pending: 3, oldestMinutes: 0, deadLettered: 0 },
  webhooks: { processed24h: 148, failed: 0, stuck: 0 },
  email: { sent24h: 312, pending: 4, failed: 1 },
  workers: [
    { name: "Email outbox", lastRunSeconds: 3, ok: true },
    { name: "Audit chain", lastRunSeconds: 4, ok: true },
    { name: "Entitlement expiry", lastRunSeconds: 212, ok: true },
    { name: "Webhook redrive", lastRunSeconds: 212, ok: true },
  ],
};
