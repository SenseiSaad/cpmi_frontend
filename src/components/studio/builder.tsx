"use client";

import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Eye,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Pencil,
  PlayCircle,
  Plus,
  Rocket,
  Trash2,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RichText, LESSON_PROSE } from "@/components/studio/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceCard, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  courseProblems,
  emptyCourse,
  finalPool,
  lessonCount,
  newLesson,
  newFinal,
  newModule,
  newOption,
  newQuestion,
  newQuiz,
  normalizeDraft,
  parseVimeoId,
  poolSize,
  studioApi,
  type Problem,
  type PublishResult,
  type QuestionType,
  type Selection,
  type StudioCourse,
  type StudioLesson,
  type StudioModule,
  type StudioQuestion,
} from "@/lib/api/studio";
import { vimeoEmbedUrl } from "@/lib/lesson-prose";
import { cn } from "@/lib/utils";

// ---- Small helpers ------------------------------------------------------------------------------------------

function move<T>(list: T[], from: number, by: -1 | 1): T[] {
  const to = from + by;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

function sameSel(a: Selection, b: Selection): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "module" && b.kind === "module") return a.m === b.m;
  if (a.kind === "quiz" && b.kind === "quiz") return a.m === b.m;
  if (a.kind === "lesson" && b.kind === "lesson") return a.m === b.m && a.l === b.l;
  return true;
}

/** Two-step delete so nobody removes a module by accident. */
function DeleteButton({ label, onConfirm, className, showText }: { label: string; onConfirm: () => void; className?: string; showText?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      aria-label={armed ? `Confirm: ${label}` : label}
      title={armed ? "Click again to confirm" : label}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) onConfirm();
        else setArmed(true);
      }}
      className={cn("grid h-7 place-items-center rounded-md px-1.5 text-xs font-semibold transition-colors", armed ? "bg-bad text-white" : "text-ink-500 hover:bg-bad-bg hover:text-bad", className)}
    >
      {armed ? "Click again to confirm" : showText ? <span className="inline-flex items-center gap-1.5"><Trash2 className="size-3.5" aria-hidden />{label}</span> : <Trash2 className="size-3.5" aria-hidden />}
    </button>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="grid size-7 place-items-center rounded-md text-ink-500 transition-colors hover:bg-white hover:text-ink-900 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

// ---- Outline (left column) ----------------------------------------------------------------------------------

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? <CheckCircle2 className="size-4 shrink-0 text-ok" aria-label="Complete" /> : <Circle className="size-4 shrink-0 text-ink-300" aria-label="Needs work" />;
}

function Outline({
  course,
  sel,
  setSel,
  edit,
  problems,
}: {
  course: StudioCourse;
  sel: Selection;
  setSel: (s: Selection) => void;
  edit: (fn: (c: StudioCourse) => void) => void;
  problems: Problem[];
}) {
  const bad = (s: Selection) => problems.some((p) => sameSel(p.target, s));
  const row = (active: boolean) =>
    cn("group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors", active ? "bg-brand-50 text-brand-900 ring-1 ring-brand-200" : "text-ink-800 hover:bg-canvas-soft");

  return (
    <nav aria-label="Course outline" className="space-y-1">
      <button type="button" onClick={() => setSel({ kind: "course" })} className={row(sel.kind === "course")}>
        <GraduationCap className="size-4 shrink-0 text-brand-700" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-bold">{course.title.trim() || "Untitled course"}</span>
        <StatusDot ok={!bad({ kind: "course" })} />
      </button>

      <div className="mt-3 space-y-3">
        {course.modules.map((m, mi) => {
          const msel: Selection = { kind: "module", m: m.id };
          return (
            <div key={m.id} className="rounded-2xl bg-white p-2 ring-1 ring-line">
              <div className={cn(row(sameSel(sel, msel)), "group/module")}>
                <button type="button" onClick={() => setSel(msel)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-navy-900 text-[11px] font-bold text-white">{mi + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{m.title.trim() || "Untitled module"}</span>
                </button>
                <span className="flex items-center transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover/module:opacity-100">
                  <IconBtn label="Move module up" disabled={mi === 0} onClick={() => edit((c) => { c.modules = move(c.modules, mi, -1); })}><ChevronUp className="size-4" aria-hidden /></IconBtn>
                  <IconBtn label="Move module down" disabled={mi === course.modules.length - 1} onClick={() => edit((c) => { c.modules = move(c.modules, mi, 1); })}><ChevronDown className="size-4" aria-hidden /></IconBtn>
                  <DeleteButton label="Delete module" onConfirm={() => { edit((c) => { c.modules = c.modules.filter((x) => x.id !== m.id); }); setSel({ kind: "course" }); }} />
                </span>
              </div>

              <ul className="mt-1 space-y-0.5 pl-3">
                {m.lessons.map((l, li) => {
                  const lsel: Selection = { kind: "lesson", m: m.id, l: l.id };
                  return (
                    <li key={l.id} className="group/lesson">
                      <div className={row(sameSel(sel, lsel))}>
                        <button type="button" onClick={() => setSel(lsel)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          {l.kind === "video" ? <PlayCircle className="size-4 shrink-0 text-info" aria-hidden /> : <BookOpen className="size-4 shrink-0 text-ink-500" aria-hidden />}
                          <span className="min-w-0 flex-1 truncate">{l.title.trim() || "Untitled lesson"}</span>
                        </button>
                        <span className="flex items-center transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover/lesson:opacity-100">
                          <IconBtn label="Move lesson up" disabled={li === 0} onClick={() => edit((c) => { const mm = c.modules[mi]; if (mm) mm.lessons = move(mm.lessons, li, -1); })}><ChevronUp className="size-4" aria-hidden /></IconBtn>
                          <IconBtn label="Move lesson down" disabled={li === m.lessons.length - 1} onClick={() => edit((c) => { const mm = c.modules[mi]; if (mm) mm.lessons = move(mm.lessons, li, 1); })}><ChevronDown className="size-4" aria-hidden /></IconBtn>
                          <DeleteButton label="Delete lesson" onConfirm={() => { edit((c) => { const mm = c.modules[mi]; if (mm) mm.lessons = mm.lessons.filter((x) => x.id !== l.id); }); setSel(msel); }} />
                        </span>
                        <StatusDot ok={!bad(lsel)} />
                      </div>
                    </li>
                  );
                })}

                {m.quiz ? (
                  <li>
                    <button type="button" onClick={() => setSel({ kind: "quiz", m: m.id })} className={row(sel.kind === "quiz" && sel.m === m.id)}>
                      <HelpCircle className="size-4 shrink-0 text-brand-700" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">Quiz · {m.quiz.questions.length} question{m.quiz.questions.length === 1 ? "" : "s"}</span>
                      <StatusDot ok={!bad({ kind: "quiz", m: m.id })} />
                    </button>
                  </li>
                ) : null}
              </ul>

              <div className="mt-1 flex flex-wrap gap-1 pl-3">
                <button
                  type="button"
                  onClick={() => {
                    const lesson = newLesson(m.lessons.length + 1);
                    edit((c) => { c.modules[mi]?.lessons.push(lesson); });
                    setSel({ kind: "lesson", m: m.id, l: lesson.id });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                >
                  <Plus className="size-3.5" aria-hidden /> Lesson
                </button>
                {!m.quiz ? (
                  <button
                    type="button"
                    onClick={() => {
                      edit((c) => { const mm = c.modules[mi]; if (mm) mm.quiz = newQuiz(); });
                      setSel({ kind: "quiz", m: m.id });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                  >
                    <Plus className="size-3.5" aria-hidden /> Quiz
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          const mod = newModule(course.modules.length + 1);
          edit((c) => { c.modules.push(mod); });
          setSel({ kind: "module", m: mod.id });
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line px-3 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-800"
      >
        <Plus className="size-4" aria-hidden /> Add a module
      </button>

      <div className="pt-3">
        <button type="button" onClick={() => setSel({ kind: "final" })} className={cn(row(sel.kind === "final"), "bg-white ring-1 ring-line")}>
          <Award className="size-4 shrink-0 text-brand-700" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-semibold">{course.finalExam ? "Final exam" : "Final exam (not added)"}</span>
          {course.finalExam ? <StatusDot ok={!bad({ kind: "final" })} /> : null}
        </button>
      </div>
    </nav>
  );
}

// ---- Editors (right column) ---------------------------------------------------------------------------------

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04] sm:p-6">
      <h2 className="text-lg font-bold tracking-tight text-ink-900">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-ink-600">{hint}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function CourseEditor({ course, edit }: { course: StudioCourse; edit: (fn: (c: StudioCourse) => void) => void }) {
  return (
    <Card title="Course details" hint="This is what agencies and learners see first.">
      <Field label="Course name" required>
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={course.title} onChange={(e) => edit((c) => { c.title = e.target.value; })} placeholder="e.g. DBE/ACDBE Certification Program" maxLength={200} />}
      </Field>
      <Field label="Short description" optional hint="One or two sentences about who it is for and what they will learn.">
        {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={3} value={course.description} onChange={(e) => edit((c) => { c.description = e.target.value; })} maxLength={5000} />}
      </Field>
      <Field label="How can learners move through it?">
        {() => (
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceCard name="nav" checked={course.navigationMode === "free"} onChange={() => edit((c) => { c.navigationMode = "free"; })} title="Any order" description="Learners can open any lesson at any time." />
            <ChoiceCard name="nav" checked={course.navigationMode === "sequential"} onChange={() => edit((c) => { c.navigationMode = "sequential"; })} title="Step by step" description="Each lesson unlocks after the one before it." />
          </div>
        )}
      </Field>
      <Field label="Certificate">
        {() => (
          <div className="grid gap-2">
            <ChoiceCard name="cert" checked={course.certificateMode === "final_only"} onChange={() => edit((c) => { c.certificateMode = "final_only"; })} title="One certificate, after the final exam" description="Recommended. Needs a final exam." />
            <ChoiceCard name="cert" checked={course.certificateMode === "module_and_final"} onChange={() => edit((c) => { c.certificateMode = "module_and_final"; })} title="A certificate for each module, plus the final" description="Learners earn a certificate every time they pass a module quiz." />
            <ChoiceCard name="cert" checked={course.certificateMode === "none"} onChange={() => edit((c) => { c.certificateMode = "none"; })} title="No certificate" description="Learners just complete the lessons." />
          </div>
        )}
      </Field>
    </Card>
  );
}

function ModuleEditor({ m, edit }: { m: StudioModule; edit: (fn: (mm: StudioModule) => void) => void }) {
  return (
    <Card title="Module" hint="A module is a chapter. It holds lessons and, if you like, a quiz at the end.">
      <Field label="Module name" required>
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={m.title} onChange={(e) => edit((x) => { x.title = e.target.value; })} maxLength={200} />}
      </Field>
      <Field label="What is this module about?" optional>
        {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={3} value={m.description} onChange={(e) => edit((x) => { x.description = e.target.value; })} maxLength={5000} />}
      </Field>
      <p className="rounded-2xl bg-canvas-soft p-3 text-sm text-ink-600">
        This module has {m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"}{m.quiz ? ` and a ${m.quiz.questions.length}-question quiz` : " and no quiz"}. Use the buttons in the outline on the left to add more.
      </p>
    </Card>
  );
}

function LessonEditor({ lesson, edit }: { lesson: StudioLesson; edit: (fn: (l: StudioLesson) => void) => void }) {
  const vimeo = lesson.videoUrl ? parseVimeoId(lesson.videoUrl) : null;
  return (
    <Card title="Lesson" hint="One lesson can hold a video, written text, or both together: learners watch the video and read your notes right under it.">
      <Field label="Lesson title" required>
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={lesson.title} onChange={(e) => edit((l) => { l.title = e.target.value; })} maxLength={200} />}
      </Field>

      <Field label="What kind of lesson is it?">
        {() => (
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceCard name="kind" checked={lesson.kind === "reading"} onChange={() => edit((l) => { l.kind = "reading"; })} icon={<BookOpen className="size-4" aria-hidden />} title="Text only" description="Written lesson with headings, lists, pictures, tables." />
            <ChoiceCard name="kind" checked={lesson.kind === "video"} onChange={() => edit((l) => { l.kind = "video"; })} icon={<PlayCircle className="size-4" aria-hidden />} title="Video + written notes" description="A Vimeo video with your notes shown under it." />
          </div>
        )}
      </Field>

      {lesson.kind === "video" ? (
        <Field
          label="Vimeo link"
          required
          hint="Paste the video page link (https://vimeo.com/123456789) or just the number."
          error={lesson.videoUrl && !vimeo ? "That does not look like a Vimeo link." : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} value={lesson.videoUrl} onChange={(e) => edit((l) => { l.videoUrl = e.target.value; })} placeholder="https://vimeo.com/123456789" />
          )}
        </Field>
      ) : null}

      {lesson.kind === "video" && vimeo ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-navy-950">
          <iframe title="Video preview" src={vimeoEmbedUrl(vimeo)} className="size-full" allow="fullscreen; picture-in-picture" />
        </div>
      ) : null}

      <Field label={lesson.kind === "video" ? "Written notes (shown under the video)" : "Lesson content"} hint={lesson.kind === "video" ? "A summary, key points, links or a checklist that goes with the video." : undefined} optional={lesson.kind === "video"} required={lesson.kind === "reading"}>
        {() => (
          <RichText
            key={lesson.id}
            value={lesson.html}
            onChange={(html) => edit((l) => { l.html = html; })}
            placeholder={lesson.kind === "video" ? "Add a summary, key points, or links for learners to read…" : "Start writing here. Use the buttons above for headings, lists and links."}
            minHeight={lesson.kind === "video" ? 160 : 320}
          />
        )}
      </Field>

      <Field label="About how many minutes does it take?" hint="Shown to learners so they can plan their time.">
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="number" min={1} max={600} className="max-w-[8rem]" value={lesson.minutes} onChange={(e) => edit((l) => { l.minutes = Math.max(1, Math.min(600, Number(e.target.value) || 1)); })} />}
      </Field>
    </Card>
  );
}

function QuestionCard({ q, index, count, edit, remove, moveBy }: { q: StudioQuestion; index: number; count: number; edit: (fn: (q: StudioQuestion) => void) => void; remove: () => void; moveBy: (by: -1 | 1) => void }) {
  const multi = q.type === "multiple_choice";
  return (
    <div className="rounded-2xl bg-canvas-soft/60 p-4 ring-1 ring-line">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink-900">Question {index + 1}</p>
        <div className="flex items-center gap-1">
          <IconBtn label="Move question up" disabled={index === 0} onClick={() => moveBy(-1)}><ChevronUp className="size-4" aria-hidden /></IconBtn>
          <IconBtn label="Move question down" disabled={index === count - 1} onClick={() => moveBy(1)}><ChevronDown className="size-4" aria-hidden /></IconBtn>
          <DeleteButton showText label="Delete" onConfirm={remove} />
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Question" required>
          {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={2} value={q.prompt} onChange={(e) => edit((x) => { x.prompt = e.target.value; })} maxLength={2000} />}
        </Field>

        <Field label="Type of question">
          {({ id }) => (
            <Select
              id={id}
              value={q.type}
              onChange={(e) =>
                edit((x) => {
                  const t = e.target.value as QuestionType;
                  x.type = t;
                  if (t === "true_false") x.options = [newOption(true, "True"), newOption(false, "False")];
                  else if (x.options.length < 3 || (x.options[0]?.text === "True" && x.options.length === 2)) x.options = [newOption(true), newOption(), newOption(), newOption()];
                  else if (t === "single_choice") {
                    let seen = false;
                    x.options.forEach((o) => { if (o.correct && seen) o.correct = false; seen = seen || o.correct; });
                  }
                })
              }
            >
              <option value="single_choice">Pick one answer</option>
              <option value="multiple_choice">Pick all that apply</option>
              <option value="true_false">True or false</option>
            </Select>
          )}
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink-900">Answers <span className="font-normal text-ink-600">— tick the correct {multi ? "ones" : "one"}</span></legend>
          <ul className="space-y-2">
            {q.options.map((o, oi) => (
              <li key={o.id} className="flex items-center gap-2">
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={`correct-${q.id}`}
                  checked={o.correct}
                  aria-label={`Answer ${oi + 1} is correct`}
                  onChange={() =>
                    edit((x) => {
                      if (multi) { const t = x.options[oi]; if (t) t.correct = !t.correct; }
                      else x.options.forEach((p, pi) => { p.correct = pi === oi; });
                    })
                  }
                  className="size-5 shrink-0 accent-brand-700"
                />
                <Input
                  aria-label={`Answer ${oi + 1}`}
                  value={o.text}
                  readOnly={q.type === "true_false"}
                  onChange={(e) => edit((x) => { const t = x.options[oi]; if (t) t.text = e.target.value; })}
                  placeholder={`Answer ${oi + 1}`}
                  maxLength={500}
                />
                {q.type !== "true_false" && q.options.length > 2 ? (
                  <IconBtn label="Remove this answer" onClick={() => edit((x) => { x.options = x.options.filter((p) => p.id !== o.id); })}><X className="size-4" aria-hidden /></IconBtn>
                ) : null}
              </li>
            ))}
          </ul>
          {q.type !== "true_false" && q.options.length < 8 ? (
            <button type="button" onClick={() => edit((x) => { x.options.push(newOption()); })} className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50">
              <Plus className="size-3.5" aria-hidden /> Add another answer
            </button>
          ) : null}
        </fieldset>

        <Field label="Explain the answer" optional hint="Shown to learners after they submit, to help them learn.">
          {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={2} value={q.explanation} onChange={(e) => edit((x) => { x.explanation = e.target.value; })} maxLength={2000} />}
        </Field>
      </div>
    </div>
  );
}

function QuizEditor({ m, edit }: { m: StudioModule; edit: (fn: (mm: StudioModule) => void) => void }) {
  const quiz = m.quiz;
  if (!quiz) return null;
  return (
    <Card title={`Quiz — ${m.title.trim() || "this module"}`} hint="Learners take this after the lessons. Questions are marked automatically.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pass mark (%)" hint="The score needed to pass.">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="number" min={1} max={100} value={quiz.passingScore} onChange={(e) => edit((x) => { if (x.quiz) x.quiz.passingScore = Math.max(1, Math.min(100, Number(e.target.value) || 1)); })} />}
        </Field>
        <Field label="Tries allowed" hint="Leave empty for unlimited.">
          {({ id, describedBy }) => (
            <Input id={id} aria-describedby={describedBy} type="number" min={1} max={20} value={quiz.maxAttempts ?? ""} placeholder="Unlimited" onChange={(e) => edit((x) => { if (x.quiz) x.quiz.maxAttempts = e.target.value === "" ? null : Math.max(1, Math.min(20, Number(e.target.value) || 1)); })} />
          )}
        </Field>
      </div>

      <div className="space-y-4">
        {quiz.questions.map((q, qi) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={qi}
            count={quiz.questions.length}
            edit={(fn) => edit((x) => { const t = x.quiz?.questions[qi]; if (t) fn(t); })}
            remove={() => edit((x) => { if (x.quiz) x.quiz.questions = x.quiz.questions.filter((p) => p.id !== q.id); })}
            moveBy={(by) => edit((x) => { if (x.quiz) x.quiz.questions = move(x.quiz.questions, qi, by); })}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" icon={<Plus className="size-4" aria-hidden />} onClick={() => edit((x) => { x.quiz?.questions.push(newQuestion()); })}>Add a question</Button>
        <DeleteButton showText label="Remove the whole quiz" className="h-9 px-3" onConfirm={() => edit((x) => { x.quiz = null; })} />
      </div>
    </Card>
  );
}

function FinalEditor({ course, edit }: { course: StudioCourse; edit: (fn: (c: StudioCourse) => void) => void }) {
  const f = course.finalExam;
  const pool = finalPool(course);
  const total = poolSize(course);
  if (!f) {
    return (
      <Card title="Final exam" hint="One exam at the end of the course. Learners must pass it to earn the certificate.">
        <p className="text-sm text-ink-700">There is no final exam yet. {course.certificateMode === "final_only" ? "Certificates are given after the final exam, so you need one." : ""}</p>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => edit((c) => { c.finalExam = newFinal(c); })}>Add a final exam</Button>
      </Card>
    );
  }
  const excluded = new Set(f.excluded);
  const setExcluded = (ids: string[], out: boolean) =>
    edit((c) => {
      if (!c.finalExam) return;
      const next = new Set(c.finalExam.excluded);
      ids.forEach((id) => (out ? next.add(id) : next.delete(id)));
      c.finalExam.excluded = [...next];
    });
  const allIds = course.modules.flatMap((m) => (m.quiz?.questions ?? []).map((q) => q.id));

  return (
    <div className="space-y-5">
      <Card title="Final exam" hint="Learners get a random set of questions from the pool below. Build the pool from your module quizzes, from questions written just for the final, or both.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pass mark (%)">
            {({ id }) => <Input id={id} type="number" min={1} max={100} value={f.passingScore} onChange={(e) => edit((c) => { if (c.finalExam) c.finalExam.passingScore = Math.max(1, Math.min(100, Number(e.target.value) || 1)); })} />}
          </Field>
          <Field label="Tries allowed" hint="Empty = unlimited.">
            {({ id }) => <Input id={id} type="number" min={1} max={20} placeholder="Unlimited" value={f.maxAttempts ?? ""} onChange={(e) => edit((c) => { if (c.finalExam) c.finalExam.maxAttempts = e.target.value === "" ? null : Math.max(1, Math.min(20, Number(e.target.value) || 1)); })} />}
          </Field>
          <Field label="Questions each learner gets" hint={`${pool} in the pool.`} error={f.questionCount > pool ? `Only ${pool} available.` : undefined}>
            {({ id, invalid }) => <Input id={id} invalid={invalid} type="number" min={1} max={500} value={f.questionCount} onChange={(e) => edit((c) => { if (c.finalExam) c.finalExam.questionCount = Math.max(1, Number(e.target.value) || 1); })} />}
          </Field>
        </div>
        <p className="rounded-2xl bg-canvas-soft p-3 text-sm text-ink-700">
          <b>Pool: {pool} question{pool === 1 ? "" : "s"}</b> ({pool - f.extraQuestions.length} from module quizzes + {f.extraQuestions.length} written for the final). Each learner is asked {Math.min(f.questionCount, pool)} of them, picked at random.
        </p>
        <DeleteButton showText label="Remove the final exam" className="h-9 w-fit px-3" onConfirm={() => edit((c) => { c.finalExam = null; })} />
      </Card>

      <Card title="Questions from your module quizzes" hint="Tick the questions that can appear on the final exam. New quiz questions you add later are included automatically.">
        {total === 0 ? (
          <p className="text-sm text-ink-600">No module quiz has questions yet. Add a quiz to a module, or write questions for the final below.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setExcluded(allIds, false)}>Select all</Button>
              <Button size="sm" variant="secondary" onClick={() => setExcluded(allIds, true)}>Select none</Button>
              <span className="text-sm text-ink-600">{total - f.excluded.filter((id) => allIds.includes(id)).length} of {total} selected</span>
            </div>
            <div className="space-y-3">
              {course.modules.map((m, mi) => {
                const qs = m.quiz?.questions ?? [];
                if (qs.length === 0) return null;
                const ids = qs.map((q) => q.id);
                const picked = ids.filter((id) => !excluded.has(id)).length;
                return (
                  <details key={m.id} open={course.modules.length <= 3} className="group rounded-2xl ring-1 ring-line">
                    <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 hover:bg-canvas-soft">
                      <input
                        type="checkbox"
                        aria-label={`Select every question from ${m.title}`}
                        checked={picked === ids.length}
                        ref={(el) => { if (el) el.indeterminate = picked > 0 && picked < ids.length; }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setExcluded(ids, !e.target.checked)}
                        className="size-5 accent-brand-700"
                      />
                      <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-navy-900 text-[11px] font-bold text-white">{mi + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-ink-900">{m.title || "Untitled module"}</span>
                      <span className="text-xs text-ink-600">{picked}/{ids.length}</span>
                      <ChevronDown className="size-4 text-ink-500 transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <ul className="divide-y divide-line border-t border-line">
                      {qs.map((q, qi) => (
                        <li key={q.id}>
                          <label className="flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-canvas-soft/60">
                            <input type="checkbox" checked={!excluded.has(q.id)} onChange={(e) => setExcluded([q.id], !e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-700" />
                            <span className="text-sm text-ink-800"><span className="font-semibold text-ink-500">Q{qi + 1}.</span> {q.prompt.trim() || "(question not written yet)"}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Card title="Questions only for the final exam" hint="Optional. These never appear in a module quiz.">
        <div className="space-y-4">
          {f.extraQuestions.map((q, qi) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={qi}
              count={f.extraQuestions.length}
              edit={(fn) => edit((c) => { const t = c.finalExam?.extraQuestions[qi]; if (t) fn(t); })}
              remove={() => edit((c) => { if (c.finalExam) c.finalExam.extraQuestions = c.finalExam.extraQuestions.filter((p) => p.id !== q.id); })}
              moveBy={(by) => edit((c) => { if (c.finalExam) c.finalExam.extraQuestions = move(c.finalExam.extraQuestions, qi, by); })}
            />
          ))}
        </div>
        <Button variant="soft" icon={<Plus className="size-4" aria-hidden />} onClick={() => edit((c) => { c.finalExam?.extraQuestions.push(newQuestion()); })}>Write a question for the final</Button>
      </Card>
    </div>
  );
}


// ---- Learner preview ----------------------------------------------------------------------------------------

function Preview({ course, sel }: { course: StudioCourse; sel: Selection }) {
  const mod = "m" in sel ? course.modules.find((x) => x.id === sel.m) : undefined;
  const lesson = sel.kind === "lesson" ? mod?.lessons.find((l) => l.id === sel.l) : undefined;
  const vimeo = lesson?.kind === "video" ? parseVimeoId(lesson.videoUrl) : null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04] sm:p-8" aria-label="Learner preview">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-info-bg px-3 py-1 text-xs font-bold text-info">
        <Eye className="size-3.5" aria-hidden /> This is how learners will see it
      </p>
      {lesson ? (
        <article>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{mod?.title}</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900">{lesson.title || "Untitled lesson"}</h2>
          <p className="mt-1 text-sm text-ink-600">About {lesson.minutes} min</p>
          {lesson.kind === "video" ? (
            vimeo ? (
              <div className="mt-5 aspect-video overflow-hidden rounded-2xl bg-navy-950">
                <iframe title="Video preview" src={vimeoEmbedUrl(vimeo)} className="size-full" allow="fullscreen; picture-in-picture" />
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-warn-bg p-4 text-sm text-warn">Add a Vimeo link to see the video here.</p>
            )
          ) : null}
          <div className={cn("mt-5", LESSON_PROSE)} dangerouslySetInnerHTML={{ __html: lesson.html || '<p class="text-ink-500">No content yet.</p>' }} />
        </article>
      ) : sel.kind === "quiz" && mod?.quiz ? (
        <article>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">{mod.title} — Quiz</h2>
          <p className="mt-1 text-sm text-ink-600">Pass mark {mod.quiz.passingScore}% · {mod.quiz.maxAttempts ? `${mod.quiz.maxAttempts} tries` : "Unlimited tries"}</p>
          <ol className="mt-5 space-y-6">
            {mod.quiz.questions.map((q, i) => (
              <li key={q.id}>
                <p className="font-semibold text-ink-900">{i + 1}. {q.prompt || "(question not written yet)"}</p>
                <ul className="mt-2 space-y-2">
                  {q.options.map((o) => (
                    <li key={o.id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ring-1", o.correct ? "bg-ok-bg/60 ring-ok/30" : "ring-line")}>
                      <span className={cn("grid size-5 place-items-center border-2", q.type === "multiple_choice" ? "rounded-md" : "rounded-full", o.correct ? "border-ok bg-ok text-white" : "border-ink-300")}>{o.correct ? <Check className="size-3" aria-hidden /> : null}</span>
                      {o.text || "(empty answer)"}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-ink-500">Learners do not see the highlighted answer until they submit.</p>
              </li>
            ))}
          </ol>
        </article>
      ) : sel.kind === "module" && mod ? (
        <article>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">{mod.title}</h2>
          {mod.description ? <p className="mt-2 text-ink-700">{mod.description}</p> : null}
          <ul className="mt-5 divide-y divide-line rounded-2xl ring-1 ring-line">
            {mod.lessons.map((l, i) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="grid size-7 place-items-center rounded-full bg-canvas-soft text-xs font-bold text-ink-700">{i + 1}</span>
                <span className="flex-1 font-medium text-ink-900">{l.title}</span>
                <span className="text-ink-500">{l.minutes} min</span>
              </li>
            ))}
            {mod.quiz ? <li className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-800"><HelpCircle className="size-4" aria-hidden /> Quiz</li> : null}
          </ul>
        </article>
      ) : (
        <article>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">{course.title || "Untitled course"}</h2>
          {course.description ? <p className="mt-2 text-ink-700">{course.description}</p> : null}
          <p className="mt-4 text-sm text-ink-600">{course.modules.length} modules · {lessonCount(course)} lessons{course.finalExam ? " · final exam" : ""}</p>
          <ol className="mt-4 space-y-2">
            {course.modules.map((m, i) => (
              <li key={m.id} className="rounded-2xl bg-canvas-soft px-4 py-3 text-sm"><span className="font-bold text-ink-900">{i + 1}. {m.title}</span> <span className="text-ink-600">— {m.lessons.length} lessons{m.quiz ? ", quiz" : ""}</span></li>
            ))}
          </ol>
        </article>
      )}
    </section>
  );
}

// ---- Publish ------------------------------------------------------------------------------------------------

function PublishDialog({
  open,
  onClose,
  course,
  problems,
  onJump,
  onDone,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  course: StudioCourse;
  problems: Problem[];
  onJump: (s: Selection) => void;
  onDone: () => void;
  editing: boolean;
}) {
  const [sell, setSell] = useState(true);
  const [name, setName] = useState("");
  const [annual, setAnnual] = useState("");
  const [monthly, setMonthly] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);
  const toast = useToast();
  const submitting = useRef(false);

  useEffect(() => {
    if (open) { setError(null); setName((n) => n || course.title); }
  }, [open, course.title]);

  const annualCents = Math.round(Number(annual) * 100);
  const monthlyCents = monthly.trim() ? Math.round(Number(monthly) * 100) : undefined;
  const priceOk = !sell || editing || (Number.isFinite(annualCents) && annualCents >= 50 && (monthlyCents === undefined || (Number.isFinite(monthlyCents) && monthlyCents >= 50)));
  const canPublish = problems.length === 0 && priceOk && !busy && (!sell || editing || name.trim().length > 0);

  async function publish() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await studioApi.publish(course, !editing && sell ? { sell: { name: name.trim(), annualCents, ...(monthlyCents ? { monthlyCents } : {}) } } : {});
      setResult(res);
      onDone();
      toast.success("Course published", `${res.modules} modules, ${res.lessons} lessons`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publishing failed. Nothing was lost; your draft is still here.");
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  if (result) {
    return (
      <Modal open={open} onClose={onClose} title="Your course is live" description={`Version ${result.versionNo} is published.`} footer={<><Link href="/admin/content" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-canvas-soft">Back to courses</Link><ButtonLink href={editing || result.productPublicId ? "/admin/courses" : `/admin/courses?sell=${result.coursePublicId}`} variant="primary">{editing || result.productPublicId ? "See the catalog" : "Set a price and sell it"}</ButtonLink></>}>
        <div className="flex items-start gap-3 rounded-2xl bg-ok-bg p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          <div className="text-sm text-ink-800">
            <p className="font-bold text-ok">{result.modules} modules · {result.lessons} lessons · {result.questions} quiz questions</p>
            <p className="mt-1">{editing ? "Agencies that bought an earlier version keep it. New purchases get this version." : result.productPublicId ? "It is on sale now. Agencies can find it under Buy seats." : "It is not on sale yet. Press the button to set a price and put it on sale."}</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Publish a new version" : "Publish this course"}
      description={editing ? "Learners who already bought keep the version they bought. New buyers get this one." : "Publishing locks the content so what agencies buy never changes under them."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Keep editing</Button>
          <Button loading={busy} disabled={!canPublish} icon={<Rocket className="size-4" aria-hidden />} onClick={() => void publish()}>{!editing && sell ? "Publish and put on sale" : "Publish"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[["Modules", course.modules.length], ["Lessons", lessonCount(course)], ["Quiz questions", poolSize(course)]].map(([label, n]) => (
            <div key={label as string} className="rounded-2xl bg-canvas-soft py-3"><p className="text-2xl font-extrabold text-ink-900">{n}</p><p className="text-xs text-ink-600">{label}</p></div>
          ))}
        </div>

        {problems.length > 0 ? (
          <div className="rounded-2xl bg-warn-bg p-4" role="alert">
            <p className="flex items-center gap-2 text-sm font-bold text-warn"><AlertCircle className="size-4" aria-hidden /> Fix these first ({problems.length})</p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
              {problems.slice(0, 30).map((p, i) => (
                <li key={i}><button type="button" className="text-left text-ink-800 underline decoration-warn/40 underline-offset-2 hover:text-brand-800" onClick={() => { onJump(p.target); onClose(); }}>{p.message}</button></li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-ok-bg p-3 text-sm font-semibold text-ok"><CheckCircle2 className="size-4" aria-hidden /> Everything is filled in. Ready to publish.</p>
        )}

        {!editing ? (
          <div className="space-y-4 rounded-2xl p-4 ring-1 ring-line">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={sell} onChange={(e) => setSell(e.target.checked)} className="mt-1 size-5 accent-brand-700" />
              <span><span className="block text-sm font-bold text-ink-900">Put it on sale now</span><span className="block text-sm text-ink-600">Agencies can buy seats right after you publish. You can change the price later.</span></span>
            </label>
            {sell ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name agencies see" className="sm:col-span-2">{({ id }) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />}</Field>
                <Field label="Price per seat, per year (USD)" required>{({ id }) => <Input id={id} type="number" inputMode="decimal" min="0.5" step="0.01" placeholder="999.00" value={annual} onChange={(e) => setAnnual(e.target.value)} />}</Field>
                <Field label="Per month (USD)" optional>{({ id }) => <Input id={id} type="number" inputMode="decimal" min="0.5" step="0.01" placeholder="99.00" value={monthly} onChange={(e) => setMonthly(e.target.value)} />}</Field>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p role="alert" className="rounded-xl bg-bad-bg p-3 text-sm text-bad">{error}</p> : null}
      </div>
    </Modal>
  );
}

// ---- The builder --------------------------------------------------------------------------------------------

function GuideBar({ course, problems }: { course: StudioCourse; problems: Problem[] }) {
  const steps = [
    { label: "Name your course", done: !!course.title.trim() },
    { label: "Write the lessons", done: course.modules.length > 0 && !problems.some((p) => p.target.kind === "lesson" || p.target.kind === "module") },
    { label: "Add quizzes (optional)", done: course.modules.some((m) => m.quiz && m.quiz.questions.length > 0) },
    { label: "Add the final exam", done: !!course.finalExam },
    { label: "Publish", done: false },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Steps to publish">
      {steps.map((s, i) => (
        <li key={s.label} className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold", s.done ? "bg-ok-bg text-ok" : i === current ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200" : "bg-white text-ink-500 ring-1 ring-line")}>
          {s.done ? <Check className="size-3.5" aria-hidden /> : <span className="grid size-4 place-items-center rounded-full bg-current/10 text-[10px]">{i + 1}</span>}
          {s.label}
        </li>
      ))}
    </ol>
  );
}

export function StudioBuilder({ courseUuid }: { courseUuid: string | null }) {
  const draftKey = `cpmi-studio-draft:${courseUuid ?? "new"}`;
  const [course, setCourse] = useState<StudioCourse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sel, setSel] = useState<Selection>({ kind: "course" });
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [publishOpen, setPublishOpen] = useState(false);
  const [restored, setRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dirty = useRef(false);
  const qc = useQueryClient();
  const editorTop = useRef<HTMLDivElement>(null);

  // Load: the saved draft if there is one, otherwise the existing course (new version) or a blank course.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(draftKey) : null;
        if (stored) {
          let parsed: StudioCourse | null = null;
          try { parsed = normalizeDraft(JSON.parse(stored)); } catch { parsed = null; }
          if (!cancelled && parsed) { setCourse(parsed); setRestored(true); return; }
          window.localStorage.removeItem(draftKey); // unusable draft: ignore it
        }
        if (courseUuid) {
          const loaded = await studioApi.load(courseUuid);
          if (!cancelled) setCourse(loaded);
        } else if (!cancelled) setCourse(emptyCourse());
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Could not open this course.");
      }
    })();
    return () => { cancelled = true; };
  }, [courseUuid, draftKey]);

  // Autosave (browser only) so a closed tab or a crash never loses work.
  useEffect(() => {
    if (!course || !dirty.current) return;
    const t = setTimeout(() => {
      try { window.localStorage.setItem(draftKey, JSON.stringify(course)); setSavedAt(Date.now()); } catch { /* storage full or blocked: keep working */ }
    }, 600);
    return () => clearTimeout(t);
  }, [course, draftKey]);

  const edit = useCallback((fn: (c: StudioCourse) => void) => {
    dirty.current = true;
    setCourse((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const problems = useMemo(() => (course ? courseProblems(course) : []), [course]);

  const select = (s: Selection) => {
    setSel(s);
    editorTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loadError) return <p role="alert" className="rounded-2xl bg-bad-bg p-4 text-sm text-bad">{loadError}</p>;
  if (!course) return <div className="h-96 animate-pulse rounded-3xl bg-white/60" aria-busy aria-label="Loading" />;

  const mod = "m" in sel ? course.modules.find((x) => x.id === sel.m) : undefined;
  const lesson = sel.kind === "lesson" ? mod?.lessons.find((l) => l.id === sel.l) : undefined;
  const editing = !!courseUuid;

  const editModule = (fn: (m: StudioModule) => void) => edit((c) => { const t = c.modules.find((x) => x.id === (sel as { m: string }).m); if (t) fn(t); });
  const editLesson = (fn: (l: StudioLesson) => void) =>
    edit((c) => {
      const t = c.modules.find((x) => x.id === (sel as { m: string }).m)?.lessons.find((l) => l.id === (sel as { l: string }).l);
      if (t) fn(t);
    });

  function startOver() {
    window.localStorage.removeItem(draftKey);
    dirty.current = false;
    setRestored(false);
    setSel({ kind: "course" });
    setCourse(null);
    setLoadError(null);
    (async () => {
      try { setCourse(courseUuid ? await studioApi.load(courseUuid) : emptyCourse()); } catch (e) { setLoadError(e instanceof Error ? e.message : "Could not reload."); }
    })();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-800"><ArrowLeft className="size-4" aria-hidden /> All courses</Link>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{editing ? `New version: ${course.title || "Untitled"}` : course.title.trim() || "New course"}</h1>
          <p className="mt-1 text-xs text-ink-500" aria-live="polite">{savedAt ? "Draft saved on this computer" : editing ? "Changes are saved here until you publish." : "Your work is saved automatically as you type."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-line" role="group" aria-label="View">
            <button type="button" onClick={() => setMode("edit")} aria-pressed={mode === "edit"} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold", mode === "edit" ? "bg-navy-900 text-white" : "text-ink-700")}><Pencil className="size-4" aria-hidden /> Edit</button>
            <button type="button" onClick={() => setMode("preview")} aria-pressed={mode === "preview"} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold", mode === "preview" ? "bg-navy-900 text-white" : "text-ink-700")}><Eye className="size-4" aria-hidden /> Preview</button>
          </div>
          <Button icon={<Rocket className="size-4" aria-hidden />} onClick={() => setPublishOpen(true)}>
            Publish{problems.length ? <Badge tone="warn" className="ml-1">{problems.length} to fix</Badge> : null}
          </Button>
        </div>
      </div>

      <div className="mb-5"><GuideBar course={course} problems={problems} /></div>

      {restored ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-info-bg p-3 text-sm text-info" role="status">
          <span className="flex items-center gap-2"><Lightbulb className="size-4" aria-hidden /> We restored the draft you were working on.</span>
          <button type="button" className="font-semibold underline" onClick={startOver}>Start over</button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto lg:pr-1" data-lenis-prevent>
          <Outline course={course} sel={sel} setSel={select} edit={edit} problems={problems} />
        </aside>

        <div ref={editorTop} className="min-w-0 scroll-mt-4 space-y-5">
          {mode === "preview" ? (
            <Preview course={course} sel={sel} />
          ) : sel.kind === "course" ? (
            <>
              {course.modules.length === 1 && !course.title.trim() ? (
                <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 p-6 text-white">
                  <p className="text-lg font-bold">Build your course in a few minutes</p>
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-white/85">
                    <li>Name the course below.</li>
                    <li>Click a module or lesson on the left to write it. Use <b>+ Lesson</b>, <b>+ Quiz</b> and <b>Add a module</b> to grow it.</li>
                    <li>Press <b>Preview</b> to see what learners will see, then <b>Publish</b>.</li>
                  </ol>
                </div>
              ) : null}
              <CourseEditor course={course} edit={edit} />
            </>
          ) : sel.kind === "module" && mod ? (
            <ModuleEditor m={mod} edit={editModule} />
          ) : sel.kind === "lesson" && lesson ? (
            <LessonEditor lesson={lesson} edit={editLesson} />
          ) : sel.kind === "quiz" && mod?.quiz ? (
            <QuizEditor m={mod} edit={editModule} />
          ) : sel.kind === "final" ? (
            <FinalEditor course={course} edit={edit} />
          ) : (
            <Card title="Pick something to edit"><p className="text-sm text-ink-600">Choose a module, lesson or quiz from the outline on the left.</p></Card>
          )}
        </div>
      </div>

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        course={course}
        problems={problems}
        editing={editing}
        onJump={(s) => { setMode("edit"); select(s); }}
        onDone={() => {
          window.localStorage.removeItem(draftKey);
          dirty.current = false;
          for (const k of ["studio-overview", "studio-courses", "catalog", "store"]) void qc.invalidateQueries({ queryKey: [k] });
        }}
      />
    </div>
  );
}
