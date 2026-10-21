"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Search } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";
import { platformApi, type PlatformCourse } from "@/features/platform/api";
import { AssessmentsPanel } from "@/features/platform/authoring/AssessmentAuthoring";
import { CourseVersionDetailPanel, CourseVersionsPanel, ModuleLibraryPanel } from "@/features/platform/authoring/ContentAuthoring";
import { useWorkspace } from "@/features/platform/authoring/workspace";
import { AdminPage, btnDark, btnLight, Field, formatDate, Modal, Notice, Pager, Panel, StatusPill } from "@/features/platform/ui";

const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PlatformCourse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const courses = useQuery({
    queryKey: ["platform", "courses", { page, search }],
    queryFn: () => platformApi.courses({ page, pageSize: 25, q: search.trim() || undefined })
  });

  return (
    <AdminPage title="Curriculum & Content Authoring" subtitle="Courses → versions → modules → lessons → publish, plus assessments and question banks">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            aria-label="Search courses"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className={btnDark}>
          <Plus size={14} className="text-secondary-400" /> New course
        </button>
      </div>

      <Panel title="Courses">
        {courses.isPending ? (
          <LoadingState />
        ) : courses.isError ? (
          <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />
        ) : courses.data.items.length === 0 ? (
          <EmptyState title={search ? "No courses match your search" : "No courses yet"} description="Create a course to start authoring." />
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.data.items.map((course) => (
                <button
                  key={course.uuid}
                  type="button"
                  onClick={() => setSelected(course)}
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    selected?.uuid === course.uuid ? "border-primary-600 bg-primary-50/60 shadow-sm" : "border-gray-200 bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">
                      {course.current_version ? `v${course.current_version} live` : "Not published"}
                    </span>
                    <StatusPill status={course.status} />
                  </div>
                  <h3 className="flex items-center gap-1.5 text-sm font-black text-gray-900 line-clamp-1">
                    <BookOpen size={14} className="text-primary-700 shrink-0" /> {course.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-gray-400">Updated {formatDate(course.updated_at)}</p>
                </button>
              ))}
            </div>
            <Pager page={courses.data.page} pages={courses.data.pages} total={courses.data.total} onChange={setPage} />
          </>
        )}
      </Panel>

      {selected && <CourseWorkspace key={selected.uuid} course={selected} />}

      <CreateCourseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async (course) => {
          setCreateOpen(false);
          await queryClient.invalidateQueries({ queryKey: ["platform", "courses"] });
          setSelected(course);
        }}
      />
    </AdminPage>
  );
}

function CourseWorkspace({ course }: { course: PlatformCourse }) {
  const { workspace, update } = useWorkspace(course.uuid);
  const [versionId, setVersionId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900">Authoring · {course.title}</h2>
        <span className="font-mono text-[10px] text-gray-400">{course.uuid}</span>
      </div>
      <CourseVersionsPanel course={course} selectedId={versionId} onSelect={setVersionId} />
      <ModuleLibraryPanel
        workspace={workspace}
        courseVersionId={versionId}
        addModule={(mod) =>
          update((ws) => (ws.modules.some((m) => m.publicId === mod.publicId) ? ws : { ...ws, modules: [...ws.modules, mod] }))
        }
      />
      <AssessmentsPanel course={course} workspace={workspace} update={update} />
      {versionId ? (
        <CourseVersionDetailPanel versionId={versionId} />
      ) : (
        <Panel title="4 · Publish">
          <p className="text-xs text-gray-500">Select a course version in step 1.</p>
        </Panel>
      )}
    </div>
  );
}

function CreateCourseModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (course: PlatformCourse) => void | Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => platformApi.createCourse({ code: code.trim(), title: title.trim() }),
    onSuccess: async (result) => {
      const course: PlatformCourse = { uuid: result.course.publicId, title: title.trim(), status: "draft", current_version: null };
      setCode("");
      setTitle("");
      setFormError(null);
      await onCreated(course);
    },
    onError: (error) => setFormError(errorMessage(error))
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim().length < 2 || !CODE.test(code.trim())) return setFormError("Code must be alphanumeric (may include . _ -).");
    if (!title.trim()) return setFormError("Title is required.");
    create.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="New course" description="Then create a draft version and add modules.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Course code" htmlFor="course-code">
          <input id="course-code" className="input font-mono" maxLength={50} placeholder="e.g. CPMI-2027" value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Title" htmlFor="course-title">
          <input id="course-title" className="input" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        {formError && <Notice tone="error">{formError}</Notice>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnLight} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnDark} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create course"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
