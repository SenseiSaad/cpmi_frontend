/**
 * Content studio: the course the builder edits, the checks it runs before publishing, and the calls to the
 * backend. The server re-checks everything (it is the authority); the checks here only make the builder
 * tell people what is missing while they work.
 */
import { http } from "./client";

export type QuestionType = "single_choice" | "multiple_choice" | "true_false";

export interface StudioOption {
  id: string;
  text: string;
  correct: boolean;
}
export interface StudioQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  explanation: string;
  options: StudioOption[];
}
export interface StudioQuiz {
  passingScore: number;
  maxAttempts: number | null;
  questions: StudioQuestion[];
}
export interface StudioLesson {
  id: string;
  title: string;
  kind: "reading" | "video";
  html: string;
  videoUrl: string;
  minutes: number;
}
export interface StudioModule {
  id: string;
  title: string;
  description: string;
  lessons: StudioLesson[];
  quiz: StudioQuiz | null;
}
export interface StudioFinal {
  passingScore: number;
  maxAttempts: number | null;
  questionCount: number;
  /** Module-quiz questions left OUT of the final exam (everything else is in, including questions added later). */
  excluded: string[];
  /** Questions that exist only on the final exam. */
  extraQuestions: StudioQuestion[];
}
export interface StudioCourse {
  courseUuid?: string | undefined;
  title: string;
  description: string;
  navigationMode: "free" | "sequential";
  certificateMode: "none" | "final_only" | "module_and_final";
  modules: StudioModule[];
  finalExam: StudioFinal | null;
}

export type Selection =
  | { kind: "course" }
  | { kind: "module"; m: string }
  | { kind: "lesson"; m: string; l: string }
  | { kind: "quiz"; m: string }
  | { kind: "final" };

export const uid = () => Math.random().toString(36).slice(2, 10);

export function newOption(correct = false, text = ""): StudioOption {
  return { id: uid(), text, correct };
}
export function newQuestion(type: QuestionType = "single_choice"): StudioQuestion {
  const options =
    type === "true_false" ? [newOption(true, "True"), newOption(false, "False")] : [newOption(true), newOption(), newOption(), newOption()];
  return { id: uid(), type, prompt: "", explanation: "", options };
}
export function newLesson(n: number): StudioLesson {
  return { id: uid(), title: `Lesson ${n}`, kind: "reading", html: "", videoUrl: "", minutes: 5 };
}
export function newModule(n: number): StudioModule {
  return { id: uid(), title: `Module ${n}`, description: "", lessons: [newLesson(1)], quiz: null };
}
export function newQuiz(): StudioQuiz {
  return { passingScore: 80, maxAttempts: 3, questions: [newQuestion()] };
}
export function emptyCourse(): StudioCourse {
  return {
    title: "",
    description: "",
    navigationMode: "free",
    certificateMode: "final_only",
    modules: [newModule(1)],
    finalExam: null,
  };
}

export function parseVimeoId(input: string): string | null {
  const t = input.trim();
  if (/^\d{4,15}$/.test(t)) return t;
  return /vimeo\.com\/(?:.*\/)?(\d{4,15})(?:[/?#]|$)/i.exec(t)?.[1] ?? null;
}
export const textOf = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();

/** Questions across all module quizzes. */
export const poolSize = (c: StudioCourse) => c.modules.reduce((n, m) => n + (m.quiz?.questions.length ?? 0), 0);
/** Questions the final exam can draw from: the module-quiz questions not left out, plus its own. */
export const finalPool = (c: StudioCourse) => {
  const f = c.finalExam;
  if (!f) return 0;
  const ex = new Set(f.excluded);
  const fromQuizzes = c.modules.reduce((n, m) => n + (m.quiz?.questions.filter((q) => !ex.has(q.id)).length ?? 0), 0);
  return fromQuizzes + f.extraQuestions.length;
};
export const newFinal = (c: StudioCourse): StudioFinal => ({ passingScore: 80, maxAttempts: 3, questionCount: Math.max(1, Math.min(30, poolSize(c))), excluded: [], extraQuestions: [] });

function questionIssues(q: StudioQuestion, label: string, target: Selection, out: Problem[]): void {
  if (!q.prompt.trim()) out.push({ message: `${label}: write the question.`, target });
  const filled = q.options.filter((o) => o.text.trim());
  if (filled.length < 2 || filled.length !== q.options.length) out.push({ message: `${label}: fill in every answer (at least two).`, target });
  if (!q.options.some((o) => o.correct)) out.push({ message: `${label}: mark the correct answer.`, target });
}
export const lessonCount = (c: StudioCourse) => c.modules.reduce((n, m) => n + m.lessons.length, 0);

export interface Problem {
  message: string;
  target: Selection;
}

/** Everything that would stop a publish, each with the place to fix it. */
export function courseProblems(c: StudioCourse): Problem[] {
  const out: Problem[] = [];
  if (!c.title.trim()) out.push({ message: "Give the course a name.", target: { kind: "course" } });
  if (c.modules.length === 0) out.push({ message: "Add at least one module.", target: { kind: "course" } });
  c.modules.forEach((m, i) => {
    const mw = m.title.trim() || `Module ${i + 1}`;
    if (!m.title.trim()) out.push({ message: `Module ${i + 1} needs a name.`, target: { kind: "module", m: m.id } });
    if (m.lessons.length === 0) out.push({ message: `${mw} needs at least one lesson.`, target: { kind: "module", m: m.id } });
    m.lessons.forEach((l, j) => {
      const lw = `${mw} › ${l.title.trim() || `Lesson ${j + 1}`}`;
      const t: Selection = { kind: "lesson", m: m.id, l: l.id };
      if (!l.title.trim()) out.push({ message: `${mw}: lesson ${j + 1} needs a title.`, target: t });
      if (l.kind === "video" && !parseVimeoId(l.videoUrl)) out.push({ message: `${lw}: paste a valid Vimeo link.`, target: t });
      if (l.kind === "reading" && !textOf(l.html)) out.push({ message: `${lw}: write some content.`, target: t });
    });
    if (m.quiz) {
      const t: Selection = { kind: "quiz", m: m.id };
      if (m.quiz.questions.length === 0) out.push({ message: `${mw} quiz has no questions (add one or remove the quiz).`, target: t });
      m.quiz.questions.forEach((q, k) => questionIssues(q, `${mw} quiz › question ${k + 1}`, t, out));
    }
  });
  if (c.finalExam) {
    const pool = finalPool(c);
    c.finalExam.extraQuestions.forEach((q, k) => questionIssues(q, `Final exam › own question ${k + 1}`, { kind: "final" }, out));
    if (pool === 0) out.push({ message: "The final exam has no questions. Pick some from the module quizzes or add your own.", target: { kind: "final" } });
    else if (c.finalExam.questionCount > pool) out.push({ message: `The final exam asks for ${c.finalExam.questionCount} questions but only ${pool} are available.`, target: { kind: "final" } });
  } else if (c.certificateMode === "final_only") {
    out.push({ message: "Certificates are given after the final exam. Add one, or turn certificates off.", target: { kind: "final" } });
  }
  return out;
}

// ---- Wire format ----------------------------------------------------------------------------------------

export interface PublishInput {
  sell?: { name: string; annualCents: number; monthlyCents?: number } | undefined;
}

export function toBlueprint(c: StudioCourse, input: PublishInput = {}) {
  return {
    ...(c.courseUuid ? { courseUuid: c.courseUuid } : {}),
    title: c.title.trim(),
    ...(c.description.trim() ? { description: c.description.trim() } : {}),
    navigationMode: c.navigationMode,
    certificateMode: c.certificateMode,
    modules: c.modules.map((m) => ({
      title: m.title.trim(),
      ...(m.description.trim() ? { description: m.description.trim() } : {}),
      lessons: m.lessons.map((l) => ({
        title: l.title.trim(),
        kind: l.kind,
        ...(textOf(l.html) ? { html: l.html } : {}),
        ...(l.kind === "video" ? { videoId: parseVimeoId(l.videoUrl) ?? l.videoUrl.trim() } : {}),
        minutes: Math.max(1, Math.round(l.minutes || 5)),
      })),
      ...(m.quiz
        ? {
            quiz: {
              passingScore: m.quiz.passingScore,
              maxAttempts: m.quiz.maxAttempts,
              questions: m.quiz.questions.map((q) => ({
                key: q.id,
                type: q.type,
                prompt: q.prompt.trim(),
                ...(q.explanation.trim() ? { explanation: q.explanation.trim() } : {}),
                options: q.options.map((o) => ({ text: o.text.trim(), correct: o.correct })),
              })),
            },
          }
        : {}),
    })),
    ...(c.finalExam
      ? {
          finalExam: {
            passingScore: c.finalExam.passingScore,
            maxAttempts: c.finalExam.maxAttempts,
            questionCount: c.finalExam.questionCount,
            fromQuizzes: c.modules.flatMap((m) => (m.quiz?.questions ?? []).map((q) => q.id)).filter((id) => !c.finalExam!.excluded.includes(id)),
            extraQuestions: c.finalExam.extraQuestions.map((q) => ({
              key: q.id,
              type: q.type,
              prompt: q.prompt.trim(),
              ...(q.explanation.trim() ? { explanation: q.explanation.trim() } : {}),
              options: q.options.map((o) => ({ text: o.text.trim(), correct: o.correct })),
            })),
          },
        }
      : {}),
    ...(input.sell ? { sell: input.sell } : {}),
  };
}

interface WireQuestion {
  key?: string;
  type: QuestionType;
  prompt: string;
  explanation?: string;
  options: { text: string; correct: boolean }[];
}

const fromWireQuestion = (q: WireQuestion): StudioQuestion => ({
  id: q.key ?? uid(),
  type: q.type,
  prompt: q.prompt,
  explanation: q.explanation ?? "",
  options: q.options.map((o) => ({ id: uid(), text: o.text, correct: o.correct })),
});

interface WireBlueprint {
  courseUuid?: string;
  courseCode?: string;
  versionNo?: number;
  title: string;
  description?: string;
  navigationMode: "free" | "sequential";
  certificateMode: "none" | "final_only" | "module_and_final";
  modules: {
    title: string;
    description?: string;
    lessons: { title: string; kind: "reading" | "video"; html?: string; videoId?: string; minutes?: number }[];
    quiz?: { passingScore: number; maxAttempts: number | null; questions: WireQuestion[] };
  }[];
  finalExam?: { passingScore: number; maxAttempts: number | null; questionCount: number; fromQuizzes?: string[]; extraQuestions?: WireQuestion[] };
}

export function fromBlueprint(w: WireBlueprint): StudioCourse {
  return {
    courseUuid: w.courseUuid,
    title: w.title,
    description: w.description ?? "",
    navigationMode: w.navigationMode,
    certificateMode: w.certificateMode,
    modules: w.modules.map((m) => ({
      id: uid(),
      title: m.title,
      description: m.description ?? "",
      lessons: m.lessons.map((l) => ({
        id: uid(),
        title: l.title,
        kind: l.kind,
        html: l.html ?? "",
        videoUrl: l.videoId ? `https://vimeo.com/${l.videoId}` : "",
        minutes: l.minutes ?? 5,
      })),
      quiz: m.quiz
        ? {
            passingScore: m.quiz.passingScore,
            maxAttempts: m.quiz.maxAttempts,
            questions: m.quiz.questions.map(fromWireQuestion),
          }
        : null,
    })),
    finalExam: w.finalExam ? finalFromWire(w) : null,
  };
}

function finalFromWire(w: WireBlueprint): StudioFinal {
  const f = w.finalExam!;
  const picked = f.fromQuizzes ? new Set(f.fromQuizzes) : null;
  const quizIds = w.modules.flatMap((m) => (m.quiz?.questions ?? []).map((q) => q.key).filter((k): k is string => !!k));
  return {
    passingScore: f.passingScore,
    maxAttempts: f.maxAttempts,
    questionCount: f.questionCount,
    excluded: picked ? quizIds.filter((id) => !picked.has(id)) : [],
    extraQuestions: (f.extraQuestions ?? []).map(fromWireQuestion),
  };
}

export interface PublishResult {
  coursePublicId: string;
  courseCode: string;
  versionNo: number;
  modules: number;
  lessons: number;
  questions: number;
  productPublicId?: string;
}

export interface CourseRow {
  uuid: string;
  code: string;
  title: string;
  currentVersion: number | null;
  updatedAt?: string;
}

export const studioApi = {
  async courses(): Promise<CourseRow[]> {
    const raw = await http<{ items?: any[]; courses?: any[] }>("GET", "/api/platform/courses", undefined, { query: { page: 1, pageSize: 100 } });
    return (raw.items ?? raw.courses ?? []).map((c) => ({
      uuid: c.uuid ?? c.publicId,
      code: c.code ?? "",
      title: c.title,
      currentVersion: c.current_version ?? null,
      updatedAt: c.updated_at ?? c.updatedAt,
    }));
  },
  async load(courseUuid: string): Promise<StudioCourse & { courseCode?: string; versionNo?: number }> {
    const raw = await http<{ course: WireBlueprint }>("GET", `/api/platform/studio/courses/${courseUuid}`);
    return { ...fromBlueprint(raw.course), courseCode: raw.course.courseCode, versionNo: raw.course.versionNo };
  },
  async publish(course: StudioCourse, input: PublishInput = {}): Promise<PublishResult> {
    const raw = await http<{ result: PublishResult }>("POST", "/api/platform/studio/courses", toBlueprint(course, input));
    return raw.result;
  },
};

export interface CourseOverviewRow {
  uuid: string;
  code: string;
  title: string;
  version: number | null;
  publishedAt: string | null;
  certificateMode: string | null;
  modules: number;
  lessons: number;
  hasFinal: boolean;
  products: {
    uuid: string;
    code: string;
    name: string;
    status: "draft" | "active" | "retired";
    prices: { id: string; billingPeriod: "annual" | "monthly"; unitAmountMinor: number }[];
  }[];
}

/** Every published course with its size and the products that sell it - one call for the list and the catalog. */
export async function fetchOverview(q: { limit: number; offset: number; search?: string | undefined; unsold?: boolean; courseUuid?: string | undefined }): Promise<{ items: CourseOverviewRow[]; total: number; limit: number; offset: number }> {
  const raw = await http<{ courses: CourseOverviewRow[]; page: { total: number; limit: number; offset: number } }>("GET", "/api/platform/studio/overview", undefined, {
    query: { limit: q.limit, offset: q.offset, search: q.search || undefined, unsold: q.unsold ? "1" : undefined, courseUuid: q.courseUuid },
  });
  return { items: raw.courses, ...raw.page };
}

/**
 * A draft saved in the browser by an older version of the builder may lack newer fields. Fill them in so
 * restoring it can never crash the page; returns null if it is not a usable draft at all.
 */
export function normalizeDraft(raw: unknown): StudioCourse | null {
  const d = raw as Partial<StudioCourse> | null;
  if (!d || typeof d !== "object" || !Array.isArray(d.modules)) return null;
  const quiz = (q: StudioQuestion): StudioQuestion => ({ ...q, explanation: q.explanation ?? "", options: Array.isArray(q.options) ? q.options : [] });
  return {
    courseUuid: d.courseUuid,
    title: d.title ?? "",
    description: d.description ?? "",
    navigationMode: d.navigationMode === "sequential" ? "sequential" : "free",
    certificateMode: d.certificateMode ?? "final_only",
    modules: d.modules.map((m) => ({
      id: m.id ?? uid(),
      title: m.title ?? "",
      description: m.description ?? "",
      lessons: (m.lessons ?? []).map((l) => ({ id: l.id ?? uid(), title: l.title ?? "", kind: l.kind === "video" ? "video" : "reading", html: l.html ?? "", videoUrl: l.videoUrl ?? "", minutes: l.minutes ?? 5 })),
      quiz: m.quiz ? { passingScore: m.quiz.passingScore ?? 80, maxAttempts: m.quiz.maxAttempts ?? null, questions: (m.quiz.questions ?? []).map(quiz) } : null,
    })),
    finalExam: d.finalExam
      ? {
          passingScore: d.finalExam.passingScore ?? 80,
          maxAttempts: d.finalExam.maxAttempts ?? null,
          questionCount: d.finalExam.questionCount ?? 1,
          excluded: Array.isArray(d.finalExam.excluded) ? d.finalExam.excluded : [],
          extraQuestions: Array.isArray(d.finalExam.extraQuestions) ? d.finalExam.extraQuestions.map(quiz) : [],
        }
      : null,
  };
}
