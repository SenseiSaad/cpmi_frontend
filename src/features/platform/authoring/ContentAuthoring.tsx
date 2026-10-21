"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Layers, Plus, Video } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";
import { platformApi, type LessonVersionInput, type PlatformCourse } from "../api";
import { btnDark, btnLight, Field, formatDate, Notice, Panel, StatusPill, useFlash } from "../ui";
import type { Workspace, WorkspaceModule } from "./workspace";

const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIMEO_ID = /^[A-Za-z0-9_-]{1,255}$/;

export const courseKeys = {
  versions: (coursePublicId: string) => ["platform", "authoring", "course", coursePublicId, "versions"] as const,
  courseVersion: (id: string) => ["platform", "authoring", "course-version", id] as const,
  moduleVersions: (modulePublicId: string) => ["platform", "authoring", "module", modulePublicId, "versions"] as const,
  moduleVersion: (id: string) => ["platform", "authoring", "module-version", id] as const
};

// ---- Course versions ----------------------------------------------------------------------

export function CourseVersionsPanel({
  course,
  selectedId,
  onSelect
}: {
  course: PlatformCourse;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const flash = useFlash();
  const versions = useQuery({
    queryKey: courseKeys.versions(course.uuid),
    queryFn: () => platformApi.catalogCourseVersions(course.uuid)
  });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [navigationMode, setNavigationMode] = useState<"sequential" | "free">("sequential");
  const [certificateMode, setCertificateMode] = useState<"none" | "final_only" | "module_and_final">("final_only");

  const create = useMutation({
    mutationFn: () =>
      platformApi.createCourseVersion(course.uuid, {
        title: title.trim(),
        description: description.trim() || undefined,
        navigationMode,
        certificateMode
      }),
    onSuccess: async (result) => {
      flash.success(`Draft version v${result.version.versionNo} created.`);
      setTitle("");
      setDescription("");
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: courseKeys.versions(course.uuid) });
      await queryClient.invalidateQueries({ queryKey: ["platform", "courses"] });
      onSelect(result.version.id);
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return flash.error("Version title is required.");
    create.mutate();
  };

  return (
    <Panel
      title="1 · Course versions"
      description="Each version is an immutable snapshot once published. Author in a draft."
      action={
        <button type="button" className={btnLight} onClick={() => setShowForm((v) => !v)}>
          <Plus size={13} /> New draft version
        </button>
      }
    >
      <div className="space-y-4">
        {flash.node}
        {showForm && (
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <Field label="Version title" htmlFor="cv-title">
              <input id="cv-title" className="input" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Navigation" htmlFor="cv-nav">
              <select id="cv-nav" className="input" value={navigationMode} onChange={(e) => setNavigationMode(e.target.value as "sequential" | "free")}>
                <option value="sequential">Sequential</option>
                <option value="free">Free</option>
              </select>
            </Field>
            <Field label="Certificates" htmlFor="cv-cert">
              <select
                id="cv-cert"
                className="input"
                value={certificateMode}
                onChange={(e) => setCertificateMode(e.target.value as "none" | "final_only" | "module_and_final")}
              >
                <option value="final_only">Final only</option>
                <option value="module_and_final">Module and final</option>
                <option value="none">None</option>
              </select>
            </Field>
            <Field label="Description (optional)" htmlFor="cv-desc">
              <input id="cv-desc" className="input" maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className={btnDark} disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create draft"}
              </button>
            </div>
          </form>
        )}

        {versions.isPending ? (
          <LoadingState />
        ) : versions.isError ? (
          <ErrorState error={versions.error} onRetry={() => void versions.refetch()} />
        ) : versions.data.versions.length === 0 ? (
          <EmptyState title="No versions yet" description="Create the first draft version to start authoring." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {versions.data.versions.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  selectedId === v.id ? "border-primary-600 bg-primary-50 text-primary-900" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                v{v.versionNo} · {v.title} <StatusPill status={v.status} />
              </button>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

export function CourseVersionDetailPanel({ versionId }: { versionId: string }) {
  const queryClient = useQueryClient();
  const flash = useFlash();
  const detail = useQuery({ queryKey: courseKeys.courseVersion(versionId), queryFn: () => platformApi.courseVersion(versionId) });

  const publish = useMutation({
    mutationFn: () => platformApi.publishCourseVersion(versionId),
    onSuccess: async () => {
      flash.success("Course version published. It is now live for new enrollments.");
      await queryClient.invalidateQueries({ queryKey: ["platform", "authoring"] });
      await queryClient.invalidateQueries({ queryKey: ["platform", "courses"] });
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  const v = detail.data.version;

  return (
    <Panel
      title={`4 · Publish v${v.versionNo} · ${v.title}`}
      description={v.publishedAt ? `Published ${formatDate(v.publishedAt)}` : "Attach at least one published module, then publish."}
      action={
        v.status === "draft" ? (
          <button
            type="button"
            className={btnDark}
            disabled={publish.isPending || v.modules.length === 0}
            onClick={() =>
              window.confirm(`Publish v${v.versionNo}? It becomes the live version for new enrollments and cannot be edited.`) && publish.mutate()
            }
          >
            {publish.isPending ? "Publishing…" : "Publish course version"}
          </button>
        ) : (
          <StatusPill status={v.status} />
        )
      }
    >
      <div className="space-y-3">
        {flash.node}
        {v.modules.length === 0 ? (
          <p className="text-xs text-gray-500">No modules attached yet. Attach module versions from step 2.</p>
        ) : (
          <ol className="space-y-2">
            {v.modules.map((m) => (
              <li key={m.moduleVersionId} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                <span className="font-bold text-gray-900">
                  {m.position}. {m.title}
                  {!m.isRequired && <span className="ml-2 font-medium text-gray-400">optional</span>}
                </span>
                <StatusPill status={m.status} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </Panel>
  );
}

// ---- Modules & lessons ---------------------------------------------------------------------

export function ModuleLibraryPanel({
  workspace,
  addModule,
  courseVersionId
}: {
  workspace: Workspace;
  addModule: (mod: WorkspaceModule) => void;
  courseVersionId: string | null;
}) {
  const flash = useFlash();
  const [code, setCode] = useState("");
  const [existing, setExisting] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => platformApi.createModule({ code: code.trim() }),
    onSuccess: (result) => {
      addModule({ publicId: result.module.publicId, code: code.trim() });
      setOpen(result.module.publicId);
      setCode("");
      flash.success("Module created.");
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim().length < 2 || !CODE.test(code.trim())) return flash.error("Module code must be alphanumeric (may include . _ -).");
    create.mutate();
  };

  const addExisting = (event: FormEvent) => {
    event.preventDefault();
    if (!UUID.test(existing.trim())) return flash.error("Enter a valid module public ID.");
    addModule({ publicId: existing.trim().toLowerCase(), code: "(existing)" });
    setOpen(existing.trim().toLowerCase());
    setExisting("");
  };

  return (
    <Panel
      title="2 · Modules & lessons"
      description="Create a module, draft a module version, add lessons (reading HTML or Vimeo video), publish it, then attach it to the course version."
    >
      <div className="space-y-4">
        {flash.node}
        <div className="grid md:grid-cols-2 gap-3">
          <form onSubmit={submit} className="flex gap-2 items-end">
            <div className="flex-1">
              <Field label="New module code" htmlFor="mod-code">
                <input id="mod-code" className="input font-mono" maxLength={50} placeholder="e.g. CPMI-M01" value={code} onChange={(e) => setCode(e.target.value)} />
              </Field>
            </div>
            <button type="submit" className={btnDark} disabled={create.isPending}>
              <Plus size={13} /> Create
            </button>
          </form>
          <form onSubmit={addExisting} className="flex gap-2 items-end">
            <div className="flex-1">
              <Field label="Open existing module (public ID)" htmlFor="mod-existing">
                <input id="mod-existing" className="input font-mono" value={existing} onChange={(e) => setExisting(e.target.value)} />
              </Field>
            </div>
            <button type="submit" className={btnLight}>
              Open
            </button>
          </form>
        </div>

        {workspace.modules.length === 0 ? (
          <EmptyState title="No modules in this workspace" description="Modules created here are remembered in this browser for this course." />
        ) : (
          <div className="space-y-3">
            {workspace.modules.map((mod) => (
              <div key={mod.publicId} className="rounded-2xl border border-gray-200">
                <button
                  type="button"
                  aria-expanded={open === mod.publicId}
                  onClick={() => setOpen(open === mod.publicId ? null : mod.publicId)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-black text-gray-900">
                    <Layers size={14} className="text-primary-700" /> {mod.code}
                  </span>
                  <span className="font-mono text-[10px] text-gray-400">{mod.publicId}</span>
                </button>
                {open === mod.publicId && <ModuleEditor mod={mod} courseVersionId={courseVersionId} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function ModuleEditor({ mod, courseVersionId }: { mod: WorkspaceModule; courseVersionId: string | null }) {
  const queryClient = useQueryClient();
  const flash = useFlash();
  const versions = useQuery({ queryKey: courseKeys.moduleVersions(mod.publicId), queryFn: () => platformApi.moduleVersions(mod.publicId) });
  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: () => platformApi.createModuleVersion(mod.publicId, { title: title.trim(), description: description.trim() || undefined }),
    onSuccess: async (result) => {
      setTitle("");
      setDescription("");
      setSelected(result.version.id);
      flash.success(`Module version v${result.version.versionNo} created.`);
      await queryClient.invalidateQueries({ queryKey: courseKeys.moduleVersions(mod.publicId) });
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  const activeId = selected ?? versions.data?.versions[0]?.id ?? null;

  return (
    <div className="border-t border-gray-100 p-4 space-y-4">
      {flash.node}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return flash.error("Module version title is required.");
          create.mutate();
        }}
        className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
      >
        <Field label="New module version title" htmlFor={`mv-title-${mod.publicId}`}>
          <input id={`mv-title-${mod.publicId}`} className="input" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Description (optional)" htmlFor={`mv-desc-${mod.publicId}`}>
          <input id={`mv-desc-${mod.publicId}`} className="input" maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <button type="submit" className={btnLight} disabled={create.isPending}>
          <Plus size={13} /> Draft version
        </button>
      </form>

      {versions.isPending ? (
        <LoadingState />
      ) : versions.isError ? (
        <ErrorState error={versions.error} onRetry={() => void versions.refetch()} />
      ) : versions.data.versions.length === 0 ? (
        <p className="text-xs text-gray-500">No versions yet.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {versions.data.versions.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelected(v.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                  activeId === v.id ? "border-primary-600 bg-primary-50 text-primary-900" : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                v{v.versionNo} · {v.title} <StatusPill status={v.status} />
              </button>
            ))}
          </div>
          {activeId && <ModuleVersionEditor mod={mod} versionId={activeId} courseVersionId={courseVersionId} />}
        </>
      )}
    </div>
  );
}

function ModuleVersionEditor({ mod, versionId, courseVersionId }: { mod: WorkspaceModule; versionId: string; courseVersionId: string | null }) {
  const queryClient = useQueryClient();
  const flash = useFlash();
  const detail = useQuery({ queryKey: courseKeys.moduleVersion(versionId), queryFn: () => platformApi.moduleVersion(versionId) });
  const courseVersion = useQuery({
    queryKey: courseKeys.courseVersion(courseVersionId ?? ""),
    queryFn: () => platformApi.courseVersion(courseVersionId!),
    enabled: Boolean(courseVersionId)
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: courseKeys.moduleVersion(versionId) });
    await queryClient.invalidateQueries({ queryKey: courseKeys.moduleVersions(mod.publicId) });
  };

  const publish = useMutation({
    mutationFn: () => platformApi.publishModuleVersion(versionId),
    onSuccess: async () => {
      flash.success("Module version published.");
      await refresh();
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  const attach = useMutation({
    mutationFn: (input: { position: number; isRequired: boolean }) =>
      platformApi.attachModule(courseVersionId!, { moduleVersionId: versionId, position: input.position, isRequired: input.isRequired }),
    onSuccess: async () => {
      flash.success("Module attached to the course version.");
      await queryClient.invalidateQueries({ queryKey: courseKeys.courseVersion(courseVersionId!) });
    },
    onError: (error) => flash.error(errorMessage(error))
  });
  const [moduleRequired, setModuleRequired] = useState(true);

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  const v = detail.data.version;
  const cv = courseVersion.data?.version;
  const alreadyAttached = cv?.modules.some((m) => m.moduleVersionId === v.id) ?? false;

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
      {flash.node}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-black text-gray-900">
          v{v.versionNo} · {v.title} — {v.lessons.length} lesson{v.lessons.length === 1 ? "" : "s"}
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {v.status === "draft" && (
            <button
              type="button"
              className={btnDark}
              disabled={publish.isPending || v.lessons.length === 0}
              onClick={() => window.confirm("Publish this module version? Its lesson list becomes immutable.") && publish.mutate()}
            >
              Publish module version
            </button>
          )}
          {v.status === "published" && courseVersionId && cv?.status === "draft" && !alreadyAttached && (
            <>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-600">
                <input type="checkbox" checked={moduleRequired} onChange={(e) => setModuleRequired(e.target.checked)} /> Required
              </label>
              <button
                type="button"
                className={btnLight}
                disabled={attach.isPending}
                onClick={() => attach.mutate({ position: (cv?.modules.length ?? 0) + 1, isRequired: moduleRequired })}
              >
                Attach to course v{cv.versionNo} (position {(cv?.modules.length ?? 0) + 1})
              </button>
            </>
          )}
          {alreadyAttached && <span className="text-[11px] font-bold text-emerald-700">Attached to selected course version</span>}
        </div>
      </div>
      {v.status === "published" && !courseVersionId && <p className="text-[11px] text-gray-500">Select a draft course version in step 1 to attach this module.</p>}
      {v.status === "published" && cv && cv.status !== "draft" && (
        <p className="text-[11px] text-gray-500">The selected course version is published; create a new draft to attach modules.</p>
      )}

      {v.lessons.length > 0 && (
        <ol className="space-y-1.5">
          {v.lessons.map((l) => (
            <li key={l.lessonVersionId} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 font-bold text-gray-900">
                {l.lessonType === "video" ? <Video size={13} className="text-primary-700" /> : <FileText size={13} className="text-secondary-600" />}
                {l.position}. {l.title}
                {!l.isRequired && <span className="font-medium text-gray-400">optional</span>}
              </span>
              <StatusPill status={l.status} />
            </li>
          ))}
        </ol>
      )}

      {v.status === "draft" && (
        <LessonForm modulePublicId={mod.publicId} moduleVersionId={v.id} nextPosition={v.lessons.length + 1} onDone={refresh} />
      )}
    </div>
  );
}

type Step = "lesson" | "version" | "publish" | "attach";
const STEP_LABEL: Record<Step, string> = {
  lesson: "creating the lesson",
  version: "saving the lesson content",
  publish: "publishing the lesson version",
  attach: "attaching the lesson to the module"
};

function LessonForm({
  modulePublicId,
  moduleVersionId,
  nextPosition,
  onDone
}: {
  modulePublicId: string;
  moduleVersionId: string;
  nextPosition: number;
  onDone: () => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [lessonType, setLessonType] = useState<"reading" | "video" | "resource">("reading");
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [videoAssetId, setVideoAssetId] = useState("");
  const [duration, setDuration] = useState("");
  const [completionRule, setCompletionRule] = useState<"open" | "manual" | "video_percent">("open");
  const [threshold, setThreshold] = useState("90");
  const [isRequired, setIsRequired] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Resume state if a multi-step save fails half way.
  const [pending, setPending] = useState<{ lessonPublicId?: string; lessonVersionId?: string; published?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = (): LessonVersionInput | null => {
    if (!pending?.lessonPublicId && (code.trim().length < 2 || !CODE.test(code.trim()))) {
      setError("Lesson code must be alphanumeric (may include . _ -).");
      return null;
    }
    if (!title.trim()) {
      setError("Lesson title is required.");
      return null;
    }
    if (lessonType === "video" && !VIMEO_ID.test(videoAssetId.trim())) {
      setError("Enter the Vimeo video ID (e.g. 76979871).");
      return null;
    }
    if (completionRule === "video_percent" && lessonType !== "video") {
      setError("Watch-percentage completion needs a video lesson.");
      return null;
    }
    const durationSeconds = duration.trim() ? Math.round(Number(duration) * 60) : undefined;
    if (durationSeconds !== undefined && (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 86_400)) {
      setError("Duration must be between 1 and 1440 minutes.");
      return null;
    }
    const thresholdValue = Number(threshold);
    if (completionRule === "video_percent" && (!Number.isFinite(thresholdValue) || thresholdValue <= 0 || thresholdValue > 100)) {
      setError("Watch threshold must be between 1 and 100 percent.");
      return null;
    }
    return {
      lessonType,
      title: title.trim(),
      bodyHtml: bodyHtml.trim() || undefined,
      videoAssetId: lessonType === "video" ? videoAssetId.trim() : undefined,
      durationSeconds,
      completionRule,
      completionThreshold: completionRule === "video_percent" ? thresholdValue : undefined
    };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const payload = validate();
    if (!payload) return;
    setBusy(true);
    const state = { ...(pending ?? {}) };
    let step: Step = "lesson";
    try {
      if (!state.lessonPublicId) {
        state.lessonPublicId = (await platformApi.createLesson(modulePublicId, { code: code.trim() })).lesson.publicId;
      }
      step = "version";
      if (!state.lessonVersionId) {
        state.lessonVersionId = (await platformApi.createLessonVersion(state.lessonPublicId, payload)).version.id;
      }
      step = "publish";
      if (!state.published) {
        await platformApi.publishLessonVersion(state.lessonVersionId);
        state.published = true;
      }
      step = "attach";
      await platformApi.attachLesson(moduleVersionId, { lessonVersionId: state.lessonVersionId, position: nextPosition, isRequired });
      setPending(null);
      setCode("");
      setTitle("");
      setBodyHtml("");
      setVideoAssetId("");
      setDuration("");
      setSuccess("Lesson published and added to the module.");
      await onDone();
    } catch (err) {
      setPending(state);
      setError(`Failed while ${STEP_LABEL[step]}: ${errorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const locked = Boolean(pending?.lessonVersionId);

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-white p-4">
      <h5 className="text-[11px] font-black uppercase tracking-wider text-gray-700">Add lesson {nextPosition}</h5>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Lesson code" htmlFor={`l-code-${moduleVersionId}`}>
          <input
            id={`l-code-${moduleVersionId}`}
            className="input font-mono"
            maxLength={50}
            value={code}
            disabled={Boolean(pending?.lessonPublicId)}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>
        <Field label="Type" htmlFor={`l-type-${moduleVersionId}`}>
          <select
            id={`l-type-${moduleVersionId}`}
            className="input"
            value={lessonType}
            disabled={locked}
            onChange={(e) => {
              const next = e.target.value as "reading" | "video" | "resource";
              setLessonType(next);
              if (next !== "video" && completionRule === "video_percent") setCompletionRule("open");
            }}
          >
            <option value="reading">Reading (HTML)</option>
            <option value="video">Video (Vimeo)</option>
            <option value="resource">Resource</option>
          </select>
        </Field>
        <Field label="Title" htmlFor={`l-title-${moduleVersionId}`}>
          <input id={`l-title-${moduleVersionId}`} className="input" maxLength={200} value={title} disabled={locked} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </div>
      {lessonType === "video" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Vimeo video ID" htmlFor={`l-vid-${moduleVersionId}`} hint="The number at the end of the Vimeo URL.">
            <input id={`l-vid-${moduleVersionId}`} className="input font-mono" value={videoAssetId} disabled={locked} onChange={(e) => setVideoAssetId(e.target.value)} />
          </Field>
          <Field label="Duration (minutes, optional)" htmlFor={`l-dur-${moduleVersionId}`}>
            <input id={`l-dur-${moduleVersionId}`} type="number" min="1" className="input" value={duration} disabled={locked} onChange={(e) => setDuration(e.target.value)} />
          </Field>
        </div>
      )}
      <Field
        label={lessonType === "video" ? "Notes (HTML, optional)" : "Body (HTML)"}
        htmlFor={`l-body-${moduleVersionId}`}
        hint="Sanitized on the server; scripts and inline handlers are removed."
      >
        <textarea
          id={`l-body-${moduleVersionId}`}
          className="input font-mono min-h-[120px]"
          maxLength={200_000}
          value={bodyHtml}
          disabled={locked}
          onChange={(e) => setBodyHtml(e.target.value)}
        />
      </Field>
      <div className="grid sm:grid-cols-3 gap-3 items-end">
        <Field label="Completion rule" htmlFor={`l-rule-${moduleVersionId}`}>
          <select
            id={`l-rule-${moduleVersionId}`}
            className="input"
            value={completionRule}
            disabled={locked}
            onChange={(e) => setCompletionRule(e.target.value as "open" | "manual" | "video_percent")}
          >
            <option value="open">Complete on open</option>
            <option value="manual">Learner marks complete</option>
            {lessonType === "video" && <option value="video_percent">Watch percentage</option>}
          </select>
        </Field>
        {completionRule === "video_percent" ? (
          <Field label="Watch threshold (%)" htmlFor={`l-thr-${moduleVersionId}`}>
            <input id={`l-thr-${moduleVersionId}`} type="number" min="1" max="100" className="input" value={threshold} disabled={locked} onChange={(e) => setThreshold(e.target.value)} />
          </Field>
        ) : (
          <span />
        )}
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} /> Required lesson
        </label>
      </div>
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
          {busy ? "Saving…" : pending ? "Retry" : "Publish lesson & add to module"}
        </button>
      </div>
    </form>
  );
}
