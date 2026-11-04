"use client";

import { Check, Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/field";
import { useDebounced, useOverviewPage } from "@/lib/api/lists";
import type { CourseOverviewRow } from "@/lib/api/studio";
import { cn } from "@/lib/utils";

/**
 * Search-as-you-type course chooser. It asks the server for a handful of matches per pause in typing, so it
 * stays fast with any number of courses (a plain dropdown would have to download them all).
 */
export function CoursePicker({ value, onChange, id }: { value: string; onChange: (course: CourseOverviewRow) => void; id?: string }) {
  const [text, setText] = useState("");
  const term = useDebounced(text, 300);
  const results = useOverviewPage({ search: term, limit: 6, offset: 0 });
  const rows = results.data?.items ?? [];

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
        <Input id={id} type="search" autoComplete="off" className="pl-10" placeholder="Search your published courses" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <ul className="mt-2 max-h-56 space-y-1 overflow-auto" role="listbox" aria-label="Published courses" data-lenis-prevent>
        {results.isPending ? <li className="px-3 py-2 text-sm text-ink-500">Searching…</li> : null}
        {!results.isPending && rows.length === 0 ? <li className="px-3 py-2 text-sm text-ink-600">{term ? "No published course matches." : "No published courses yet. Create one in the Content studio."}</li> : null}
        {rows.map((c) => {
          const selected = c.uuid === value;
          return (
            <li key={c.uuid} role="option" aria-selected={selected}>
              <button type="button" onClick={() => onChange(c)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors", selected ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-canvas-soft")}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">{c.title}</span>
                  <span className="block text-xs text-ink-600">Version {c.version} · {c.modules} modules · {c.lessons} lessons{c.hasFinal ? " · final exam" : ""}</span>
                </span>
                {selected ? <Check className="size-4 shrink-0 text-brand-700" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {(results.data?.total ?? 0) > rows.length ? <p className="mt-1 px-1 text-xs text-ink-500">Showing {rows.length} of {results.data?.total}. Type to narrow it down.</p> : null}
    </div>
  );
}
