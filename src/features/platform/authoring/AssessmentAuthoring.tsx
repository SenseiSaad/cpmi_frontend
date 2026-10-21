"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { EmptyState, errorMessage } from "@/components/shared/QueryState";
import { platformApi, type PlatformCourse, type QuestionType } from "../api";
import { btnDark, btnLight, Field, Notice, Panel, StatusPill, useFlash } from "../ui";
import type { Workspace, WorkspaceAssessment, WorkspaceAssessmentVersion, WorkspaceQuestion } from "./workspace";

const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

type UpdateWorkspace = (fn: (current: Workspace) => Workspace) => void;

function patchAssessment(update: UpdateWorkspace, publicId: string, fn: (a: WorkspaceAssessment) => WorkspaceAssessment) {
  update((ws) => ({ ...ws, assessments: ws.assessments.map((a) => (a.publicId === publicId ? fn(a) : a)) }));
}

function patchVersion(update: UpdateWorkspace, publicId: string, versionId: string, fn: (v: WorkspaceAssessmentVersion) => WorkspaceAssessmentVersion) {
  patchAssessment(update, publicId, (a) => ({ ...a, versions: a.versions.map((v) => (v.id === versionId ? fn(v) : v)) }));
}

export function AssessmentsPanel({ course, workspace, update }: { course: PlatformCourse; workspace: Workspace; update: UpdateWorkspace }) {
  const flash = useFlash();
  const [code, setCode] = useState("");
  const [assessmentType, setAssessmentType] = useState<"final" | "module">("final");
  const [modulePublicId, setModulePublicId] = useState("");

  const create = useMutation({
    mutationFn: () =>
      platformApi.createAssessment(
        assessmentType === "final"
          ? { code: code.trim(), assessmentType, coursePublicId: course.uuid }
          : { code: code.trim(), assessmentType, modulePublicId }
      ),
    onSuccess: (result) => {
      update((ws) => ({
        ...ws,
        assessments: [
          ...ws.assessments,
          {
            publicId: result.assessment.publicId,
            code: code.trim(),
            assessmentType,
            modulePublicId: assessmentType === "module" ? modulePublicId : undefined,
            versions: []
          }
        ]
      }));
      setCode("");
      flash.success("Assessment created. Add a version next.");
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim().length < 2 || !CODE.test(code.trim())) return flash.error("Assessment code must be alphanumeric (may include . _ -).");
    if (assessmentType === "module" && !modulePublicId) return flash.error("Choose the module this assessment belongs to.");
    create.mutate();
  };

  return (
    <Panel
      title="3 · Assessments & questions"
      description="Publish assessments before agencies purchase: published versions are frozen into each seat grant."
    >
      <div className="space-y-4">
        {flash.node}
        <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
          <Field label="Assessment code" htmlFor="as-code">
            <input id="as-code" className="input font-mono" maxLength={80} value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field label="Kind" htmlFor="as-type">
            <select id="as-type" className="input" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value as "final" | "module")}>
              <option value="final">Final exam (this course)</option>
              <option value="module">Module quiz</option>
            </select>
          </Field>
          {assessmentType === "module" ? (
            <Field label="Module" htmlFor="as-module">
              <select id="as-module" className="input" value={modulePublicId} onChange={(e) => setModulePublicId(e.target.value)}>
                <option value="">Select a module…</option>
                {workspace.modules.map((m) => (
                  <option key={m.publicId} value={m.publicId}>
                    {m.code}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <span />
          )}
          <button type="submit" className={btnDark} disabled={create.isPending}>
            <Plus size={13} /> Create
          </button>
        </form>

        {workspace.assessments.length === 0 ? (
          <EmptyState title="No assessments in this workspace" />
        ) : (
          workspace.assessments.map((a) => <AssessmentCard key={a.publicId} assessment={a} workspace={workspace} update={update} />)
        )}
      </div>
    </Panel>
  );
}

function AssessmentCard({ assessment, workspace, update }: { assessment: WorkspaceAssessment; workspace: Workspace; update: UpdateWorkspace }) {
  const flash = useFlash();
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState("70");
  const [questionCount, setQuestionCount] = useState("10");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [scorePolicy, setScorePolicy] = useState<"highest" | "latest">("highest");
  const [feedbackMode, setFeedbackMode] = useState<"immediate" | "after_submit" | "after_pass">("after_submit");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleAnswers, setShuffleAnswers] = useState(true);

  const create = useMutation({
    mutationFn: (input: { passing: number; count: number; attempts: number | undefined }) =>
      platformApi.createAssessmentVersion(assessment.publicId, {
        title: title.trim(),
        passingScore: input.passing,
        questionCount: input.count,
        maxAttempts: input.attempts,
        scorePolicy,
        feedbackMode,
        shuffleQuestions,
        shuffleAnswers
      }),
    onSuccess: (result, input) => {
      patchAssessment(update, assessment.publicId, (a) => ({
        ...a,
        versions: [
          ...a.versions,
          { id: result.version.id, versionNo: result.version.versionNo, title: title.trim(), questionCount: input.count, published: false, questions: [] }
        ]
      }));
      setTitle("");
      flash.success(`Assessment version v${result.version.versionNo} created.`);
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const passing = Number(passingScore);
    const count = Number(questionCount);
    const attempts = maxAttempts.trim() ? Number(maxAttempts) : undefined;
    if (!title.trim()) return flash.error("Version title is required.");
    if (!Number.isFinite(passing) || passing < 0 || passing > 100) return flash.error("Passing score must be 0–100.");
    if (!Number.isInteger(count) || count < 1 || count > 200) return flash.error("Questions per attempt must be 1–200.");
    if (attempts !== undefined && (!Number.isInteger(attempts) || attempts < 1 || attempts > 100)) return flash.error("Max attempts must be 1–100.");
    create.mutate({ passing, count, attempts });
  };

  const moduleCode = workspace.modules.find((m) => m.publicId === assessment.modulePublicId)?.code;

  return (
    <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-black text-gray-900">
          <ClipboardCheck size={14} className="text-primary-700" />
          {assessment.code}
          <span className="font-medium text-gray-500">
            {assessment.assessmentType === "final" ? "Final exam" : `Module quiz${moduleCode ? ` · ${moduleCode}` : ""}`}
          </span>
        </span>
        <span className="font-mono text-[10px] text-gray-400">{assessment.publicId}</span>
      </div>
      {flash.node}

      <form onSubmit={submit} className="grid sm:grid-cols-4 gap-2 items-end rounded-2xl bg-gray-50 border border-gray-100 p-3">
        <div className="sm:col-span-2">
          <Field label="New version title" htmlFor={`av-title-${assessment.publicId}`}>
            <input id={`av-title-${assessment.publicId}`} className="input" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Passing score (%)" htmlFor={`av-pass-${assessment.publicId}`}>
          <input id={`av-pass-${assessment.publicId}`} type="number" min="0" max="100" className="input" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
        </Field>
        <Field label="Questions per attempt" htmlFor={`av-count-${assessment.publicId}`}>
          <input id={`av-count-${assessment.publicId}`} type="number" min="1" max="200" className="input" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
        </Field>
        <Field label="Max attempts" htmlFor={`av-att-${assessment.publicId}`}>
          <input id={`av-att-${assessment.publicId}`} type="number" min="1" max="100" className="input" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
        </Field>
        <Field label="Score policy" htmlFor={`av-policy-${assessment.publicId}`}>
          <select id={`av-policy-${assessment.publicId}`} className="input" value={scorePolicy} onChange={(e) => setScorePolicy(e.target.value as "highest" | "latest")}>
            <option value="highest">Highest attempt</option>
            <option value="latest">Latest attempt</option>
          </select>
        </Field>
        <Field label="Feedback" htmlFor={`av-fb-${assessment.publicId}`}>
          <select
            id={`av-fb-${assessment.publicId}`}
            className="input"
            value={feedbackMode}
            onChange={(e) => setFeedbackMode(e.target.value as "immediate" | "after_submit" | "after_pass")}
          >
            <option value="after_submit">After submit</option>
            <option value="immediate">Immediate</option>
            <option value="after_pass">After passing</option>
          </select>
        </Field>
        <div className="flex flex-col gap-1 text-[11px] font-semibold text-gray-600">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} /> Shuffle questions
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={shuffleAnswers} onChange={(e) => setShuffleAnswers(e.target.checked)} /> Shuffle answers
          </label>
        </div>
        <div className="sm:col-span-4 flex justify-end">
          <button type="submit" className={btnLight} disabled={create.isPending}>
            <Plus size={13} /> Draft version
          </button>
        </div>
      </form>

      {assessment.versions.map((v) => (
        <AssessmentVersionEditor key={v.id} assessmentPublicId={assessment.publicId} version={v} update={update} />
      ))}
    </div>
  );
}

function AssessmentVersionEditor({
  assessmentPublicId,
  version,
  update
}: {
  assessmentPublicId: string;
  version: WorkspaceAssessmentVersion;
  update: UpdateWorkspace;
}) {
  const flash = useFlash();
  const attached = version.questions.filter((q) => q.attached).length;

  const publish = useMutation({
    mutationFn: () => platformApi.publishAssessmentVersion(version.id),
    onSuccess: () => {
      patchVersion(update, assessmentPublicId, version.id, (v) => ({ ...v, published: true }));
      flash.success("Assessment version published.");
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-black text-gray-900">
          v{version.versionNo} · {version.title} — {attached} question{attached === 1 ? "" : "s"} in bank, {version.questionCount} per attempt
        </h4>
        {version.published ? (
          <StatusPill status="published" />
        ) : (
          <button
            type="button"
            className={btnDark}
            disabled={publish.isPending || attached < version.questionCount}
            title={attached < version.questionCount ? `Add at least ${version.questionCount} questions first` : undefined}
            onClick={() => window.confirm("Publish this assessment version? Its questions become immutable.") && publish.mutate()}
          >
            Publish assessment version
          </button>
        )}
      </div>
      {flash.node}
      {version.questions.length > 0 && (
        <ol className="space-y-1.5">
          {version.questions.map((q, index) => (
            <li key={q.questionVersionId} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2 text-xs">
              <span className="truncate">
                <span className="font-bold text-gray-900">
                  {index + 1}. {q.prompt}
                </span>
                <span className="ml-2 text-gray-400">{q.type.replace(/_/g, " ")}</span>
              </span>
              <StatusPill status={q.attached ? "active" : q.published ? "published" : "draft"} />
            </li>
          ))}
        </ol>
      )}
      {!version.published && (
        <QuestionForm
          assessmentVersionId={version.id}
          nextPosition={attached + 1}
          onAdded={(question) =>
            patchVersion(update, assessmentPublicId, version.id, (v) => ({
              ...v,
              questions: [...v.questions.filter((q) => q.questionVersionId !== question.questionVersionId), question]
            }))
          }
        />
      )}
    </div>
  );
}

interface OptionDraft {
  text: string;
  correct: boolean;
}
interface PairDraft {
  left: string;
  right: string;
}

const AUTHORABLE: { value: QuestionType; label: string }[] = [
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / false" },
  { value: "matching", label: "Matching" }
];

function QuestionForm({
  assessmentVersionId,
  nextPosition,
  onAdded
}: {
  assessmentVersionId: string;
  nextPosition: number;
  onAdded: (question: WorkspaceQuestion) => void;
}) {
  const [code, setCode] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("single_choice");
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState("1");
  const [options, setOptions] = useState<OptionDraft[]>([
    { text: "", correct: true },
    { text: "", correct: false }
  ]);
  const [trueIsCorrect, setTrueIsCorrect] = useState(true);
  const [pairs, setPairs] = useState<PairDraft[]>([
    { left: "", right: "" },
    { left: "", right: "" }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Resume handle when a later step fails (options already written cannot be re-added).
  const [pending, setPending] = useState<{ questionVersionId: string; filled: boolean; published: boolean } | null>(null);

  const validate = (): string | null => {
    if (!pending && (code.trim().length < 2 || !CODE.test(code.trim()))) return "Question code must be alphanumeric (may include . _ -).";
    if (!prompt.trim()) return "Prompt is required.";
    const pts = Number(points);
    if (!Number.isFinite(pts) || pts <= 0 || pts > 1000) return "Points must be greater than 0.";
    if (questionType === "single_choice" || questionType === "multiple_choice") {
      if (options.length < 2 || options.some((o) => !o.text.trim())) return "Provide at least two options, all filled in.";
      const correct = options.filter((o) => o.correct).length;
      if (questionType === "single_choice" && correct !== 1) return "Mark exactly one correct option.";
      if (questionType === "multiple_choice" && correct < 1) return "Mark at least one correct option.";
    }
    if (questionType === "matching" && (pairs.length < 2 || pairs.some((p) => !p.left.trim() || !p.right.trim()))) {
      return "Provide at least two complete matching pairs.";
    }
    return null;
  };

  const writeAnswers = async (questionVersionId: string) => {
    if (questionType === "matching") {
      for (let i = 0; i < pairs.length; i++) {
        const p = pairs[i]!;
        await platformApi.addMatchingPair(questionVersionId, {
          leftKey: `l${i + 1}`,
          leftText: p.left.trim(),
          rightKey: `r${i + 1}`,
          rightText: p.right.trim(),
          position: i + 1
        });
      }
      return;
    }
    const list: OptionDraft[] =
      questionType === "true_false"
        ? [
            { text: "True", correct: trueIsCorrect },
            { text: "False", correct: !trueIsCorrect }
          ]
        : options;
    for (let i = 0; i < list.length; i++) {
      const o = list[i]!;
      await platformApi.addQuestionOption(questionVersionId, {
        optionKey: questionType === "true_false" ? (i === 0 ? "true" : "false") : String.fromCharCode(97 + i),
        optionText: o.text.trim(),
        isCorrect: o.correct,
        position: i + 1
      });
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const problem = validate();
    if (problem) return setError(problem);
    setBusy(true);
    let state = pending;
    let step = "creating the question";
    try {
      if (!state) {
        const question = await platformApi.createQuestion({ code: code.trim() });
        step = "saving the question version";
        const version = await platformApi.createQuestionVersion(question.question.publicId, {
          questionType,
          prompt: prompt.trim(),
          explanation: explanation.trim() || undefined,
          points: Number(points)
        });
        state = { questionVersionId: version.version.id, filled: false, published: false };
      }
      if (!state.filled) {
        step = "saving the answers";
        await writeAnswers(state.questionVersionId);
        state = { ...state, filled: true };
      }
      if (!state.published) {
        step = "publishing the question";
        await platformApi.publishQuestionVersion(state.questionVersionId);
        state = { ...state, published: true };
      }
      step = "adding the question to the assessment";
      await platformApi.attachQuestion(assessmentVersionId, { questionVersionId: state.questionVersionId, position: nextPosition, isRequired: true });
      onAdded({ questionVersionId: state.questionVersionId, code: code.trim(), type: questionType, prompt: prompt.trim(), published: true, attached: true });
      setPending(null);
      setCode("");
      setPrompt("");
      setExplanation("");
      setOptions([
        { text: "", correct: true },
        { text: "", correct: false }
      ]);
      setPairs([
        { left: "", right: "" },
        { left: "", right: "" }
      ]);
      setSuccess("Question published and added.");
    } catch (err) {
      setPending(state);
      if (state) {
        onAdded({
          questionVersionId: state.questionVersionId,
          code: code.trim(),
          type: questionType,
          prompt: prompt.trim(),
          published: state.published,
          attached: false
        });
      }
      setError(
        `Failed while ${step}: ${errorMessage(err)}${
          state && !state.filled ? " Some answers may already be saved; discard and create a new question if a retry fails." : ""
        }`
      );
    } finally {
      setBusy(false);
    }
  };

  const locked = Boolean(pending);

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-white p-4">
      <h5 className="text-[11px] font-black uppercase tracking-wider text-gray-700">Add question {nextPosition}</h5>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Question code" htmlFor={`q-code-${assessmentVersionId}`}>
          <input id={`q-code-${assessmentVersionId}`} className="input font-mono" maxLength={80} value={code} disabled={locked} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Type" htmlFor={`q-type-${assessmentVersionId}`}>
          <select
            id={`q-type-${assessmentVersionId}`}
            className="input"
            value={questionType}
            disabled={locked}
            onChange={(e) => setQuestionType(e.target.value as QuestionType)}
          >
            {AUTHORABLE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Points" htmlFor={`q-pts-${assessmentVersionId}`}>
          <input id={`q-pts-${assessmentVersionId}`} type="number" min="0.5" step="0.5" className="input" value={points} disabled={locked} onChange={(e) => setPoints(e.target.value)} />
        </Field>
      </div>
      <Field label="Prompt" htmlFor={`q-prompt-${assessmentVersionId}`}>
        <textarea id={`q-prompt-${assessmentVersionId}`} className="input min-h-[70px]" maxLength={20_000} value={prompt} disabled={locked} onChange={(e) => setPrompt(e.target.value)} />
      </Field>
      <Field label="Explanation (optional, shown as feedback)" htmlFor={`q-exp-${assessmentVersionId}`}>
        <textarea id={`q-exp-${assessmentVersionId}`} className="input min-h-[50px]" maxLength={20_000} value={explanation} disabled={locked} onChange={(e) => setExplanation(e.target.value)} />
      </Field>

      {(questionType === "single_choice" || questionType === "multiple_choice") && (
        <fieldset className="space-y-2" disabled={locked}>
          <legend className="label">Options (mark the correct {questionType === "single_choice" ? "one" : "ones"})</legend>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={questionType === "single_choice" ? "radio" : "checkbox"}
                name={`correct-${assessmentVersionId}`}
                aria-label={`Option ${i + 1} correct`}
                checked={o.correct}
                onChange={(e) =>
                  setOptions(
                    options.map((x, j) =>
                      questionType === "single_choice" ? { ...x, correct: j === i } : j === i ? { ...x, correct: e.target.checked } : x
                    )
                  )
                }
              />
              <input
                className="input"
                aria-label={`Option ${i + 1} text`}
                maxLength={2000}
                value={o.text}
                onChange={(e) => setOptions(options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              />
              {options.length > 2 && (
                <button type="button" aria-label="Remove option" className="text-gray-400 hover:text-red-600" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className={btnLight} onClick={() => setOptions([...options, { text: "", correct: false }])}>
            <Plus size={12} /> Option
          </button>
        </fieldset>
      )}

      {questionType === "true_false" && (
        <fieldset className="flex gap-4 text-xs font-semibold text-gray-700" disabled={locked}>
          <legend className="label">Correct answer</legend>
          <label className="flex items-center gap-1.5">
            <input type="radio" name={`tf-${assessmentVersionId}`} checked={trueIsCorrect} onChange={() => setTrueIsCorrect(true)} /> True
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name={`tf-${assessmentVersionId}`} checked={!trueIsCorrect} onChange={() => setTrueIsCorrect(false)} /> False
          </label>
        </fieldset>
      )}

      {questionType === "matching" && (
        <fieldset className="space-y-2" disabled={locked}>
          <legend className="label">Pairs (left item matches right item)</legend>
          {pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input"
                aria-label={`Pair ${i + 1} left`}
                placeholder="Term"
                maxLength={2000}
                value={p.left}
                onChange={(e) => setPairs(pairs.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)))}
              />
              <span className="text-gray-400">→</span>
              <input
                className="input"
                aria-label={`Pair ${i + 1} right`}
                placeholder="Match"
                maxLength={2000}
                value={p.right}
                onChange={(e) => setPairs(pairs.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)))}
              />
              {pairs.length > 2 && (
                <button type="button" aria-label="Remove pair" className="text-gray-400 hover:text-red-600" onClick={() => setPairs(pairs.filter((_, j) => j !== i))}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className={btnLight} onClick={() => setPairs([...pairs, { left: "", right: "" }])}>
            <Plus size={12} /> Pair
          </button>
        </fieldset>
      )}

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}
      <div className="flex justify-end gap-2">
        {pending && (
          <button
            type="button"
            className={btnLight}
            onClick={() => {
              setPending(null);
              setError(null);
            }}
          >
            Discard and start over
          </button>
        )}
        <button type="submit" className={btnDark} disabled={busy}>
          {busy ? "Saving…" : pending ? "Retry" : "Publish question & add"}
        </button>
      </div>
    </form>
  );
}
